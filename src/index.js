require("dotenv").config();
const { Client, GatewayIntentBits, EmbedBuilder } = require("discord.js");
const Lavalink = require("./lavalink");
const PlayerManager = require("./player");

const token = process.env.DISCORD_TOKEN;
if (!token) throw new Error("Set DISCORD_TOKEN in your .env file.");
const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent, GatewayIntentBits.GuildVoiceStates]
});
const lavalink = new Lavalink(client, {
  host: process.env.LAVALINK_HOST || "127.0.0.1",
  port: Number(process.env.LAVALINK_PORT || 2333),
  password: process.env.LAVALINK_PASSWORD || "youshallnotpass",
  secure: process.env.LAVALINK_SECURE === "true"
});
let players;

const prefix = process.env.BOT_PREFIX || ".";
const embed = (title, description) => new EmbedBuilder()
  .setColor(0xE50924).setTitle(title).setDescription(description)
  .setFooter({ text: "LEVIBE • Feel the Beat. Own the Vibe." });

client.once("ready", () => {
  players = new PlayerManager(client, lavalink);
  lavalink.connect();
  console.log(`LEVIBE online as ${client.user.tag}`);
  client.user.setActivity("the vibe • .help");
});
lavalink.on("ready", () => console.log("Connected to Lavalink."));
lavalink.on("error", error => console.error("Lavalink:", error.message));
lavalink.on("disconnected", () => console.warn("Lavalink disconnected; restart/reconnect the node before playback."));

client.on("messageCreate", async message => {
  if (message.author.bot || !message.guild || !message.content.startsWith(prefix)) return;
  const [rawCommand, ...args] = message.content.slice(prefix.length).trim().split(/\s+/);
  const command = (rawCommand || "").toLowerCase();
  const input = args.join(" ");
  const player = players?.get(message.guild.id);
  try {
    if (command === "help") {
      return message.reply({ embeds: [embed("LEVIBE Commands",
        "`.play <song or URL>` — play or queue a track\n`.skip` — skip current track\n`.pause` / `.resume` — control playback\n`.queue` — view this server's queue\n`.nowplaying` — current track\n`.stop` — clear queue and leave voice\n`.help` — show commands")] });
    }
    if (command === "play") {
      if (!input) return message.reply("Tell me a song name or provide a supported audio URL.");
      if (!message.member.voice.channel) return message.reply("Join a voice channel first.");
      if (!lavalink.ready) return message.reply("Music service is connecting. Try again in a moment.");
      const identifier = /^(https?:\/\/)/i.test(input) ? input : `ytsearch:${input}`;
      const result = await players.play(message, identifier);
      return message.reply({ embeds: [embed("Added to the vibe", `**[${result.track.info.title}](${result.track.info.uri || ""})**\nPosition in queue: **${result.position}**`)] });
    }
    if (command === "skip") { await players.skip(message.guild.id); return message.reply("Skipped."); }
    if (command === "pause") { await players.pause(message.guild.id, true); return message.reply("Paused."); }
    if (command === "resume") { await players.pause(message.guild.id, false); return message.reply("Resumed."); }
    if (command === "stop") { await players.stop(message.guild.id); return message.reply("Queue cleared. Playback stopped."); }
    if (command === "nowplaying") {
      if (!player?.current) return message.reply("Nothing is playing.");
      return message.reply({ embeds: [embed("Now Playing", `**${player.current.info.title}**`)] });
    }
    if (command === "queue") {
      if (!player?.current) return message.reply("The queue is empty.");
      const upcoming = player.queue.slice(0, 10).map((t, i) => `${i + 1}. ${t.info.title}`);
      return message.reply({ embeds: [embed("Server Queue", `**Now:** ${player.current.info.title}\n\n${upcoming.join("\n") || "No upcoming tracks."}`)] });
    }
  } catch (error) {
    return message.reply({ embeds: [embed("Couldn't do that", error.message || "Something went wrong.")] });
  }
});
client.login(token);
