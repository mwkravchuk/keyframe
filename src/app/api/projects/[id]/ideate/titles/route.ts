import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getUserIdWithDevBypass } from "@/lib/dev-auth-bypass";
import { prisma } from "@/lib/prisma";
import { generateTitles } from "@/lib/ai";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    const userId = await getUserIdWithDevBypass(session?.user?.id);

    if (!userId) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { concept, angle } = body;

    if (!concept) {
      return Response.json(
        { error: "Concept is required" },
        { status: 400 }
      );
    }

    // Verify project belongs to user
    const project = await prisma.videoProject.findFirst({
      where: { id, userId },
    });

    if (!project) {
      return Response.json({ error: "Project not found" }, { status: 404 });
    }

    // Parse existing titles if they exist
    let existingTitles: string[] = [];
    if (project.proposedTitles) {
      try {
        existingTitles = JSON.parse(project.proposedTitles);
      } catch (e) {
        existingTitles = [];
      }
    }

    // Generate new titles
    const titles = await generateTitles({
      concept,
      angle,
      existingTitles,
    });

    // Store proposed titles in database
    await prisma.videoProject.update({
      where: { id },
      data: {
        proposedTitles: JSON.stringify(titles),
      },
    });

    return Response.json({ titles });
  } catch (error) {
    console.error("Title generation error:", error);
    return Response.json(
      { error: "Failed to generate titles" },
      { status: 500 }
    );
  }
}
