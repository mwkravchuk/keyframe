import { prisma } from "@/lib/prisma";

type GoogleTokenResponse = {
  access_token: string;
  expires_in: number;
  refresh_token?: string;
};

type GoogleTokenErrorResponse = {
  error?: string;
  error_description?: string;
};

type YoutubeChannelsResponse = {
  items?: Array<{
    id?: string;
    snippet?: {
      title?: string;
      thumbnails?: Record<string, { url?: string }>;
    };
    brandingSettings?: {
      image?: {
        bannerExternalUrl?: string;
      };
    };
  }>;
};

type YoutubeSearchResponse = {
  nextPageToken?: string;
  items?: Array<{
    id?: {
      videoId?: string;
    };
    snippet?: {
      title?: string;
      publishedAt?: string;
      thumbnails?: Record<string, { url?: string }>;
      channelId?: string;
    };
  }>;
};

export type YoutubeVideoSummary = {
  videoId: string;
  title: string;
  publishedAt: string | null;
  thumbnailUrl: string | null;
  url: string;
};

type YoutubeChannelProfile = {
  channelId: string;
  channelTitle: string | null;
  avatarUrl: string | null;
  bannerUrl: string | null;
};

type GoogleApiErrorResponse = {
  error?: {
    message?: string;
    errors?: Array<{
      reason?: string;
      message?: string;
    }>;
  };
};

export type YoutubeSyncResult =
  | {
      status: "ok";
      profile: YoutubeChannelProfile;
      channels: YoutubeChannelProfile[];
    }
  | { status: "missing-google-account" }
  | { status: "missing-refresh-token" }
  | { status: "no-channel" }
  | { status: "google-oauth-not-configured" }
  | { status: "youtube-api-error"; code: number; message: string };

export type YoutubeSetActiveResult =
  | { status: "ok"; profile: YoutubeChannelProfile }
  | { status: "missing-channel" };

export type YoutubeListVideosResult =
  | { status: "ok"; videos: YoutubeVideoSummary[]; nextPageToken: string | null }
  | { status: "missing-google-account" }
  | { status: "missing-refresh-token" }
  | { status: "youtube-api-error"; code: number; message: string };

function selectBestThumbnail(
  thumbnails: Record<string, { url?: string }> | undefined,
): string | null {
  if (!thumbnails) {
    return null;
  }

  const byPriority = ["maxres", "high", "medium", "default"];
  for (const key of byPriority) {
    const candidate = thumbnails[key]?.url;
    if (candidate) {
      return candidate;
    }
  }

  for (const value of Object.values(thumbnails)) {
    if (value?.url) {
      return value.url;
    }
  }

  return null;
}

async function refreshGoogleAccessToken(refreshToken: string) {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return { status: "google-oauth-not-configured" as const };
  }

  const body = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    grant_type: "refresh_token",
    refresh_token: refreshToken,
  });

  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  });

  if (!response.ok) {
    let message = "Failed to refresh Google access token.";

    try {
      const errorData = (await response.json()) as GoogleTokenErrorResponse;
      const code = (errorData.error ?? "").trim();
      const details = (errorData.error_description ?? "").trim();

      if (code === "invalid_grant") {
        message =
          "Google refresh token is invalid or expired. Reconnect your Google account by signing out and signing in again.";
      } else if (code) {
        message = details ? `${code}: ${details}` : code;
      } else if (details) {
        message = details;
      }
    } catch {
      // Keep generic message if response is not JSON.
    }

    return {
      status: "youtube-api-error" as const,
      code: response.status,
      message,
    };
  }

  const tokenData = (await response.json()) as GoogleTokenResponse;
  return {
    status: "ok" as const,
    tokenData,
  };
}

async function fetchYoutubeChannels(accessToken: string) {
  const response = await fetch(
    "https://www.googleapis.com/youtube/v3/channels?part=snippet,brandingSettings&mine=true",
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      cache: "no-store",
    },
  );

  if (!response.ok) {
    let message = "Failed to load YouTube channel profile.";
    try {
      const errorData = (await response.json()) as GoogleApiErrorResponse;
      const reason = errorData.error?.errors?.[0]?.reason;

      if (reason === "insufficientPermissions") {
        message =
          "Missing YouTube permission on your Google session. Sign out and sign back in to grant YouTube access.";
      } else {
        message =
          errorData.error?.message ||
          errorData.error?.errors?.[0]?.message ||
          message;
      }
    } catch {
      // Keep generic message if response is not JSON.
    }

    return {
      status: "error" as const,
      code: response.status,
      message,
    };
  }

  const data = (await response.json()) as YoutubeChannelsResponse;
  const channels = (data.items ?? [])
    .filter((channel): channel is NonNullable<typeof channel> & { id: string } => Boolean(channel?.id))
    .map((channel) => ({
      channelId: channel.id,
      channelTitle: channel.snippet?.title ?? null,
      avatarUrl: selectBestThumbnail(channel.snippet?.thumbnails),
      bannerUrl: channel.brandingSettings?.image?.bannerExternalUrl ?? null,
    }));

  if (channels.length === 0) {
    return { status: "no-channel" as const };
  }

  return {
    status: "ok" as const,
    channels,
  };
}

async function fetchRecentVideosForChannel(
  accessToken: string,
  channelId: string,
  limit: number,
  pageToken?: string,
) {
  const query = new URLSearchParams({
    part: "snippet",
    channelId,
    type: "video",
    order: "date",
    maxResults: String(limit),
  });

  if (pageToken) {
    query.set("pageToken", pageToken);
  }

  const response = await fetch(
    `https://www.googleapis.com/youtube/v3/search?${query.toString()}`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      cache: "no-store",
    },
  );

  if (!response.ok) {
    let message = "Failed to load YouTube videos.";
    try {
      const errorData = (await response.json()) as GoogleApiErrorResponse;
      message =
        errorData.error?.message ||
        errorData.error?.errors?.[0]?.message ||
        message;
    } catch {
      // Keep generic message if response is not JSON.
    }

    return {
      status: "error" as const,
      code: response.status,
      message,
    };
  }

  const data = (await response.json()) as YoutubeSearchResponse;
  const videos = (data.items ?? [])
    .map((item) => {
      const videoId = item.id?.videoId;
      if (!videoId) {
        return null;
      }

      const title = item.snippet?.title?.trim() || "Untitled video";
      return {
        videoId,
        title,
        publishedAt: item.snippet?.publishedAt ?? null,
        thumbnailUrl: selectBestThumbnail(item.snippet?.thumbnails),
        url: `https://www.youtube.com/watch?v=${videoId}`,
      };
    })
    .filter((item): item is YoutubeVideoSummary => Boolean(item));

  return {
    status: "ok" as const,
    videos,
    nextPageToken: data.nextPageToken ?? null,
  };
}

async function getValidGoogleAccessTokens(userId: string) {
  const accounts = await prisma.account.findMany({
    where: {
      userId,
      provider: "google",
    },
    orderBy: {
      id: "asc",
    },
  });

  if (accounts.length === 0) {
    return { status: "missing-google-account" as const };
  }

  const tokens: string[] = [];
  let hasMissingRefreshToken = false;
  let firstApiError: { code: number; message: string } | null = null;

  for (const account of accounts) {
    const isExpired = account.expires_at
      ? account.expires_at <= Math.floor(Date.now() / 1000) + 60
      : false;
    let accessToken = account.access_token;
    let refreshToken = account.refresh_token;

    if ((!accessToken || isExpired) && !refreshToken) {
      hasMissingRefreshToken = true;
      continue;
    }

    if (!accessToken || isExpired) {
      const refreshed = await refreshGoogleAccessToken(refreshToken as string);
      if (refreshed.status !== "ok") {
        if (refreshed.status === "youtube-api-error") {
          firstApiError ??= { code: refreshed.code, message: refreshed.message };
        }
        continue;
      }

      accessToken = refreshed.tokenData.access_token;
      refreshToken = refreshed.tokenData.refresh_token ?? refreshToken;

      await prisma.account.update({
        where: { id: account.id },
        data: {
          access_token: accessToken,
          refresh_token: refreshToken,
          expires_at: Math.floor(Date.now() / 1000) + refreshed.tokenData.expires_in,
        },
      });
    }

    if (accessToken) {
      tokens.push(accessToken);
    }
  }

  if (tokens.length === 0) {
    if (firstApiError) {
      return {
        status: "youtube-api-error" as const,
        code: firstApiError.code,
        message: firstApiError.message,
      };
    }

    if (hasMissingRefreshToken) {
      return { status: "missing-refresh-token" as const };
    }

    return {
      status: "youtube-api-error" as const,
      code: 502,
      message: "No valid Google tokens available.",
    };
  }

  return {
    status: "ok" as const,
    tokens,
  };
}

function toUserYoutubeFields(profile: YoutubeChannelProfile) {
  return {
    youtubeChannelId: profile.channelId,
    youtubeChannelTitle: profile.channelTitle,
    youtubeAvatarUrl: profile.avatarUrl,
    youtubeBannerUrl: profile.bannerUrl,
    youtubeLinkedAt: new Date(),
  };
}

export async function listYoutubeChannelsForUser(userId: string) {
  return prisma.youtubeChannel.findMany({
    where: { userId },
    orderBy: [{ isActive: "desc" }, { updatedAt: "desc" }],
    select: {
      channelId: true,
      title: true,
      avatarUrl: true,
      bannerUrl: true,
      isActive: true,
    },
  });
}

export async function setActiveYoutubeChannelForUser(
  userId: string,
  channelId: string,
): Promise<YoutubeSetActiveResult> {
  const channel = await prisma.youtubeChannel.findUnique({
    where: {
      userId_channelId: {
        userId,
        channelId,
      },
    },
    select: {
      channelId: true,
      title: true,
      avatarUrl: true,
      bannerUrl: true,
    },
  });

  if (!channel) {
    return { status: "missing-channel" };
  }

  await prisma.$transaction([
    prisma.youtubeChannel.updateMany({
      where: { userId },
      data: { isActive: false },
    }),
    prisma.youtubeChannel.update({
      where: {
        userId_channelId: {
          userId,
          channelId,
        },
      },
      data: {
        isActive: true,
      },
    }),
    prisma.user.update({
      where: { id: userId },
      data: toUserYoutubeFields({
        channelId: channel.channelId,
        channelTitle: channel.title,
        avatarUrl: channel.avatarUrl,
        bannerUrl: channel.bannerUrl,
      }),
    }),
  ]);

  return {
    status: "ok",
    profile: {
      channelId: channel.channelId,
      channelTitle: channel.title,
      avatarUrl: channel.avatarUrl,
      bannerUrl: channel.bannerUrl,
    },
  };
}

export async function syncYoutubeProfileForUser(userId: string): Promise<YoutubeSyncResult> {
  const accounts = await prisma.account.findMany({
    where: {
      userId,
      provider: "google",
    },
    orderBy: {
      id: "asc",
    },
  });

  if (accounts.length === 0) {
    return { status: "missing-google-account" };
  }

  const channelById = new Map<string, YoutubeChannelProfile>();
  let hasMissingRefreshToken = false;
  let firstApiError: { code: number; message: string } | null = null;

  for (const account of accounts) {
    const isExpired = account.expires_at ? account.expires_at <= Math.floor(Date.now() / 1000) + 60 : false;
    let accessToken = account.access_token;
    let refreshToken = account.refresh_token;

    if ((!accessToken || isExpired) && !refreshToken) {
      hasMissingRefreshToken = true;
      continue;
    }

    if (!accessToken || isExpired) {
      const refreshed = await refreshGoogleAccessToken(refreshToken as string);

      if (refreshed.status !== "ok") {
        if (refreshed.status === "youtube-api-error") {
          firstApiError ??= { code: refreshed.code, message: refreshed.message };
        }
        continue;
      }

      accessToken = refreshed.tokenData.access_token;
      refreshToken = refreshed.tokenData.refresh_token ?? refreshToken;

      await prisma.account.update({
        where: { id: account.id },
        data: {
          access_token: accessToken,
          refresh_token: refreshToken,
          expires_at: Math.floor(Date.now() / 1000) + refreshed.tokenData.expires_in,
        },
      });
    }

    let channelResponse = await fetchYoutubeChannels(accessToken as string);

    if (channelResponse.status === "error" && channelResponse.code === 401 && refreshToken) {
      const refreshed = await refreshGoogleAccessToken(refreshToken);
      if (refreshed.status !== "ok") {
        if (refreshed.status === "youtube-api-error") {
          firstApiError ??= { code: refreshed.code, message: refreshed.message };
        }
        continue;
      }

      accessToken = refreshed.tokenData.access_token;
      refreshToken = refreshed.tokenData.refresh_token ?? refreshToken;

      await prisma.account.update({
        where: { id: account.id },
        data: {
          access_token: accessToken,
          refresh_token: refreshToken,
          expires_at: Math.floor(Date.now() / 1000) + refreshed.tokenData.expires_in,
        },
      });

      channelResponse = await fetchYoutubeChannels(accessToken);
    }

    if (channelResponse.status === "error") {
      if (channelResponse.code === 403 && channelResponse.message.includes("Missing YouTube permission")) {
        continue;
      }

      firstApiError ??= {
        code: channelResponse.code,
        message: channelResponse.message,
      };
      continue;
    }

    if (channelResponse.status === "no-channel") {
      continue;
    }

    for (const channel of channelResponse.channels) {
      channelById.set(channel.channelId, channel);
    }
  }

  const syncedChannels = Array.from(channelById.values());

  if (syncedChannels.length === 0) {
    if (firstApiError) {
      return {
        status: "youtube-api-error",
        code: firstApiError.code,
        message: firstApiError.message,
      };
    }

    if (hasMissingRefreshToken) {
      return { status: "missing-refresh-token" };
    }

    return { status: "no-channel" };
  }

  const existingChannels = await prisma.youtubeChannel.findMany({
    where: { userId },
    select: {
      channelId: true,
      isActive: true,
    },
  });
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { youtubeChannelId: true },
  });

  const existingActiveChannelId = existingChannels.find((channel) => channel.isActive)?.channelId;
  const previousUserChannelId = user?.youtubeChannelId ?? null;
  const preferredChannelId =
    (existingActiveChannelId && syncedChannels.some((channel) => channel.channelId === existingActiveChannelId)
      ? existingActiveChannelId
      : null) ??
    (previousUserChannelId && syncedChannels.some((channel) => channel.channelId === previousUserChannelId)
      ? previousUserChannelId
      : null) ??
    syncedChannels[0]?.channelId;

  const activeProfile =
    syncedChannels.find((channel) => channel.channelId === preferredChannelId) ??
    syncedChannels[0];

  await prisma.$transaction([
    ...syncedChannels.map((channel) =>
      prisma.youtubeChannel.upsert({
        where: {
          userId_channelId: {
            userId,
            channelId: channel.channelId,
          },
        },
        create: {
          userId,
          channelId: channel.channelId,
          title: channel.channelTitle,
          avatarUrl: channel.avatarUrl,
          bannerUrl: channel.bannerUrl,
          isActive: channel.channelId === activeProfile.channelId,
          lastSyncedAt: new Date(),
        },
        update: {
          title: channel.channelTitle,
          avatarUrl: channel.avatarUrl,
          bannerUrl: channel.bannerUrl,
          isActive: channel.channelId === activeProfile.channelId,
          lastSyncedAt: new Date(),
        },
      }),
    ),
    prisma.youtubeChannel.updateMany({
      where: {
        userId,
        channelId: {
          notIn: syncedChannels.map((channel) => channel.channelId),
        },
      },
      data: {
        isActive: false,
      },
    }),
    prisma.user.update({
      where: { id: userId },
      data: toUserYoutubeFields(activeProfile),
    }),
  ]);

  return {
    status: "ok",
    profile: activeProfile,
    channels: syncedChannels,
  };
}

export async function listRecentYoutubeVideosForUser(
  userId: string,
  options?: { channelId?: string | null; limit?: number; pageToken?: string | null },
): Promise<YoutubeListVideosResult> {
  const resolvedLimit = Math.min(Math.max(options?.limit ?? 12, 1), 25);
  const preferredChannelId = options?.channelId ?? null;
  const pageToken = options?.pageToken ?? null;

  const activeChannel = preferredChannelId
    ? await prisma.youtubeChannel.findUnique({
        where: {
          userId_channelId: {
            userId,
            channelId: preferredChannelId,
          },
        },
        select: { channelId: true },
      })
    : await prisma.youtubeChannel.findFirst({
        where: { userId, isActive: true },
        select: { channelId: true },
        orderBy: [{ updatedAt: "desc" }],
      });

  if (!activeChannel?.channelId) {
    return {
      status: "ok",
      videos: [],
      nextPageToken: null,
    };
  }

  const tokensResult = await getValidGoogleAccessTokens(userId);
  if (tokensResult.status !== "ok") {
    return tokensResult;
  }

  let firstError: { code: number; message: string } | null = null;

  for (const token of tokensResult.tokens) {
    const result = await fetchRecentVideosForChannel(
      token,
      activeChannel.channelId,
      resolvedLimit,
      pageToken ?? undefined,
    );

    if (result.status === "ok") {
      return result;
    }

    firstError ??= { code: result.code, message: result.message };
  }

  return {
    status: "youtube-api-error",
    code: firstError?.code ?? 502,
    message: firstError?.message ?? "Failed to load YouTube videos.",
  };
}
