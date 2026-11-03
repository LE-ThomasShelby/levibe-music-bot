require("dotenv").config();
const { Client, GatewayIntentBits, EmbedBuilder } = require("discord.js");
const { Shoukaku, Connectors } = require("shoukaku");
const PlayerManager = require("./player");

if (!process.env.DISCORD_TOKEN) throw new Error("Set DISCORD_TOKEN in your .env file.");
const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent, GatewayIntentBits.GuildVoiceStates]
});
const shoukaku = new Shoukaku(new Connectors.DiscordJS(client), [{
  name: "LEVIBE-NODE",
  url: (process.env.LAVALINK_HOST || "127.0.0.1") + ":" + (process.env.LAVALINK_PORT || "2333"),
  auth: process.env.LAVALINK_PASSWORD || "youshallnotpass",
  secure: process.env.LAVALINK_SECURE === "true"
}], { moveOnDisconnect: false, resume: true, reconnectTries: 5, reconnectInterval: 5 });
const prefix = process.env.BOT_PREFIX || ".";
const makeEmbed = (title, description) => new EmbedBuilder()
  .setColor(0xE50924).setTitle(title).setDescription(description)
  .setFooter({ text: "LEVIBE • Feel the Beat. Own the Vibe." });
let players;

client.once("ready", () => {
  players = new PlayerManager(client, shoukaku);
  console.log("LEVIBE online as " + client.user.tag);
  client.user.setActivity("the vibe • .help");
});
shoukaku.on("ready", (name) => console.log("Lavalink node ready: " + name));
shoukaku.on("error", (name, error) => console.error("Lavalink " + name + ":", error));
shoukaku.on("close", (name, code, reason) => console.warn("Lavalink closed:", name, code, reason));

client.on("messageCreate", async message => {
  if (message.author.bot || !message.guild || !message.content.startsWith(prefix)) return;
  const [rawCommand, ...args] = message.content.slice(prefix.length).trim().split(/\s+/);
  const command = (rawCommand || "").toLowerCase();
  const input = args.join(" ");
  const state = players?.get(message.guild.id);
  try {
    if (command === "help") return message.reply({ embeds: [makeEmbed("LEVIBE Commands",
      "`.play <song or URL>` — play or queue\n`.skip` — skip\n`.pause` / `.resume` — playback controls\n`.queue` — this server's queue\n`.nowplaying` — current track\n`.stop` — clear and leave\n`.help` — commands")] });
    if (command === "play") {
      if (!input) return message.reply("Give me a song name or supported audio URL.");
      if (!message.member.voice.channel) return message.reply("Join a voice channel first.");
      const identifier = /^https?:\/\//i.test(input) ? input : "ytsearch:" + input;
      const result = await players.play(message, identifier);
      return message.reply({ embeds: [makeEmbed("Added to the vibe", "**" + result.track.info.title + "**\nQueue position: **" + result.position + "**")] });
    }
    if (command === "skip") { await players.skip(message.guild.id); return message.reply("Skipped."); }
    if (command === "pause") { await players.pause(message.guild.id, true); return message.reply("Paused."); }
    if (command === "resume") { await players.pause(message.guild.id, false); return message.reply("Resumed."); }
    if (command === "stop") { await players.stop(message.guild.id); return message.reply("Queue cleared. Playback stopped."); }
    if (command === "nowplaying") {
      if (!state?.current) return message.reply("Nothing is playing.");
      return message.reply({ embeds: [makeEmbed("Now Playing", "**" + state.current.info.title + "**")] });
    }
    if (command === "queue") {
      if (!state?.current) return message.reply("The queue is empty.");
      const upcoming = state.queue.slice(0, 10).map((track, i) => (i + 1) + ". " + track.info.title);
      return message.reply({ embeds: [makeEmbed("Server Queue", "**Now:** " + state.current.info.title + "\n\n" + (upcoming.join("\n") || "No upcoming tracks."))] });
    }
  } catch (error) {
    return message.reply({ embeds: [makeEmbed("Couldn't do that", error.message || "Something went wrong.")] });
  }
});
client.login(process.env.DISCORD_TOKEN);
