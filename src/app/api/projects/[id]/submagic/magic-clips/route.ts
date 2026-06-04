import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getUserIdWithDevBypass } from "@/lib/dev-auth-bypass";
import { prisma } from "@/lib/prisma";
import {
  createSubmagicMagicClipsProject,
  getSubmagicProject,
  normalizeSubmagicProject,
} from "@/lib/submagic";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getServerSession(authOptions);
  const userId = await getUserIdWithDevBypass(session?.user?.id);

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const project = await prisma.videoProject.findFirst({
    where: { id, userId },
    select: {
      id: true,
      title: true,
      youtubeVideoUrl: true,
      submagicProjectId: true,
    },
  });

  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  if (!project.youtubeVideoUrl) {
    return NextResponse.json(
      { error: "Add a YouTube video URL before generating clips." },
      { status: 400 },
    );
  }

  try {
    const body = (await request.json().catch(() => ({}))) as {
      language?: string;
      minClipLength?: number;
      maxClipLength?: number;
      faceTracking?: boolean;
    };

    const language = (body.language ?? "en").trim() || "en";
    const minClipLength =
      typeof body.minClipLength === "number" ? Math.max(15, Math.min(body.minClipLength, 300)) : 15;
    const maxClipLength =
      typeof body.maxClipLength === "number" ? Math.max(minClipLength, Math.min(body.maxClipLength, 300)) : 60;
    const faceTracking = body.faceTracking !== false;

    const created = await createSubmagicMagicClipsProject({
      title: project.title.slice(0, 100),
      language,
      youtubeUrl: project.youtubeVideoUrl,
      minClipLength,
      maxClipLength,
      faceTracking,
    });

    const current = await getSubmagicProject(created.id);
    const normalized = normalizeSubmagicProject(current);

    await prisma.videoProject.update({
      where: { id: project.id },
      data: {
        submagicProjectId: created.id,
        submagicStatus: normalized.status,
        submagicData: JSON.stringify(normalized),
        submagicSyncedAt: new Date(),
      },
    });

    return NextResponse.json({
      ok: true,
      submagicProjectId: created.id,
      status: normalized.status,
      data: normalized,
      reused: Boolean(project.submagicProjectId && project.submagicProjectId === created.id),
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create Submagic project." },
      { status: 500 },
    );
  }
}
