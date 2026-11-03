class PlayerManager {
  constructor(client, shoukaku) {
    this.client = client;
    this.shoukaku = shoukaku;
    this.players = new Map();
  }
  get(guildId) { return this.players.get(guildId); }
  async getOrCreate(message) {
    const guildId = message.guild.id;
    const existing = this.get(guildId);
    if (existing) {
      if (existing.voiceChannelId !== message.member.voice.channel?.id) {
        throw new Error("Join the voice channel where LEVIBE is already playing.");
      }
      return existing;
    }
    const voice = message.member.voice.channel;
    if (!voice) throw new Error("Join a voice channel first.");
    const me = message.guild.members.me;
    const permissions = voice.permissionsFor(me);
    if (!permissions?.has(["Connect", "Speak"])) throw new Error("I need Connect and Speak permissions in that voice channel.");
    const player = await this.shoukaku.joinVoiceChannel({
      guildId, channelId: voice.id, shardId: message.guild.shardId,
      deafened: true, muted: false
    });
    const state = { guildId, voiceChannelId: voice.id, textChannelId: message.channel.id, player, queue: [], current: null, volume: 80 };
    this.players.set(guildId, state);
    player.on("end", async event => {
      if (event.reason === "replaced") return;
      await this.startNext(state).catch(error => this.report(state, error));
    });
    player.on("exception", event => this.report(state, new Error(event.exception?.message || "Playback exception.")));
    player.on("closed", () => {
      this.players.delete(guildId);
    });
    return state;
  }
  async play(message, identifier) {
    const state = await this.getOrCreate(message);
    const node = this.shoukaku.getNode();
    const result = await node.rest.resolve(identifier);
    const tracks = result?.tracks || [];
    if (!tracks.length) throw new Error("No playable tracks found. Check your Lavalink source plugin.");
    const track = tracks[0];
    state.queue.push(track);
    const position = state.queue.length + (state.current ? 1 : 0);
    if (!state.current) await this.startNext(state);
    return { track, position };
  }
  async startNext(state) {
    state.current = state.queue.shift() || null;
    if (!state.current) {
      this.players.delete(state.guildId);
      await state.player.destroy();
      return;
    }
    await state.player.playTrack({ track: { encoded: state.current.encoded } });
  }
  async skip(guildId) {
    const state = this.get(guildId);
    if (!state?.current) throw new Error("Nothing is playing.");
    await state.player.stopTrack();
  }
  async pause(guildId, paused) {
    const state = this.get(guildId);
    if (!state?.current) throw new Error("Nothing is playing.");
    await state.player.setPaused(paused);
  }
  async stop(guildId) {
    const state = this.get(guildId);
    if (!state) throw new Error("Nothing is playing.");
    state.queue = [];
    state.current = null;
    this.players.delete(guildId);
    await state.player.destroy();
  }
  report(state, error) {
    this.client.channels.cache.get(state.textChannelId)?.send("LEVIBE • " + error.message).catch(() => {});
  }
}
module.exports = PlayerManager;
