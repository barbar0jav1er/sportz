import type { Match } from "../db/schema.ts";

declare global {
  namespace Express {
    interface Locals {
      broadcastMatchCreated?: ((match: Match) => void) | undefined;
    }
  }
}

export {};
