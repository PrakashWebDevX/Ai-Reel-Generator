// ============================================================
// Route: POST /api/generate
// ============================================================
const express = require("express");
const router = express.Router();
const { v4: uuidv4 } = require("uuid");

const transcriptService = require("../services/transcriptService");
const scriptService = require("../services/scriptService");
const voiceService = require("../services/voiceService");
const videoService = require("../services/videoService");

/**
 * POST /api/generate
 * Body: { url: string }
 * Returns: { videoUrl, caption, hashtags, script }
 */
router.post("/generate", async (req, res) => {
  const { url } = req.body;

  if (!url || typeof url !== "string" || url.trim() === "") {
    return res.status(400).json({ error: "A valid video URL is required." });
  }

  const jobId = uuidv4().slice(0, 8); // short ID for this generation job
  console.log(`\n[Job ${jobId}] Starting reel generation for: ${url}`);

  try {
    // ── Step 1: Extract transcript ──────────────────────────
    console.log(`[Job ${jobId}] Step 1/4 — Extracting transcript…`);
    const transcript = await transcriptService.extract(url);
    console.log(`[Job ${jobId}]   Transcript length: ${transcript.length} chars`);

    // ── Step 2: Generate viral script via OpenAI ────────────
    console.log(`[Job ${jobId}] Step 2/4 — Generating viral script…`);
    const { script, caption, hashtags } = await scriptService.generate(transcript, url);
    console.log(`[Job ${jobId}]   Script length: ${script.length} chars`);

    // ── Step 3: Generate voiceover via ElevenLabs ───────────
    console.log(`[Job ${jobId}] Step 3/4 — Generating voiceover…`);
    const audioPath = await voiceService.generate(script, jobId);
    console.log(`[Job ${jobId}]   Audio saved: ${audioPath}`);

    // ── Step 4: Compose video with FFmpeg ───────────────────
    console.log(`[Job ${jobId}] Step 4/4 — Composing video…`);
    const videoPath = await videoService.compose(audioPath, script, jobId);
    console.log(`[Job ${jobId}]   Video saved: ${videoPath}`);

    // ── Respond ─────────────────────────────────────────────
    const baseUrl = process.env.BASE_URL || `http://localhost:${process.env.PORT || 4000}`;
    const videoUrl = `${baseUrl}/outputs/${require("path").basename(videoPath)}`;

    console.log(`[Job ${jobId}] ✅ Done! Video URL: ${videoUrl}\n`);

    return res.json({ videoUrl, caption, hashtags, script });

  } catch (err) {
    console.error(`[Job ${jobId}] ❌ Error:`, err.message);
    return res.status(500).json({
      error: err.message || "Generation failed. Please try again.",
    });
  }
});

module.exports = router;