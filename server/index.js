 // ============================================================
// AI Viral Reel Generator — Express Server
// ============================================================
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");
const fs = require("fs");

const generateRoute = require("./routes/generate");

const app = express();
const PORT = process.env.PORT || 4000;

// ── Middleware ──────────────────────────────────────────────
app.use(cors({ origin: "*" }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── Static output files (serve generated videos) ───────────
const outputsDir = path.join(__dirname, "outputs");
if (!fs.existsSync(outputsDir)) fs.mkdirSync(outputsDir, { recursive: true });
app.use("/outputs", express.static(outputsDir));

// ── Routes ──────────────────────────────────────────────────
app.use("/api", generateRoute);

// ── Health check ────────────────────────────────────────────
app.get("/health", (req, res) => res.json({ status: "ok", ts: Date.now() }));

// ── Global error handler ────────────────────────────────────
app.use((err, req, res, next) => {
  console.error("[Server Error]", err);
  res.status(500).json({ error: err.message || "Internal server error" });
});

app.listen(PORT, () => {
  console.log(`\n🚀  AI Reel Generator server running on http://localhost:${PORT}`);
  console.log(`   POST /api/generate  — generate a reel from a URL\n`);
});