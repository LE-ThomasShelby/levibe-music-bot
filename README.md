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

Copy `.env.example` to `.env`, fill in the values, then run `npm install` and `npm start`.

## Important setup notes

This repository is a starter, not a hosted or production-ready service. It does not include a Lavalink server, hosting, persistent queues, dashboards, or guaranteed 24/7 uptime. Playback will not work until Lavalink is separately installed, configured, reachable, and loaded with a compatible source plugin. YouTube and other source integrations can change; use only supported, permitted integrations and do not bypass access restrictions.

The bot uses Shoukaku to handle Lavalink voice connections. Queues are isolated by Discord server but stored in memory, so they reset if the bot restarts. Before a large public deployment, add monitoring, automated tests, persistent settings, operational alerts, and verify reconnection behavior under your hosting setup.

## Branding

LEVIBE • red / black / white • “Feel the Beat. Own the Vibe.”
