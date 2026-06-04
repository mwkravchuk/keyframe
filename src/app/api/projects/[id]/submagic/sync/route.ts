import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getUserIdWithDevBypass } from "@/lib/dev-auth-bypass";
import { prisma } from "@/lib/prisma";
import { getSubmagicProject, normalizeSubmagicProject } from "@/lib/submagic";

export async function POST(
  _request: Request,
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
    select: { id: true, submagicProjectId: true },
  });

  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  if (!project.submagicProjectId) {
    return NextResponse.json(
      { error: "No Submagic project linked yet." },
      { status: 400 },
    );
  }

  try {
    const remote = await getSubmagicProject(project.submagicProjectId);
    const normalized = normalizeSubmagicProject(remote);

    await prisma.videoProject.update({
      where: { id: project.id },
      data: {
        submagicStatus: normalized.status,
        submagicData: JSON.stringify(normalized),
        submagicSyncedAt: new Date(),
      },
    });

    return NextResponse.json({ ok: true, status: normalized.status, data: normalized });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to sync Submagic project." },
      { status: 500 },
    );
  }
}
