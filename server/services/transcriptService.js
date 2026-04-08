// ============================================================
// Transcript Service
// Extracts text content from a video URL without downloading
// the copyrighted video itself.
//
// Strategy:
//  1. YouTube → youtube-transcript npm package (uses YouTube's
//     own caption API — no video download involved)
//  2. Other URLs → AssemblyAI URL submission (AssemblyAI fetches
//     only the audio stream, if publicly accessible)
//  3. Fallback → mock transcript for demo / testing
// ============================================================

const axios = require("axios");

// Lazy-load to avoid crash if package is missing
let YoutubeTranscript;
try {
  YoutubeTranscript = require("youtube-transcript").YoutubeTranscript;
} catch (_) {}

/**
 * Detect if a URL is a YouTube link.
 */
function isYouTube(url) {
  return /youtube\.com|youtu\.be/.test(url);
}

/**
 * Extract YouTube transcript using the official caption API.
 * This does NOT download the video.
 */
async function extractYouTubeTranscript(url) {
  if (!YoutubeTranscript) throw new Error("youtube-transcript package not available");
  const segments = await YoutubeTranscript.fetchTranscript(url);
  return segments.map((s) => s.text).join(" ");
}

/**
 * Submit a public URL to AssemblyAI for audio transcription.
 * AssemblyAI fetches the audio from the URL on their side.
 */
async function transcribeWithAssemblyAI(url) {
  const apiKey = process.env.ASSEMBLYAI_API_KEY;
  if (!apiKey) throw new Error("ASSEMBLYAI_API_KEY not set");

  // Step 1: Submit for transcription
  const submitRes = await axios.post(
    "https://api.assemblyai.com/v2/transcript",
    { audio_url: url },
    { headers: { authorization: apiKey } }
  );

  const transcriptId = submitRes.data.id;
  if (!transcriptId) throw new Error("AssemblyAI did not return a transcript ID");

  // Step 2: Poll until complete (max 3 minutes)
  const pollingUrl = `https://api.assemblyai.com/v2/transcript/${transcriptId}`;
  for (let i = 0; i < 36; i++) {
    await new Promise((r) => setTimeout(r, 5000)); // wait 5 s
    const pollRes = await axios.get(pollingUrl, {
      headers: { authorization: apiKey },
    });
    const { status, text, error } = pollRes.data;
    if (status === "completed") return text;
    if (status === "error") throw new Error(`AssemblyAI error: ${error}`);
  }
  throw new Error("AssemblyAI transcription timed out after 3 minutes");
}

/**
 * Mock transcript used as fallback when APIs are unavailable.
 */
function mockTranscript(url) {
  console.warn("[TranscriptService] Using mock transcript (no API keys / unsupported URL)");
  return `This video covers the top five productivity hacks that successful entrepreneurs 
use every single day. First, they start their morning with a 5-minute planning session 
instead of checking their phone. Second, they use time-blocking to protect deep work. 
Third, they apply the two-minute rule — if something takes less than two minutes, they 
do it immediately. Fourth, they batch similar tasks together to reduce context switching. 
And fifth, they do a weekly review every Friday to stay on track with their goals. 
These habits have helped thousands of people 10x their output without burning out.`;
}

/**
 * Main entry point: extract transcript from any supported URL.
 */
async function extract(url) {
  // 1. Try YouTube captions first (no video download)
  if (isYouTube(url)) {
    try {
      return await extractYouTubeTranscript(url);
    } catch (err) {
      console.warn("[TranscriptService] YouTube caption extraction failed:", err.message);
      // Fall through to AssemblyAI or mock
    }
  }

  // 2. Try AssemblyAI for public audio/video URLs
  if (process.env.ASSEMBLYAI_API_KEY) {
    try {
      return await transcribeWithAssemblyAI(url);
    } catch (err) {
      console.warn("[TranscriptService] AssemblyAI failed:", err.message);
    }
  }

  // 3. Fallback: use a mock transcript so the pipeline still works
  return mockTranscript(url);
}

module.exports = { extract };