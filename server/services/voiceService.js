// ============================================================
// Voice Service
// Converts the viral script to speech using ElevenLabs.
// Falls back to generating a silent audio file for demo mode.
// ============================================================

const axios = require("axios");
const fs = require("fs");
const path = require("path");

const OUTPUTS_DIR = path.join(__dirname, "../outputs");

// Default voice: "Rachel" — natural, clear, energetic
const DEFAULT_VOICE_ID = "21m00Tcm4TlvDq8ikWAM";

/**
 * Generate speech using ElevenLabs TTS API.
 * Returns the path to the saved .mp3 file.
 */
async function generateWithElevenLabs(script, jobId) {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  const voiceId = process.env.ELEVENLABS_VOICE_ID || DEFAULT_VOICE_ID;

  const url = `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`;

  const response = await axios.post(
    url,
    {
      text: script,
      model_id: "eleven_turbo_v2", // fast, high-quality
      voice_settings: {
        stability: 0.45,         // more dynamic variation
        similarity_boost: 0.82,  // close to the voice clone
        style: 0.35,             // slight stylisation for energy
        use_speaker_boost: true,
      },
    },
    {
      headers: {
        "xi-api-key": apiKey,
        "Content-Type": "application/json",
        Accept: "audio/mpeg",
      },
      responseType: "arraybuffer",
    }
  );

  const audioPath = path.join(OUTPUTS_DIR, `audio_${jobId}.mp3`);
  fs.writeFileSync(audioPath, Buffer.from(response.data));
  return audioPath;
}

/**
 * Create a silent placeholder audio file using FFmpeg's lavfi source.
 * This lets the video pipeline run without a real voice.
 */
async function generateSilentAudio(script, jobId) {
  console.warn("[VoiceService] Using silent placeholder audio (ELEVENLABS_API_KEY not set)");

  // Estimate duration: ~140 words per minute for fast speech
  const wordCount = script.split(/\s+/).length;
  const durationSeconds = Math.max(10, Math.ceil((wordCount / 140) * 60));

  const audioPath = path.join(OUTPUTS_DIR, `audio_${jobId}.mp3`);

  return new Promise((resolve, reject) => {
    const ffmpeg = require("fluent-ffmpeg");

    ffmpeg()
      .input(`sine=frequency=1:duration=${durationSeconds}`)
      .inputFormat("lavfi")
      .audioFilters("volume=0") // make it silent
      .audioCodec("libmp3lame")
      .audioBitrate("128k")
      .save(audioPath)
      .on("end", () => resolve(audioPath))
      .on("error", reject);
  });
}

/**
 * Main entry: generate voiceover and return path to audio file.
 */
async function generate(script, jobId) {
  if (!fs.existsSync(OUTPUTS_DIR)) {
    fs.mkdirSync(OUTPUTS_DIR, { recursive: true });
  }

  if (process.env.ELEVENLABS_API_KEY) {
    try {
      return await generateWithElevenLabs(script, jobId);
    } catch (err) {
      console.warn("[VoiceService] ElevenLabs failed:", err.message);
    }
  }

  return await generateSilentAudio(script, jobId);
}

module.exports = { generate };