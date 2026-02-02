import "dotenv/config";
import { drizzle } from "drizzle-orm/postgres-js";
import pg from "pg";
import * as schema from "./schema.js";

if (!process.env.DATABASE_URL) {
  throw new Error(" DATABASE_URL is not defined");
}

export const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
});

export const db = drizzle(pool);
