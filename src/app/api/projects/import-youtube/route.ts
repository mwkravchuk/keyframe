import { NextResponse } from "next/server";
import { VideoProjectStage } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getUserIdWithDevBypass } from "@/lib/dev-auth-bypass";
import { prisma } from "@/lib/prisma";
import { listRecentYoutubeVideosForUser } from "@/lib/youtube";

type ImportBody = {
  channelId?: string;
  limit?: number;
  pageToken?: string;
};

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  const userId = await getUserIdWithDevBypass(session?.user?.id);

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json().catch(() => ({}))) as ImportBody;
  const channelId = (body.channelId ?? "").trim() || null;
  const pageToken = (body.pageToken ?? "").trim() || null;
  const parsedLimit = Number(body.limit ?? 12);
  const limit = Number.isFinite(parsedLimit) ? parsedLimit : 12;

  const result = await listRecentYoutubeVideosForUser(userId, {
    channelId,
    limit,
    pageToken,
  });

  if (result.status !== "ok") {
    if (result.status === "missing-google-account") {
      return NextResponse.json(
        { error: "Google account is not connected." },
        { status: 400 },
      );
    }

    if (result.status === "missing-refresh-token") {
      return NextResponse.json(
        {
          error:
            "Missing refresh token. Sign out and sign back in again to reconnect Google.",
        },
        { status: 400 },
      );
    }

    return NextResponse.json(
      {
        error: result.message,
        code: result.code,
      },
      { status: result.code >= 400 && result.code < 600 ? result.code : 502 },
    );
  }

  const channel = channelId
    ? await prisma.youtubeChannel.findUnique({
        where: {
          userId_channelId: {
            userId,
            channelId,
          },
        },
        select: { channelId: true },
      })
    : await prisma.youtubeChannel.findFirst({
        where: { userId, isActive: true },
        select: { channelId: true },
        orderBy: [{ updatedAt: "desc" }],
      });

  if (!channel?.channelId) {
    return NextResponse.json(
      { error: "No active channel selected. Choose a linked channel first." },
      { status: 400 },
    );
  }

  const urls = result.videos.map((video) => video.url);
  if (urls.length === 0) {
    return NextResponse.json({
      createdCount: 0,
      skippedCount: 0,
      nextPageToken: result.nextPageToken,
    });
  }

  const existing = await prisma.videoProject.findMany({
    where: {
      userId,
      youtubeVideoUrl: {
        in: urls,
      },
    },
    select: { youtubeVideoUrl: true },
  });

  const existingUrlSet = new Set(
    existing
      .map((project) => project.youtubeVideoUrl)
      .filter((value): value is string => Boolean(value)),
  );

  const toCreate = result.videos.filter((video) => !existingUrlSet.has(video.url));

  if (toCreate.length > 0) {
    await prisma.videoProject.createMany({
      data: toCreate.map((video) => ({
        userId,
        title: video.title,
        stage: VideoProjectStage.PUBLISHED,
        youtubeChannelId: channel.channelId,
        youtubeVideoUrl: video.url,
      })),
    });
  }

  return NextResponse.json({
    createdCount: toCreate.length,
    skippedCount: result.videos.length - toCreate.length,
    nextPageToken: result.nextPageToken,
  });
}
