import type { Commentary, Match } from "../db/schema.ts";

declare global {
  namespace Express {
    interface Locals {
      broadcastMatchCreated?: ((match: Match) => void) | undefined;
      broadcastCommentary:
        | ((matchId: number, comment: Commentary) => void)
        | undefined;
    }
  }
}

export {};
