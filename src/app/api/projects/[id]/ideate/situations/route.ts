import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getUserIdWithDevBypass } from "@/lib/dev-auth-bypass";
import { prisma } from "@/lib/prisma";
import { generateSituationPrompts } from "@/lib/ai";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    const userId = await getUserIdWithDevBypass(session?.user?.id);

    if (!userId) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const project = await prisma.videoProject.findFirst({
      where: { id, userId },
      select: {
        id: true,
        concept: true,
        title: true,
        shortlistedHooks: true,
      },
    });

    if (!project) {
      return Response.json({ error: "Project not found" }, { status: 404 });
    }

    const concept = project.concept?.trim() ?? "";
    if (!concept) {
      return Response.json(
        { error: "Concept is required before generating situations." },
        { status: 400 }
      );
    }

    let savedHooks: string[] = [];
    if (project.shortlistedHooks) {
      try {
        const parsed = JSON.parse(project.shortlistedHooks);
        if (Array.isArray(parsed)) {
          savedHooks = parsed.filter((item) => typeof item === "string");
        }
      } catch {
        savedHooks = [];
      }
    }

    const situations = await generateSituationPrompts({
      concept,
      title: project.title,
      savedHooks,
    });

    return Response.json({ situations });
  } catch (error) {
    console.error("Situation generation error:", error);
    return Response.json(
      { error: "Failed to generate situations" },
      { status: 500 }
    );
  }
}
