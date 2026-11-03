# LEVIBE

**Feel the Beat. Own the Vibe.**
A red-and-black Discord music bot with prefix commands and a separate in-memory queue for each server.

## Commands

- `.play <song name or supported URL>`
- `.skip`
- `.pause` / `.resume`
- `.queue`
- `.nowplaying`
- `.stop`
- `.help`

Users must join a voice channel before requesting music. The bot needs **View Channel**, **Send Messages**, **Embed Links**, **Connect**, and **Speak** permissions. Enable the **Message Content Intent** in the Discord Developer Portal.

## Northflank deployment files

The repository now includes a two-service Docker layout:

- `Dockerfile` builds the Discord bot.
- `Dockerfile.lavalink` builds the separate Lavalink audio service.
- `northflank/application.yml` configures Lavalink with SoundCloud search enabled.
- Keep Lavalink private inside the same project; the bot connects to it using the internal service name.

**Account eligibility:** Northflank's terms require the account holder to be legally eligible and not a minor in their jurisdiction. Do not create an account using false details or use another person's login. A parent or guardian would need to independently review the terms and, if they choose, own and operate the hosting account. Northflank currently advertises a free Developer Sandbox with no card required, two services and always-on compute, but its documentation says the sandbox is for testing rather than production. Limits and availability can change.

### Adult-operated setup outline

1. The adult account owner selects the **Developer Sandbox** plan and checks the current resource limits before creating anything. Do not add a payment method or select an upgrade.
2. Create one project and add a service named `lavalink` from this GitHub repository using `Dockerfile.lavalink`. Add a private TCP port on `2333`. Set a strong `LAVALINK_PASSWORD` as a service secret.
3. Add a second service named `levibe-bot` from the same repository using `Dockerfile`. Set these environment variables in the service's secret/environment settings:
   - `DISCORD_TOKEN` = the bot token (never commit or share it)
   - `LAVALINK_HOST` = `lavalink`
   - `LAVALINK_PORT` = `2333`
   - `LAVALINK_PASSWORD` = the exact same secret as the Lavalink service
   - `LAVALINK_SECURE` = `false`
   - `BOT_PREFIX` = `.`
4. Keep the Lavalink port private and do not expose either service publicly unless a later feature specifically requires it.
5. Check both service logs. The bot should log in and the Lavalink node should become ready before testing playback.

The two-service layout is deployment configuration, not proof that the bot is live. Voice playback, outbound UDP connectivity, source availability, and the free resource allowance must be tested in the actual project. If a free limit is reached, stop the deployment rather than upgrading or adding billing details.

## Local setup

Requirements: Node.js 20+, a Discord bot token, and a reachable Lavalink v4 server. Copy `.env.example` to `.env`, fill in the values, then run `npm install` and `npm start`.

## Current limitations

Queues are isolated by Discord server but stored in memory, so they reset if the bot restarts. This is an early starter, not a production service: persistent queues, dashboard controls, automated playback tests, monitoring, and guaranteed 24/7 uptime are not included. SoundCloud search is used for text queries because the bundled Lavalink configuration does not enable YouTube. Use only sources you are permitted to access; source compatibility can change.

## Branding

LEVIBE • red / black / white • “Feel the Beat. Own the Vibe.”
