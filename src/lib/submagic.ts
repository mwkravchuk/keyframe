type SubmagicCreateMagicClipsPayload = {
  title: string;
  language: string;
  youtubeUrl: string;
  minClipLength?: number;
  maxClipLength?: number;
  faceTracking?: boolean;
  webhookUrl?: string;
};

type SubmagicProjectResponse = {
  id: string;
  title?: string;
  status?: string;
  language?: string;
  templateName?: string | null;
  userThemeId?: string | null;
  createdAt?: string;
  updatedAt?: string;
  previewUrl?: string;
  downloadUrl?: string;
  directUrl?: string;
  magicClips?: Array<{
    id: string;
    title?: string;
    duration?: number;
    status?: string;
    previewUrl?: string;
    downloadUrl?: string;
    directUrl?: string;
    viralityScores?: {
      total?: number;
      shareability?: number;
      hook_strength?: number;
      story_quality?: number;
      emotional_impact?: number;
    };
  }>;
  failureReason?: string;
};

export type SubmagicNormalizedProject = {
  id: string;
  status: string;
  previewUrl: string | null;
  downloadUrl: string | null;
  directUrl: string | null;
  failureReason: string | null;
  updatedAt: string | null;
  magicClips: Array<{
    id: string;
    title: string;
    status: string;
    duration: number | null;
    previewUrl: string | null;
    downloadUrl: string | null;
    directUrl: string | null;
    viralityTotal: number | null;
  }>;
};

function getSubmagicApiKey() {
  const apiKey = process.env.SUBMAGIC_API_KEY?.trim();
  if (!apiKey) {
    throw new Error("SUBMAGIC_API_KEY is not configured.");
  }

  return apiKey;
}

async function submagicRequest<T>(path: string, init: RequestInit): Promise<T> {
  const response = await fetch(`https://api.submagic.co${path}`, {
    ...init,
    headers: {
      "x-api-key": getSubmagicApiKey(),
      "Content-Type": "application/json",
      ...(init.headers ?? {}),
    },
    cache: "no-store",
  });

  const payload = (await response.json().catch(() => ({}))) as {
    message?: string;
    error?: string;
  } & T;

  if (!response.ok) {
    const reason = payload.message || payload.error || "Submagic request failed.";
    throw new Error(reason);
  }

  return payload;
}

export function normalizeSubmagicProject(data: SubmagicProjectResponse): SubmagicNormalizedProject {
  return {
    id: data.id,
    status: data.status ?? "unknown",
    previewUrl: data.previewUrl ?? null,
    downloadUrl: data.downloadUrl ?? null,
    directUrl: data.directUrl ?? null,
    failureReason: data.failureReason ?? null,
    updatedAt: data.updatedAt ?? null,
    magicClips: (data.magicClips ?? []).map((clip) => ({
      id: clip.id,
      title: clip.title?.trim() || "Untitled clip",
      status: clip.status ?? "unknown",
      duration: typeof clip.duration === "number" ? clip.duration : null,
      previewUrl: clip.previewUrl ?? null,
      downloadUrl: clip.downloadUrl ?? null,
      directUrl: clip.directUrl ?? null,
      viralityTotal:
        typeof clip.viralityScores?.total === "number" ? clip.viralityScores.total : null,
    })),
  };
}

export async function createSubmagicMagicClipsProject(
  payload: SubmagicCreateMagicClipsPayload,
): Promise<SubmagicProjectResponse> {
  return submagicRequest<SubmagicProjectResponse>("/v1/projects/magic-clips", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function getSubmagicProject(projectId: string): Promise<SubmagicProjectResponse> {
  return submagicRequest<SubmagicProjectResponse>(`/v1/projects/${projectId}`, {
    method: "GET",
  });
}
