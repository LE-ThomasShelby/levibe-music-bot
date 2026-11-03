const WebSocket = require("ws");
const { EventEmitter } = require("node:events");

class Lavalink extends EventEmitter {
  constructor(client, config) {
    super();
    this.client = client;
    this.config = config;
    this.socket = null;
    this.ready = false;
    this.sequence = 0;
  }
  get base() {
    return `${this.config.secure ? "https" : "http"}://${this.config.host}:${this.config.port}`;
  }
  headers() {
    return {
      Authorization: this.config.password,
      "Content-Type": "application/json",
      "User-Id": this.client.user.id,
      "Client-Name": "LEVIBE/1.0"
    };
  }
  connect() {
    const scheme = this.config.secure ? "wss" : "ws";
    const url = `${scheme}://${this.config.host}:${this.config.port}/v4/websocket`;
    this.socket = new WebSocket(url, { headers: {
      Authorization: this.config.password,
      "User-Id": this.client.user.id,
      "Client-Name": "LEVIBE/1.0"
    }});
    this.socket.on("open", () => this.emit("connected"));
    this.socket.on("message", raw => {
      let packet;
      try { packet = JSON.parse(raw.toString()); } catch { return; }
      if (packet.op === "ready") {
        this.ready = true;
        this.sessionId = packet.sessionId;
        this.emit("ready", packet);
      } else if (packet.op === "event") this.emit("event", packet);
      else if (packet.op === "stats") this.emit("stats", packet);
    });
    this.socket.on("close", () => { this.ready = false; this.emit("disconnected"); });
    this.socket.on("error", error => this.emit("error", error));
  }
  async request(path, options = {}) {
    const response = await fetch(this.base + path, {
      ...options,
      headers: { ...this.headers(), ...(options.headers || {}) }
    });
    if (!response.ok) {
      const body = await response.text();
      throw new Error(`Lavalink ${response.status}: ${body.slice(0, 300)}`);
    }
    if (response.status === 204) return null;
    return response.json();
  }
  async updatePlayer(guildId, data, noReplace = false) {
    if (!this.sessionId) throw new Error("Lavalink is not ready.");
    const query = noReplace ? "?noReplace=true" : "";
    return this.request(`/v4/sessions/${this.sessionId}/players/${guildId}${query}`, {
      method: "PATCH", body: JSON.stringify(data)
    });
  }
  async destroyPlayer(guildId) {
    if (!this.sessionId) return;
    return this.request(`/v4/sessions/${this.sessionId}/players/${guildId}`, { method: "DELETE" });
  }
  async loadTracks(identifier) {
    return this.request(`/v4/loadtracks?identifier=${encodeURIComponent(identifier)}`);
  }
  async decodeTrack(encoded) {
    return this.request("/v4/decodetrack", { method: "POST", body: JSON.stringify({ encodedTrack: encoded }) });
  }
}
module.exports = Lavalink;
