import { Router } from "express";
import {
  createMatchSchema,
  listMatchesQuerySchema,
  MATCH_STATUS,
} from "../validation/matches.ts";
import { db } from "../db/index.ts";
import { matches } from "../db/schema.ts";
import { getMatchStatus } from "../utils/match-status.ts";
import { desc } from "drizzle-orm";

const MAX_LIMIT = 100;

export const matchRouter = Router();

matchRouter.get("/", async (req, res) => {
  const parsed = listMatchesQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    return res.status(400).json({
      error: "Invalid query",
      details: JSON.stringify(parsed.error.issues),
    });
  }

  const limit = Math.min(parsed.data.limit ?? 50, MAX_LIMIT);

  try {
    const data = await db
      .select()
      .from(matches)
      .orderBy(desc(matches.createdAt))
      .limit(limit);

    return res.json({ data });
  } catch (error) {
    return res.status(500).json({
      error: "Failed to list matches",
      details: JSON.stringify(error),
    });
  }
});

matchRouter.post("/", async (req, res) => {
  const parsed = createMatchSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({
      error: "Invalid payload",
      details: JSON.stringify(parsed.error.issues),
    });
  }

  try {
    const { startTime, homeScore, awayScore, endTime, ...rest } = parsed.data;
    const status = getMatchStatus(startTime, endTime) ?? MATCH_STATUS.SCHEDULED;

    const [created] = await db
      .insert(matches)
      .values({
        ...rest,
        status,
        startTime: new Date(startTime),
        endTime: new Date(endTime),
        homeScore: homeScore ?? 0,
        awayScore: awayScore ?? 0,
      })
      .returning();

    return res.status(201).json({ data: created });
  } catch (error) {
    return res.status(500).json({
      error: "Failed to create match",
      details: JSON.stringify(error),
    });
  }
});
