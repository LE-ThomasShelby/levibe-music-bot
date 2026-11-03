# LEVIBE

**Feel the Beat. Own the Vibe.**  
A red-and-black Discord music bot starter with prefix commands and a separate in-memory queue for each server.

## Commands

- `.play <song name or supported URL>`
- `.skip`
- `.pause` / `.resume`
- `.queue`
- `.nowplaying`
- `.stop`
- `.help`

Users must join a voice channel before requesting music. The bot needs **View Channel**, **Send Messages**, **Embed Links**, **Connect**, and **Speak** permissions. Enable the **Message Content Intent** in the Discord Developer Portal.

## Requirements

- Node.js 20+
- A Discord application/bot token
- A reachable Lavalink v4 server and a compatible, legally permitted audio-source plugin

Copy `.env.example` to `.env` and fill in the values. Then run `npm install` and `npm start`.

## Important setup notes

This repository is a starter, not a hosted or production-ready service. It does not include a Lavalink server, hosting, persistent queues, dashboards, or 24/7 uptime. The bot cannot play audio until Lavalink is separately installed, configured, reachable, and loaded with a compatible source plugin. YouTube and other sources can change their access rules; use only supported, permitted integrations and do not bypass restrictions.

The queues are isolated by Discord server but stored in memory, so they reset if the bot restarts. For a public multi-server deployment, add reconnect handling, robust voice-state synchronization, rate limits, monitoring, tests, and a reliable host before inviting large numbers of servers.

## Branding

LEVIBE • red / black / white • “Feel the Beat. Own the Vibe.”
