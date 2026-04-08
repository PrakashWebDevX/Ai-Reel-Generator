// ============================================================
// Video Service
// Composes the final 9:16 vertical reel using FFmpeg:
//   - Animated gradient background (no copyrighted stock video)
//   - Voiceover audio track
//   - Burned-in subtitles
//   - 1080x1920 output (standard Reels/Shorts/TikTok format)
// ============================================================

const ffmpeg = require("fluent-ffmpeg");
const fs = require("fs");
const path = require("path");

// Set ffmpeg and ffprobe paths explicitly for Windows compatibility
try {
  const ffmpegPath = require("ffmpeg-static");
  ffmpeg.setFfmpegPath(ffmpegPath);

  // Set ffprobe path separately (ffmpeg-static doesn't include it)
  try {
    const ffprobePath = require("@ffprobe-installer/ffprobe").path;
    ffmpeg.setFfprobePath(ffprobePath);
  } catch (e) {
    console.warn("[VideoService] ffprobe-static not available, using system ffprobe");
  }
} catch (e) {
  console.warn("[VideoService] ffmpeg-static not available, using system ffmpeg");
}

const OUTPUTS_DIR = path.join(__dirname, "../outputs");

/**
 * Write an SRT subtitle file from a plain script string.
 * Splits the script into short chunks (~6 words each) and
 * distributes them evenly across the audio duration.
 */
function writeSRT(script, durationSeconds, srtPath) {
  // Clean up script for subtitle display
  const words = script
    .replace(/\n+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .split(" ");

  const CHUNK_SIZE = 6; // words per subtitle line
  const chunks = [];
  for (let i = 0; i < words.length; i += CHUNK_SIZE) {
    chunks.push(words.slice(i, i + CHUNK_SIZE).join(" "));
  }

  const chunkDuration = durationSeconds / chunks.length;

  const toSRTTime = (secs) => {
    const h = Math.floor(secs / 3600).toString().padStart(2, "0");
    const m = Math.floor((secs % 3600) / 60).toString().padStart(2, "0");
    const s = Math.floor(secs % 60).toString().padStart(2, "0");
    const ms = Math.floor((secs % 1) * 1000).toString().padStart(3, "0");
    return `${h}:${m}:${s},${ms}`;
  };

  let srt = "";
  chunks.forEach((chunk, i) => {
    const start = i * chunkDuration;
    const end = (i + 1) * chunkDuration - 0.05;
    srt += `${i + 1}\n${toSRTTime(start)} --> ${toSRTTime(end)}\n${chunk}\n\n`;
  });

  fs.writeFileSync(srtPath, srt.trim());
}

/**
 * Get the duration of an audio file in seconds using FFmpeg.
 */
function getAudioDuration(audioPath) {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(audioPath, (err, metadata) => {
      if (err) return reject(err);
      resolve(metadata.format.duration || 30);
    });
  });
}

/**
 * Compose the final video:
 *   1. Generate an animated gradient background via FFmpeg's lavfi
 *   2. Overlay the voiceover audio
 *   3. Burn subtitles into the frame
 *   4. Output 1080x1920 MP4
 */
async function compose(audioPath, script, jobId) {
  if (!fs.existsSync(OUTPUTS_DIR)) {
    fs.mkdirSync(OUTPUTS_DIR, { recursive: true });
  }

  // Measure audio duration to sync video length
  const duration = await getAudioDuration(audioPath);
  const videoDuration = Math.ceil(duration) + 1; // +1s buffer

  // Write subtitle file
  const srtPath = path.join(OUTPUTS_DIR, `subs_${jobId}.srt`);
  writeSRT(script, duration, srtPath);

  const outputPath = path.join(OUTPUTS_DIR, `reel_${jobId}.mp4`);

  // Escape srt path for FFmpeg subtitle filter (Windows & Unix safe)
  const escapedSRT = srtPath.replace(/\\/g, "/").replace(/:/g, "\\:");

  return new Promise((resolve, reject) => {
    /**
     * FFmpeg pipeline explanation:
     *
     * Input 1: lavfi — animated gradient using geq filter
     *   - geq generates per-pixel colour equations animated over time (t)
     *   - Creates a smooth, moving purple-to-blue-to-teal gradient
     *   - format=yuv420p converts to standard YUV colour space
     *
     * Input 2: The ElevenLabs voiceover (or silent placeholder)
     *
     * Video filters:
     *   - scale to 1080x1920 (9:16 vertical)
     *   - subtitles burned in with large, bold, centred white text +
     *     dark shadow for legibility on any background
     *
     * Output: H.264 video + AAC audio, yuv420p for max compatibility
     */

    ffmpeg()
      // ── Video source: animated gradient background ─────────
      .input(
        `color=black:size=1080x1920:rate=30,` +
        `geq=` +
          `r='128+80*sin(2*PI*(X/1080+t/8))':` +
          `g='60+40*sin(2*PI*(Y/1920+t/6))':` +
          `b='200+55*sin(2*PI*((X+Y)/(1080+1920)+t/5))':` +
          `a=255`
      )
      .inputFormat("lavfi")
      .inputOptions([`-t ${videoDuration}`])

      // ── Audio source: voiceover ────────────────────────────
      .input(audioPath)

      // ── Video filter chain ─────────────────────────────────
      .videoFilter([
        // Scale to vertical 9:16
        "scale=1080:1920:force_original_aspect_ratio=decrease",
        "pad=1080:1920:(ow-iw)/2:(oh-ih)/2",
        // Burn in subtitles
        [
          `subtitles=${escapedSRT}`,
          `force_style='`,
            `FontName=Arial,`,
            `FontSize=52,`,
            `Bold=1,`,
            `PrimaryColour=&H00FFFFFF,`,   // white text
            `OutlineColour=&H00000000,`,   // black outline
            `BackColour=&H60000000,`,      // semi-transparent background
            `Outline=2,`,
            `Shadow=1,`,
            `Alignment=2,`,               // bottom-centre
            `MarginV=160`,               // above thumb area
          `'`,
        ].join(""),
      ])

      // ── Encoding settings ──────────────────────────────────
      .videoCodec("libx264")
      .videoBitrate("2500k")
      .outputOptions([
        "-preset fast",
        "-crf 22",
        "-pix_fmt yuv420p",
        "-movflags +faststart", // enables progressive web streaming
        `-t ${videoDuration}`,
        "-shortest",            // stop when shortest stream ends
      ])
      .audioCodec("aac")
      .audioBitrate("192k")

      // ── Output ─────────────────────────────────────────────
      .save(outputPath)
      .on("start", (cmd) => {
        console.log("[VideoService] FFmpeg command:", cmd.slice(0, 200) + "…");
      })
      .on("progress", (p) => {
        if (p.percent) process.stdout.write(`\r[VideoService] Encoding: ${p.percent.toFixed(1)}%`);
      })
      .on("end", () => {
        console.log("\n[VideoService] Video composition complete.");
        // Clean up temp subtitle file
        try { fs.unlinkSync(srtPath); } catch (_) {}
        resolve(outputPath);
      })
      .on("error", (err) => {
        console.error("\n[VideoService] FFmpeg error:", err.message);
        reject(err);
      });
  });
}

module.exports = { compose };