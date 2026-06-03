import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { VideoProjectStage } from "@prisma/client";
import { authOptions } from "@/lib/auth";
import { getUserIdWithDevBypass } from "@/lib/dev-auth-bypass";
import { prisma } from "@/lib/prisma";

const UNTITLED_BASE = "Untitled";

function getNextUntitledTitle(existingTitles: string[]) {
  let sawBaseTitle = false;
  let highestNumber = 1;

  for (const rawTitle of existingTitles) {
    const trimmed = rawTitle.trim();
    if (!trimmed) {
      continue;
    }

    const match = trimmed.match(/^Untitled(?:\s+(\d+))?$/i);
    if (!match) {
      continue;
    }

    if (!match[1]) {
      sawBaseTitle = true;
      continue;
    }

    const parsed = Number.parseInt(match[1], 10);
    if (!Number.isNaN(parsed)) {
      highestNumber = Math.max(highestNumber, parsed);
    }
  }

  if (!sawBaseTitle && highestNumber === 1) {
    return UNTITLED_BASE;
  }

  return `${UNTITLED_BASE} ${highestNumber + 1}`;
}

async function resolveProjectTitle(userId: string, providedTitle: string) {
  if (providedTitle) {
    return providedTitle;
  }

  const untitledProjects = await prisma.videoProject.findMany({
    where: {
      userId,
      title: {
        startsWith: UNTITLED_BASE,
        mode: "insensitive",
      },
    },
    select: { title: true },
  });

  return getNextUntitledTitle(untitledProjects.map((project) => project.title));
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  const userId = await getUserIdWithDevBypass(session?.user?.id);

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as {
    title?: string;
    concept?: string;
    notes?: string;
    youtubeChannelId?: string;
    youtubeVideoUrl?: string;
    rawIdea?: string;
    briefFormat?: string;
    briefData?: string;
  };
  const title = (body.title ?? "").trim();
  const concept = (body.concept ?? "").trim();
  const notes = (body.notes ?? "").trim();
  const youtubeChannelId = (body.youtubeChannelId ?? "").trim() || null;
  const youtubeVideoUrl = (body.youtubeVideoUrl ?? "").trim() || null;
  const rawIdea = (body.rawIdea ?? "").trim() || null;
  const briefFormat = (body.briefFormat ?? "").trim() || null;
  const briefData = (body.briefData ?? "").trim() || null;
  const resolvedTitle = await resolveProjectTitle(userId, title);

  const project = await prisma.videoProject.create({
    data: {
      userId,
      title: resolvedTitle,
      concept: concept || null,
      rawIdea,
      briefFormat,
      briefData,
      notes: notes || null,
      stage: VideoProjectStage.IDEA,
      youtubeChannelId,
      youtubeVideoUrl,
    },
    select: {
      id: true,
      title: true,
      concept: true,
      notes: true,
      nextStep: true,
      stage: true,
      youtubeChannelId: true,
      youtubeVideoUrl: true,
    },
  });

  return NextResponse.json({ project });
}
