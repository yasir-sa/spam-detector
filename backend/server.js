import "dotenv/config";
import express from "express";
import cors from "cors";
import { pool, initDb } from "./db.js";

const app = express();

// FRONTEND_URL la irukkura URL mattum allow (comma vachu multiple kudukkalam)
// Local .env = http://localhost:5173, Render env = production UI URL
const allowedOrigins = (process.env.FRONTEND_URL || "")
  .split(",")
  .map((url) => url.trim())
  .filter(Boolean);
if (allowedOrigins.length === 0) console.warn("FRONTEND_URL not set - all browser requests blocked");
app.use(cors({ origin: allowedOrigins }));
app.use(express.json());

const PORT = process.env.PORT || 5000;
const AI_API_URL = process.env.AI_API_URL || "https://spam-detector-z8w0.onrender.com";
const AI_API_KEY = process.env.AI_API_KEY;
if (!AI_API_KEY) console.warn("AI_API_KEY not set - AI API will reject requests");

// PostgreSQL connect (DATABASE_URL irundhaa mattum - history save panna)
let dbConnected = false;
initDb()
  .then((ok) => {
    dbConnected = ok;
    if (ok) console.log("PostgreSQL connected");
  })
  .catch((err) => console.error("PostgreSQL error:", err.message));

app.get("/", (req, res) => {
  res.json({ status: "Spam Detector backend running", db: dbConnected });
});

// React -> Node -> Render AI API
app.post("/api/check", async (req, res) => {
  const { text } = req.body;
  if (!text || !text.trim()) {
    return res.status(400).json({ error: "Message text required" });
  }

  try {
    const aiRes = await fetch(`${AI_API_URL}/predict`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-API-Key": AI_API_KEY },
      body: JSON.stringify({ text }),
    });
    if (!aiRes.ok) throw new Error(`AI API status ${aiRes.status}`);
    const { prediction } = await aiRes.json();

    if (dbConnected) {
      await pool.query("INSERT INTO messages (text, prediction) VALUES ($1, $2)", [text, prediction]);
    }

    res.json({ text, prediction });
  } catch (err) {
    console.error(err.message);
    res.status(502).json({ error: "AI service not reachable, try again" });
  }
});

// Saved messages - ?type=spam / ?type=ham filter
app.get("/api/history", async (req, res) => {
  if (!dbConnected) return res.json([]);
  const { type } = req.query;
  const filter = type === "spam" || type === "ham" ? type : null;
  const { rows } = await pool.query(
    `SELECT id, text, prediction, created_at FROM messages
     WHERE ($1::text IS NULL OR prediction = $1)
     ORDER BY created_at DESC LIMIT 50`,
    [filter]
  );
  res.json(rows);
});

// Oru message delete
app.delete("/api/history/:id", async (req, res) => {
  if (!dbConnected) return res.status(503).json({ error: "Database not connected" });
  const { rowCount } = await pool.query("DELETE FROM messages WHERE id = $1", [req.params.id]);
  if (rowCount === 0) return res.status(404).json({ error: "Message not found" });
  res.json({ deleted: true });
});

app.listen(PORT, () => console.log(`Backend running on http://localhost:${PORT}`));
