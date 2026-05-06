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

  const body = (await request.json()) as { title?: string; notes?: string };
  const title = (body.title ?? "").trim();
  const notes = (body.notes ?? "").trim();

  if (!title) {
    return NextResponse.json({ error: "Title is required" }, { status: 400 });
  }

  const project = await prisma.videoProject.create({
    data: {
      userId,
      title,
      notes: notes || null,
      stage: VideoProjectStage.IDEA,
    },
    select: {
      id: true,
      title: true,
      concept: true,
      notes: true,
      nextStep: true,
      stage: true,
    },
  });

  return NextResponse.json({ project });
}
