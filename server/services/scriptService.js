// ============================================================
// Script Service
// Uses OpenAI GPT-4 to transform a raw transcript into a
// viral short-form script + caption + hashtags.
// Falls back to a template-based mock if no API key is set.
// ============================================================

const OpenAI = require("openai");

let openai;
if (process.env.OPENAI_API_KEY) {
  openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

/**
 * Build the system + user prompt for GPT.
 */
function buildPrompt(transcript) {
  const system = `You are a viral short-form video scriptwriter specializing in 
TikTok, Instagram Reels, and YouTube Shorts. You transform content into 
high-engagement scripts that hook viewers in the first 3 seconds and drive 
comments, shares, and saves.

Your scripts follow this proven structure:
1. HOOK (0-3s): Bold statement, shocking fact, or question that stops the scroll
2. PROBLEM/CONTEXT (3-15s): Briefly frame why this matters
3. VALUE (15-45s): Deliver the core insight clearly and rapidly
4. CTA (45-60s): Tell the viewer exactly what to do next

Rules:
- Conversational, energetic tone — write for speech, not reading
- Short punchy sentences. One idea per sentence.
- No filler words ("um", "so basically", "you know")
- Max 150 words total (fits 60-second voiceover)
- Return ONLY a JSON object with keys: script, caption, hashtags
- hashtags must be an array of strings (without the # symbol)`;

  const user = `Transform this transcript into a viral script:

---
${transcript.slice(0, 3000)}
---

Return valid JSON only, no markdown, no explanation.`;

  return { system, user };
}

/**
 * Call OpenAI to generate the viral script.
 */
async function generateWithOpenAI(transcript) {
  const { system, user } = buildPrompt(transcript);

  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini", // cost-effective, fast
    messages: [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
    temperature: 0.85,
    max_tokens: 600,
    response_format: { type: "json_object" },
  });

  const raw = response.choices[0]?.message?.content || "{}";

  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error("OpenAI returned invalid JSON");
  }

  if (!parsed.script || !parsed.caption || !parsed.hashtags) {
    throw new Error("OpenAI response missing required fields");
  }

  return parsed;
}

/**
 * Mock script generator for when OpenAI is unavailable.
 */
function mockGenerate(transcript) {
  console.warn("[ScriptService] Using mock script (OPENAI_API_KEY not set)");

  const script = `Stop scrolling — this will change how you work forever.

Most people waste 3 hours a day on tasks that don't matter.
Here's what high performers do differently.

They plan for 5 minutes every morning — before touching their phone.
They block time for deep work — no meetings, no distractions.
They use the 2-minute rule — if it takes under 2 minutes, do it now.
They batch similar tasks — checking email twice a day, not 50 times.
And every Friday, they review their week — and reset their priorities.

These aren't hacks. They're systems.
And they're the reason some people get more done by noon than others do all week.

Save this. Share it with someone who needs it.
And follow for more productivity systems that actually work.`;

  const caption =
    "🔥 5 productivity habits that high performers swear by — most people learn these way too late. Save this before you forget. #productivity #success #mindset";

  const hashtags = [
    "productivity",
    "success",
    "mindset",
    "entrepreneur",
    "selfimprovement",
    "motivation",
    "worksmarter",
    "lifehacks",
    "timemanagement",
    "growth",
  ];

  return { script, caption, hashtags };
}

/**
 * Main entry: generate viral script, caption, and hashtags.
 */
async function generate(transcript, url) {
  if (openai) {
    try {
      return await generateWithOpenAI(transcript);
    } catch (err) {
      console.warn("[ScriptService] OpenAI failed:", err.message);
    }
  }

  return mockGenerate(transcript);
}

module.exports = { generate };