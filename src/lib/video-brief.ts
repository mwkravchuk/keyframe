export const VIDEO_FORMATS = ["journey", "challenge", "educational", "vlog"] as const;

export type VideoFormat = (typeof VIDEO_FORMATS)[number];

export type VideoBriefField =
  | "format"
  | "topic"
  | "audience"
  | "outcome"
  | "stakes"
  | "constraints"
  | "tone";

export interface VideoBrief {
  format: VideoFormat | null;
  topic: string | null;
  audience: string | null;
  outcome: string | null;
  stakes: string | null;
  constraints: string | null;
  tone: string | null;
  rawIdea: string;
  confidenceByField: Record<VideoBriefField, number>;
  missingFields: VideoBriefField[];
}

const FIELD_PRIORITY: VideoBriefField[] = [
  "outcome",
  "topic",
  "audience",
  "constraints",
  "stakes",
  "tone",
  "format",
];

const QUESTION_LABELS: Record<VideoBriefField, string> = {
  format: "What format best fits this video?",
  topic: "What is the core topic in one line?",
  audience: "Who is this for specifically?",
  outcome: "What should the viewer get by the end?",
  stakes: "What tension or goal drives the video?",
  constraints: "Any constraints (time, location, budget, gear)?",
  tone: "What tone should this feel like?",
};

function normalizeText(value: unknown) {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function normalizeFormat(value: unknown): VideoFormat | null {
  if (typeof value !== "string") {
    return null;
  }

  const normalized = value.trim().toLowerCase();
  return VIDEO_FORMATS.includes(normalized as VideoFormat)
    ? (normalized as VideoFormat)
    : null;
}

function score(value: string | null) {
  if (!value) {
    return 0;
  }

  if (value.length >= 60) {
    return 0.95;
  }

  if (value.length >= 25) {
    return 0.82;
  }

  return 0.68;
}

export function normalizeVideoBrief(input: unknown, rawIdea: string): VideoBrief {
  const source = (input && typeof input === "object" ? input : {}) as Record<string, unknown>;

  const format = normalizeFormat(source.format);
  const topic = normalizeText(source.topic);
  const audience = normalizeText(source.audience);
  const outcome = normalizeText(source.outcome);
  const stakes = normalizeText(source.stakes);
  const constraints = normalizeText(source.constraints);
  const tone = normalizeText(source.tone);

  const confidenceByField: Record<VideoBriefField, number> = {
    format: format ? 0.9 : 0,
    topic: score(topic),
    audience: score(audience),
    outcome: score(outcome),
    stakes: score(stakes),
    constraints: score(constraints),
    tone: score(tone),
  };

  const missingFields = FIELD_PRIORITY.filter((field) => confidenceByField[field] < 0.7);

  return {
    format,
    topic,
    audience,
    outcome,
    stakes,
    constraints,
    tone,
    rawIdea,
    confidenceByField,
    missingFields,
  };
}

export function mergeBriefWithAnswers(
  brief: VideoBrief,
  answers: Partial<Record<VideoBriefField, string>>,
): VideoBrief {
  return normalizeVideoBrief(
    {
      ...brief,
      ...answers,
    },
    brief.rawIdea,
  );
}

export function pickFollowUpFields(brief: VideoBrief, maxQuestions = 2): VideoBriefField[] {
  return brief.missingFields.slice(0, maxQuestions);
}

export function getFollowUpQuestion(field: VideoBriefField) {
  return QUESTION_LABELS[field];
}

export function summarizeBriefForPrompt(brief: VideoBrief) {
  return [
    `Format: ${brief.format ?? "unknown"}`,
    `Topic: ${brief.topic ?? "unknown"}`,
    `Audience: ${brief.audience ?? "unknown"}`,
    `Outcome: ${brief.outcome ?? "unknown"}`,
    `Stakes: ${brief.stakes ?? "unknown"}`,
    `Constraints: ${brief.constraints ?? "unknown"}`,
    `Tone: ${brief.tone ?? "unknown"}`,
    `Raw idea: ${brief.rawIdea}`,
  ].join("\n");
}
