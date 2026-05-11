import { OpenAI } from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const DEFAULT_MODEL = process.env.OPENAI_MODEL ?? "gpt-4o-mini";

async function runPrompt({
  systemPrompt,
  userPrompt,
  maxTokens,
}: {
  systemPrompt: string;
  userPrompt: string;
  maxTokens: number;
}) {
  const completion = await openai.chat.completions.create({
    model: DEFAULT_MODEL,
    temperature: 0.8,
    max_tokens: maxTokens,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
  });

  const content = completion.choices[0]?.message?.content?.trim();
  if (!content) {
    throw new Error("No content returned from OpenAI");
  }

  return content;
}

interface GenerateTitlesOptions {
  concept: string;
  angle?: string;
  existingTitles?: string[];
}

interface GenerateHookOptions {
  concept: string;
  title?: string;
  angle?: string;
}

interface GenerateSituationPromptsOptions {
  concept: string;
  title?: string;
  savedHooks?: string[];
}

function cleanListItem(raw: string) {
  return raw
    .replace(/^\s*[-*•]\s*/, "")
    .replace(/^\s*\d+[).\-:]\s*/, "")
    .replace(/^\s*`+|`+\s*$/g, "")
    .replace(/^\s*json\s*:?\s*/i, "")
    .replace(/^\s*["'“”]+|["'“”]+\s*$/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function extractListItems(responseText: string) {
  const trimmed = responseText.trim();
  const normalized = trimmed
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/, "")
    .replace(/^\s*json\s*\n/i, "")
    .trim();

  const parseAsJsonList = (text: string) => {
    const parsed = JSON.parse(text) as unknown;

    if (Array.isArray(parsed)) {
      return parsed.map((item) => cleanListItem(String(item))).filter(Boolean);
    }

    if (parsed && typeof parsed === "object") {
      const values = Object.values(parsed as Record<string, unknown>);
      const firstArray = values.find(Array.isArray);
      if (Array.isArray(firstArray)) {
        return firstArray.map((item) => cleanListItem(String(item))).filter(Boolean);
      }
    }

    return null;
  };

  try {
    const direct = parseAsJsonList(normalized);
    if (direct) {
      return direct;
    }
  } catch {
    // Fall through to plain-text parsing.
  }

  // Try to recover when the model includes extra prose around JSON.
  const arrayStart = normalized.indexOf("[");
  const arrayEnd = normalized.lastIndexOf("]");
  if (arrayStart !== -1 && arrayEnd > arrayStart) {
    const arrayCandidate = normalized.slice(arrayStart, arrayEnd + 1);
    try {
      const recovered = parseAsJsonList(arrayCandidate);
      if (recovered) {
        return recovered;
      }
    } catch {
      // Fall through to plain-text parsing.
    }
  }

  return normalized
    .split(/\n+/)
    .map(cleanListItem)
    .filter((line) => line !== "[" && line !== "]" && line !== "{" && line !== "}" && line !== "json")
    .filter(Boolean);
}

function normalizeTitle(raw: string) {
  return raw
    .replace(/^\d+[).\-:\s]*/, "")
    .replace(/^[-*\s]+/, "")
    .replace(/["'`]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Generate 5 compelling video titles based on the concept
 */
export async function generateTitles(
  options: GenerateTitlesOptions
): Promise<string[]> {
  const { concept, angle, existingTitles } = options;

  const systemPrompt = `You are a YouTube title strategist with modern, minimalist taste.
Generate concise, natural-sounding titles that feel human and specific.

Hard rules:
- Return 8 options (one per line)
- No colons
- No exclamation marks
- No emoji
- No "this is funny" signaling words
- Avoid words like funny, hilarious, comedic, quirks, laughs, mistakes, fail
- Keep language simple and conversational
- Prefer 4 to 9 words
- Avoid repeating the same opening pattern across options

Style goals:
- Curiosity through tension or outcome, not hype
- Feels like a title a strong creator would actually publish
- Specific enough to promise a clear experience`;

  const userPrompt = `Video Concept: ${concept}
${angle ? `Angle/Focus: ${angle}` : ""}
${existingTitles && existingTitles.length > 0 ? `Previously generated (don't repeat): ${existingTitles.join(", ")}` : ""}

Generate title options:`;

  const responseText = await runPrompt({
    systemPrompt,
    userPrompt,
    maxTokens: 500,
  });

  const bannedPattern = /\b(funny|hilarious|comedic|quirks|laughs|mistakes|fail(?:s|ed|ing)?)\b/i;

  let titles = responseText
    .split("\n")
    .map(normalizeTitle)
    .filter((title: string) => {
      if (!title) return false;
      if (title.includes(":")) return false;
      if (title.includes("!")) return false;
      if (bannedPattern.test(title)) return false;
      return true;
    })
    .filter((title: string, idx: number, arr: string[]) => arr.indexOf(title) === idx)
    .filter((title: string) => !existingTitles?.includes(title))
    .slice(0, 5);

  if (titles.length < 5) {
    const fallbackPrompt = `${userPrompt}\n\nYou must follow the hard rules strictly. Give only clean, simple options.`;
    const fallbackResponse = await runPrompt({
      systemPrompt,
      userPrompt: fallbackPrompt,
      maxTokens: 400,
    });

    const fallbackTitles = fallbackResponse
      .split("\n")
      .map(normalizeTitle)
      .filter((title: string) => {
        if (!title) return false;
        if (title.includes(":")) return false;
        if (title.includes("!")) return false;
        if (bannedPattern.test(title)) return false;
        return true;
      });

    titles = [...titles, ...fallbackTitles]
      .filter((title: string, idx: number, arr: string[]) => arr.indexOf(title) === idx)
      .filter((title: string) => !existingTitles?.includes(title))
      .slice(0, 5);
  }

  return titles;
}

export async function generateHook(
  options: GenerateHookOptions
): Promise<string[]> {
  const { concept, title, angle } = options;

  const systemPrompt = `You are a YouTube hook writer who understands authentic creator voice.

Your job is NOT to template-fill or use clichéd phrases. Your job is to understand the VIBE and emotional intent of the video, then craft hooks that feel like natural openings.

Rules:
- Each hook is 1-2 sentences max
- Feels like a real person talking, not a YouTube formula
- AVOID at all costs:
  * "Watch this [adjective] ensue" / "watch what happens"
  * "You won't believe..." / "wait until..." / "hold on..."
  * "[Word] gone wrong" / "[Word] gone right"
  * Allcaps words, exclamation chains, multiple question marks
  * Generic hype language (insane, crazy, unhinged, wild, etc.)
  * Phrases that signal the tone rather than embodying it
  * Keyword spam or over-emphasis of adjectives the creator mentioned
- Instead: feel like the actual first words a creator would speak
- The hook should feel connected to the title and angle naturally, not forced
- Return only valid JSON

Example of BAD: ["Watch this hilarity ensue!", "You won't believe what happens next!"]
Example of GOOD: ["I spent 3 months trying to fix this the wrong way", "Most people don't realize this about JavaScript"]

Format: ["Hook option one", "Hook option two"]`;

  const userPrompt = `Video Concept: ${concept}
${title ? `Title: ${title}` : ""}
${angle ? `Angle: ${angle}` : ""}

Generate hook options that feel authentic to this creator's voice and angle:`;

  const responseText = await runPrompt({
    systemPrompt,
    userPrompt,
    maxTokens: 300,
  });

  const hooks = extractListItems(responseText).slice(0, 5);

  if (hooks.length === 0) {
    throw new Error("No hooks returned from OpenAI");
  }

  return hooks;
}

export async function generateSituationPrompts(
  options: GenerateSituationPromptsOptions
): Promise<string[]> {
  const { concept, title, savedHooks } = options;

  const systemPrompt = `You are a practical video planning assistant.
Generate short "situation prompts" that remind a creator when to pull out the camera.

Rules:
- Return valid JSON array only
- 6 to 10 items
- Each item is one simple line, 4 to 14 words
- Focus on moments/situations, not camera jargon
- No technical shot language like focal length, framing, aperture
- Keep each item action-triggered and specific enough to recognize in real life
- Use plain language`;

  const userPrompt = `Video concept: ${concept}
${title ? `Current title: ${title}` : ""}
${savedHooks && savedHooks.length > 0 ? `Saved hooks for context: ${savedHooks.join(" | ")}` : ""}

Generate situation prompts for this creator.`;

  const responseText = await runPrompt({
    systemPrompt,
    userPrompt,
    maxTokens: 350,
  });

  const prompts = extractListItems(responseText)
    .map((item) => item.replace(/\.$/, "").trim())
    .filter(Boolean)
    .slice(0, 10);

  if (prompts.length === 0) {
    throw new Error("No situation prompts returned from OpenAI");
  }

  return prompts;
}
