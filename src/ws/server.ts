import { WebSocket, WebSocketServer } from "ws";
import { type Server } from "http";
import { type Match } from "../db/schema.ts";

type WsOutboundMessage =
  | { type: "welcome" }
  | { type: "match_created"; data: Match };

const HEARTBEAT_INTERVAL_MS = 3000;
const MAX_PAYLOAD_BYTES = 1024 * 1024; // 1MB

function send(socket: WebSocket, payload: WsOutboundMessage) {
  if (socket.readyState !== WebSocket.OPEN) return;

  socket.send(JSON.stringify(payload));
}

function broadcast(wss: WebSocketServer, payload: WsOutboundMessage) {
  for (const client of wss.clients) {
    send(client, payload);
  }
}

export function attachWebSocketServer(server: Server) {
  const wss = new WebSocketServer({
    server,
    path: "/ws",
    maxPayload: MAX_PAYLOAD_BYTES,
  });

  const interval = startHeartbeat(wss);
  wss.on("connection", onConnection);
  wss.on("close", () => clearInterval(interval));

  function broadcastMatchCreated(match: Match) {
    broadcast(wss, { type: "match_created", data: match });
  }

  return {
    broadcastMatchCreated,
  };
}

function onConnection(socket: WebSocket) {
  socket.isAlive = true;

  socket.on("pong", () => {
    socket.isAlive = true;
  });

  send(socket, { type: "welcome" });

  socket.on("error", onSocketError);
}

function onSocketError(error: Error) {
  console.error("WebSocket client error:", error);
}

function startHeartbeat(wss: WebSocketServer) {
  return setInterval(() => {
    wss.clients.forEach((client) => {
      if (client.isAlive === false) return client.terminate();
      client.isAlive = false;
      client.ping();
    });
  }, HEARTBEAT_INTERVAL_MS);
}
