import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getUserIdWithDevBypass } from "@/lib/dev-auth-bypass";
import { getFollowUpQuestion, pickFollowUpFields } from "@/lib/video-brief";
import { parseVideoBriefFromIdea } from "@/lib/ai";

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  const userId = await getUserIdWithDevBypass(session?.user?.id);

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as { idea?: string };
  const idea = (body.idea ?? "").trim();

  if (!idea) {
    return NextResponse.json({ error: "Idea is required" }, { status: 400 });
  }

  try {
    const brief = await parseVideoBriefFromIdea(idea);
    const followUpFields = pickFollowUpFields(brief, 2);

    return NextResponse.json({
      brief,
      followUpFields,
      followUpQuestions: followUpFields.map((field) => ({
        field,
        question: getFollowUpQuestion(field),
      })),
    });
  } catch (error) {
    console.error("Brief parse error:", error);
    return NextResponse.json({ error: "Failed to parse idea" }, { status: 500 });
  }
}
