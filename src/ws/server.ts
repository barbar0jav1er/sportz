import { WebSocket, WebSocketServer } from "ws";
import { type Server } from "http";
import type { Commentary, Match } from "../db/schema.ts";

// Extendemos WebSocket para propiedades personalizadas
interface ExtendedWebSocket extends WebSocket {
  isAlive: boolean;
  subscriptions: Set<number>;
}

type WsOutboundMessage =
  | { type: "welcome" }
  | { type: "match_created"; data: Match }
  | { type: "subscribed"; matchId: number }
  | { type: "unsubscribed"; matchId: number }
  | { type: "error"; data: string }
  | { type: "commentary"; data: Commentary };

type MatchId = number;

const HEARTBEAT_INTERVAL_MS = 3000;
const MAX_PAYLOAD_BYTES = 1024 * 1024; // 1MB
const matchesSubscribers = new Map<MatchId, Set<ExtendedWebSocket>>();

function subscribeToAMatch(matchId: MatchId, socket: ExtendedWebSocket) {
  if (!matchesSubscribers.has(matchId)) {
    matchesSubscribers.set(matchId, new Set());
  }
  matchesSubscribers.get(matchId)?.add(socket);
}

function unsubscribeToAMatch(matchId: MatchId, socket: ExtendedWebSocket) {
  const subscribers = matchesSubscribers.get(matchId);
  if (!subscribers) return;

  subscribers.delete(socket);

  if (subscribers.size === 0) {
    matchesSubscribers.delete(matchId);
  }
}

function cleanUpSubscriptions(socket: ExtendedWebSocket) {
  for (const matchId of socket.subscriptions) {
    unsubscribeToAMatch(matchId, socket);
  }
  socket.subscriptions.clear();
}

function send(socket: ExtendedWebSocket, payload: WsOutboundMessage) {
  if (socket.readyState !== WebSocket.OPEN) return;

  socket.send(JSON.stringify(payload));
}

function broadcastToAll(wss: WebSocketServer, payload: WsOutboundMessage) {
  for (const client of wss.clients) {
    send(client as ExtendedWebSocket, payload);
  }
}

function handleMessage(socket: ExtendedWebSocket, data: string) {
  let message;

  try {
    message = JSON.parse(data.toString());
  } catch {
    send(socket, { type: "error", data: "Invalid JSON" });
    return;
  }

  if (message.type === "subscribe" && Number.isInteger(message.matchId)) {
    subscribeToAMatch(message.matchId, socket);
    socket.subscriptions.add(message.matchId);
    send(socket, { type: "subscribed", matchId: message.matchId });
    return;
  }

  if (message.type === "unsubscribe" && Number.isInteger(message.matchId)) {
    unsubscribeToAMatch(message.matchId, socket);
    socket.subscriptions.delete(message.matchId);
    send(socket, { type: "unsubscribed", matchId: message.matchId });
  }
}

function broadcastToMatch(matchId: MatchId, payload: WsOutboundMessage) {
  const subscribers = matchesSubscribers.get(matchId);

  if (!subscribers || subscribers.size === 0) return;

  for (const client of subscribers) {
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
    broadcastToAll(wss, { type: "match_created", data: match });
  }

  function broadcastCommentary(matchId: number, comment: Commentary) {
    broadcastToMatch(matchId, { type: "commentary", data: comment });
  }

  return {
    broadcastMatchCreated,
    broadcastCommentary,
  };
}

function onConnection(ws: WebSocket) {
  const socket = ws as ExtendedWebSocket;
  socket.isAlive = true;
  socket.subscriptions = new Set();

  socket.on("pong", () => {
    socket.isAlive = true;
  });

  socket.on("error", onSocketError);

  socket.subscriptions = new Set();
  send(socket, { type: "welcome" });

  socket.on("message", (data) => {
    handleMessage(socket, data.toString());
  });

  socket.on("close", () => {
    cleanUpSubscriptions(socket);
  });
}

function onSocketError(error: Error) {
  console.error("WebSocket client error:", error);
}

function startHeartbeat(wss: WebSocketServer) {
  return setInterval(() => {
    for (const ws of wss.clients) {
      const client = ws as ExtendedWebSocket;
      if (client.isAlive === false) {
        client.terminate();
        continue;
      }
      client.isAlive = false;
      client.ping();
    }
  }, HEARTBEAT_INTERVAL_MS);
}
