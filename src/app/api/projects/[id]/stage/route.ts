import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { VideoProjectStage } from "@prisma/client";
import { authOptions } from "@/lib/auth";
import { getUserIdWithDevBypass } from "@/lib/dev-auth-bypass";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getServerSession(authOptions);
  const userId = await getUserIdWithDevBypass(session?.user?.id);

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as { stage?: string };
  const { id } = await params;

  if (!body.stage || !Object.values(VideoProjectStage).includes(body.stage as VideoProjectStage)) {
    return NextResponse.json({ error: "Invalid stage" }, { status: 400 });
  }

  await prisma.videoProject.updateMany({
    where: {
      id,
      userId,
    },
    data: {
      stage: body.stage as VideoProjectStage,
    },
  });

  return NextResponse.json({ ok: true });
}
