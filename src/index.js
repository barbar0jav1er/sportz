import express from "express";
import { db } from "./db/index.js";
import { users } from "./db/schema.js";

const app = express();
const PORT = 8000;

app.use(express.json());

app.get("/", async (req, res) => {
  try {
    const result = await db.select().from(users).limit(1);
    res.json({ message: "Welcome to the Sportz API!", dbStatus: "Connected", usersCount: result.length });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Database connection failed", error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
