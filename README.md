# Sportz API

A real-time sports commentary and match tracking system built with Node.js, Express, and WebSockets.

## Features

- REST API for managing matches and commentary.
- Real-time updates via WebSockets with match-specific subscriptions.
- PostgreSQL database integration using Drizzle ORM.
- Type-safe development with TypeScript.
- Heartbeat mechanism for stable WebSocket connections.

## Tech Stack

- Node.js
- Express
- TypeScript
- WebSocket (ws)
- Drizzle ORM
- PostgreSQL
- Zod (Validation)

## Getting Started

### Prerequisites

- Node.js (v18 or higher recommended)
- pnpm
- Docker and Docker Compose (for the database)

### Installation

1. Install dependencies:
   ```bash
   pnpm install
   ```

2. Set up environment variables:
   ```bash
   cp .env.example .env
   ```
   Configure your database credentials in the .env file.

3. Start the database:
   ```bash
   docker-compose up -d
   ```

4. Run database migrations:
   ```bash
   pnpm drizzle-kit push
   ```

### Development

Start the development server:
```bash
pnpm dev
```

## API Reference

### HTTP Endpoints

- GET /matches: List all matches.
- POST /matches: Create a new match.
- GET /matches/:id/commentary: List commentary for a specific match.
- POST /matches/:id/commentary: Add a new commentary entry.

### WebSocket Events

#### Client to Server
- subscribe: Subscribe to updates for a specific match.
  ```json
  { "type": "subscribe", "matchId": 1 }
  ```
- unsubscribe: Stop receiving updates for a match.
  ```json
  { "type": "unsubscribe", "matchId": 1 }
  ```

#### Server to Client
- welcome: Sent upon successful connection.
- match_created: Broadcasted to all clients when a new match is created.
- commentary: Sent to subscribers when new commentary is added to a match.
- subscribed/unsubscribed: Confirmation of subscription changes.
- error: Sent when an invalid message is received.

## Project Structure

- src/index.ts: Application entry point.
- src/db: Database schema and configuration.
- src/routes: Express route handlers.
- src/ws: WebSocket server implementation.
- src/validation: Zod schemas for request validation.
- src/types: TypeScript type definitions.
