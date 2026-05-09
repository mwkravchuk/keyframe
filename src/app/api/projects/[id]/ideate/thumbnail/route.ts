import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getUserIdWithDevBypass } from "@/lib/dev-auth-bypass";
import { prisma } from "@/lib/prisma";
import { generateThumbnailDirection } from "@/lib/ai";

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
    const { concept, title, angle } = body;

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

    // Generate thumbnail direction
    const thumbnails = await generateThumbnailDirection({
      concept,
      title,
      angle,
    });

    // Store proposed thumbnail direction in database
    await prisma.videoProject.update({
      where: { id },
      data: {
        proposedThumbnailDirection: JSON.stringify(thumbnails),
      },
    });

    return Response.json({ thumbnails });
  } catch (error) {
    console.error("Thumbnail direction generation error:", error);
    return Response.json(
      { error: "Failed to generate thumbnail direction" },
      { status: 500 }
    );
  }
}
