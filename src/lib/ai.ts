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

interface GenerateThumbnailOptions {
  concept: string;
  title?: string;
  angle?: string;
}

function cleanListItem(raw: string) {
  return raw
    .replace(/^\s*[-*•]\s*/, "")
    .replace(/^\s*\d+[).\-:]\s*/, "")
    .replace(/^\s*`+|`+\s*$/g, "")
    .replace(/^\s*["'“”]+|["'“”]+\s*$/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function extractListItems(responseText: string) {
  const trimmed = responseText.trim();

  try {
    const parsed = JSON.parse(trimmed) as unknown;

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
  } catch {
    // Fall through to plain-text parsing.
  }

  return trimmed
    .split(/\n+/)
    .map(cleanListItem)
    .filter(Boolean);
}

function extractJsonPayload(responseText: string) {
  const trimmed = responseText.trim();

  try {
    return JSON.parse(trimmed) as unknown;
  } catch {
    const firstBracket = trimmed.indexOf("[");
    const firstBrace = trimmed.indexOf("{");
    const candidates = [firstBracket, firstBrace].filter((value) => value >= 0);

    if (candidates.length === 0) {
      return null;
    }

    const start = Math.min(...candidates);

    try {
      return JSON.parse(trimmed.slice(start)) as unknown;
    } catch {
      return null;
    }
  }
}

export interface ThumbnailDirectionOption {
  mainVisualElement: string;
  colorPalette: string;
  composition: string;
  textOverlay: string;
  emotionalTone: string;
  referenceStyle: string;
}

function normalizeThumbnailOption(item: unknown): ThumbnailDirectionOption | null {
  if (typeof item === "string") {
    const cleaned = cleanListItem(item);
    if (!cleaned) return null;

    return {
      mainVisualElement: cleaned,
      colorPalette: "",
      composition: "",
      textOverlay: "",
      emotionalTone: "",
      referenceStyle: "",
    };
  }

  if (!item || typeof item !== "object") {
    return null;
  }

  const record = item as Record<string, unknown>;
  const read = (...keys: string[]) => {
    for (const key of keys) {
      const value = record[key];
      if (typeof value === "string" && value.trim()) {
        return cleanListItem(value);
      }
    }

    return "";
  };

  const mainVisualElement = read("mainVisualElement", "main visual element", "visual", "summary", "subject");
  if (!mainVisualElement) {
    return null;
  }

  return {
    mainVisualElement,
    colorPalette: read("colorPalette", "color palette", "palette"),
    composition: read("composition", "composition idea", "layout"),
    textOverlay: read("textOverlay", "text overlay", "text"),
    emotionalTone: read("emotionalTone", "emotional tone", "tone"),
    referenceStyle: read("referenceStyle", "reference style", "style"),
  };
}

export function parseThumbnailDirections(responseText: string): ThumbnailDirectionOption[] {
  const parsed = extractJsonPayload(responseText);

  if (Array.isArray(parsed)) {
    return parsed
      .map(normalizeThumbnailOption)
      .filter((item): item is ThumbnailDirectionOption => item !== null)
      .slice(0, 5);
  }

  if (parsed && typeof parsed === "object") {
    const list = Object.values(parsed as Record<string, unknown>).find(Array.isArray);
    if (Array.isArray(list)) {
      return list
        .map(normalizeThumbnailOption)
        .filter((item): item is ThumbnailDirectionOption => item !== null)
        .slice(0, 5);
    }
  }

  return [];
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

  const systemPrompt = `You are a YouTube hook expert.

Return a JSON array of exactly 5 short hook options.

Rules:
- Each item should be 1-2 sentences max
- Each item should feel like a strong opening line for the first 3 seconds
- No markdown
- No labels
- No commentary
- Return only valid JSON

Example format:
["Hook option one", "Hook option two"]`;

  const userPrompt = `Video Concept: ${concept}
${title ? `Title: ${title}` : ""}
${angle ? `Angle: ${angle}` : ""}

Generate hook options:`;

  const responseText = await runPrompt({
    systemPrompt,
    userPrompt,
    maxTokens: 250,
  });

  const hooks = extractListItems(responseText).slice(0, 5);

  if (hooks.length === 0) {
    throw new Error("No hooks returned from OpenAI");
  }

  return hooks;
}

export async function generateThumbnailDirection(
  options: GenerateThumbnailOptions
): Promise<ThumbnailDirectionOption[]> {
  const { concept, title, angle } = options;

  const systemPrompt = `You are a YouTube thumbnail designer.

Return a JSON array of exactly 5 objects.

Each object must include these string fields:
- mainVisualElement
- colorPalette
- composition
- textOverlay
- emotionalTone
- referenceStyle

Rules:
- Return only valid JSON
- No markdown
- No bullets
- No commentary
- Keep each field short and concrete
- Make each option meaningfully different

Example:
[{"mainVisualElement":"...","colorPalette":"...","composition":"...","textOverlay":"...","emotionalTone":"...","referenceStyle":"..."}]`;

  const userPrompt = `Video Concept: ${concept}
${title ? `Title: ${title}` : ""}
${angle ? `Angle: ${angle}` : ""}

Generate thumbnail options as structured JSON:`;

  const responseText = await runPrompt({
    systemPrompt,
    userPrompt,
    maxTokens: 300,
  });

  const thumbnails = parseThumbnailDirections(responseText);

  if (thumbnails.length === 0) {
    throw new Error("No thumbnail directions returned from OpenAI");
  }

  return thumbnails;
}
