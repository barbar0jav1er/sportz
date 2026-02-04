import express from "express";
import { matchRouter } from "./routes/matches.ts";

const app = express();
const PORT = 8000;

app.use(express.json());

app.get("/", (req, res) => {
  res.send("Welcome to the Sportz API!");
});

app.use("/matches", matchRouter);

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
