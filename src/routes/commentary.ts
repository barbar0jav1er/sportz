import { Router } from "express";
import { matchIdParamSchema } from "../validation/matches.ts";
import {
  createCommentarySchema,
  listCommentaryQuerySchema,
} from "../validation/commentary.ts";
import { db } from "../db/index.ts";
import { commentary } from "../db/schema.ts";
import { desc, eq } from "drizzle-orm";

export const commentaryRouter = Router({ mergeParams: true });

const MAX_LIMIT = 100;

commentaryRouter.get("/", async (req, res) => {
  const paramsParsed = matchIdParamSchema.safeParse(req.params);
  if (!paramsParsed.success) {
    return res.status(400).json({
      error: "Invalid match id",
      details: JSON.stringify(paramsParsed.error.issues),
    });
  }

  const queryParsed = listCommentaryQuerySchema.safeParse(req.query);
  if (!queryParsed.success) {
    return res.status(400).json({
      error: "Invalid query",
      details: JSON.stringify(queryParsed.error.issues),
    });
  }

  const limit = Math.min(queryParsed.data.limit ?? 50, MAX_LIMIT);

  try {
    const data = await db
      .select()
      .from(commentary)
      .where(eq(commentary.matchId, paramsParsed.data.id))
      .orderBy(desc(commentary.createdAt))
      .limit(limit);

    return res.json({ data });
  } catch (error) {
    return res.status(500).json({
      error: "Failed to list commentary",
      details: JSON.stringify(error),
    });
  }
});

commentaryRouter.post("/", async (req, res) => {
  const paramsParsed = matchIdParamSchema.safeParse(req.params);
  if (!paramsParsed.success) {
    return res.status(400).json({
      error: "Invalid match id",
      details: JSON.stringify(paramsParsed.error.issues),
    });
  }

  const bodyParsed = createCommentarySchema.safeParse(req.body);
  if (!bodyParsed.success) {
    return res.status(400).json({
      error: "Invalid payload",
      details: JSON.stringify(bodyParsed.error.issues),
    });
  }

  try {
    const [created] = await db
      .insert(commentary)
      .values({
        matchId: paramsParsed.data.id,
        ...bodyParsed.data,
      })
      .returning();

    if (res.app.locals.broadcastCommentary) {
      res.app.locals.broadcastCommentary(created.matchId, created);
    }

    return res.status(201).json({ data: created });
  } catch (error) {
    return res.status(500).json({
      error: "Failed to create commentary",
      details: JSON.stringify(error),
    });
  }
});
