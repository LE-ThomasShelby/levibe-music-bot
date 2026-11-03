class PlayerManager {
  constructor(client, lavalink) {
    this.client = client;
    this.lavalink = lavalink;
    this.players = new Map();
    lavalink.on("event", event => this.onEvent(event));
  }
  get(guildId) { return this.players.get(guildId); }
  async create(message) {
    const guildId = message.guild.id;
    const existing = this.get(guildId);
    if (existing) return existing;
    const voice = message.member.voice.channel;
    if (!voice) throw new Error("Join a voice channel first.");
    const me = message.guild.members.me;
    const permissions = voice.permissionsFor(me);
    if (!permissions?.has(["Connect", "Speak"])) throw new Error("I need Connect and Speak permissions in that voice channel.");
    const player = {
      guildId, textChannelId: message.channel.id, voiceChannelId: voice.id,
      queue: [], current: null, volume: 80, paused: false
    };
    this.players.set(guildId, player);
    try {
      await this.lavalink.updatePlayer(guildId, {
        voice: { token: message.guild.voiceAdapterCreator ? undefined : undefined }
      });
    } catch (error) {
      this.players.delete(guildId);
      throw error;
    }
    return player;
  }
  async connect(message, player) {
    const voice = message.member.voice.channel;
    const connection = await message.guild.voiceAdapterCreator;
    void connection;
    await message.guild.members.me.voice.setChannel(voice);
    player.voiceChannelId = voice.id;
  }
  async play(message, identifier) {
    const player = this.get(message.guild.id) || await this.create(message);
    if (player.voiceChannelId !== message.member.voice.channel?.id) throw new Error("Join my current voice channel to control this queue.");
    const result = await this.lavalink.loadTracks(identifier);
    const tracks = result.tracks || [];
    if (!tracks.length) throw new Error("No playable tracks found. Check the Lavalink source plugin and try another search.");
    const track = tracks[0];
    player.queue.push(track);
    if (!player.current) await this.startNext(player);
    return { track, position: player.queue.length };
  }
  async startNext(player) {
    player.current = player.queue.shift() || null;
    if (!player.current) {
      await this.lavalink.destroyPlayer(player.guildId).catch(() => {});
      this.players.delete(player.guildId);
      return;
    }
    await this.lavalink.updatePlayer(player.guildId, {
      track: { encoded: player.current.encoded },
      volume: player.volume,
      paused: false
    });
    player.paused = false;
  }
  async onEvent(event) {
    const player = this.get(event.guildId);
    if (!player) return;
    if (event.type === "TrackEndEvent" && ["finished", "loadFailed", "cleanup"].includes(event.reason)) {
      await this.startNext(player).catch(error => this.emitError(player, error));
    }
    if (event.type === "WebSocketClosedEvent") this.emitError(player, new Error("Voice connection closed."));
  }
  async skip(guildId) {
    const player = this.get(guildId);
    if (!player?.current) throw new Error("Nothing is playing.");
    await this.lavalink.updatePlayer(guildId, { track: { encoded: null } });
    await this.startNext(player);
  }
  async pause(guildId, paused) {
    const player = this.get(guildId);
    if (!player?.current) throw new Error("Nothing is playing.");
    await this.lavalink.updatePlayer(guildId, { paused });
    player.paused = paused;
  }
  async stop(guildId) {
    const player = this.get(guildId);
    if (!player) throw new Error("Nothing is playing.");
    player.queue = [];
    player.current = null;
    await this.lavalink.destroyPlayer(guildId);
    this.players.delete(guildId);
  }
  emitError(player, error) {
    const channel = this.client.channels.cache.get(player.textChannelId);
    channel?.send({ content: `LEVIBE • ${error.message}` }).catch(() => {});
  }
}
module.exports = PlayerManager;
