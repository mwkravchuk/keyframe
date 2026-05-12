import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { VideoProjectStage } from "@prisma/client";
import { authOptions } from "@/lib/auth";
import { getUserIdWithDevBypass } from "@/lib/dev-auth-bypass";
import { prisma } from "@/lib/prisma";

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
    rawIdea?: string;
    briefFormat?: string;
    briefData?: string;
  };
  const title = (body.title ?? "").trim();
  const concept = (body.concept ?? "").trim();
  const notes = (body.notes ?? "").trim();
  const youtubeChannelId = (body.youtubeChannelId ?? "").trim() || null;
  const rawIdea = (body.rawIdea ?? "").trim() || null;
  const briefFormat = (body.briefFormat ?? "").trim() || null;
  const briefData = (body.briefData ?? "").trim() || null;

  if (!title) {
    return NextResponse.json({ error: "Title is required" }, { status: 400 });
  }

  const project = await prisma.videoProject.create({
    data: {
      userId,
      title,
      concept: concept || null,
      rawIdea,
      briefFormat,
      briefData,
      notes: notes || null,
      stage: VideoProjectStage.IDEA,
      youtubeChannelId,
    },
    select: {
      id: true,
      title: true,
      concept: true,
      notes: true,
      nextStep: true,
      stage: true,
        youtubeChannelId: true,
    },
  });

  return NextResponse.json({ project });
}
