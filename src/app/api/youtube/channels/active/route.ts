import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getUserIdWithDevBypass } from "@/lib/dev-auth-bypass";
import { setActiveYoutubeChannelForUser } from "@/lib/youtube";

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  const userId = await getUserIdWithDevBypass(session?.user?.id);

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as { channelId?: string };
  const channelId = (body.channelId ?? "").trim();

  if (!channelId) {
    return NextResponse.json({ error: "channelId is required." }, { status: 400 });
  }

  const result = await setActiveYoutubeChannelForUser(userId, channelId);

  if (result.status === "missing-channel") {
    return NextResponse.json({ error: "Channel not found for this user." }, { status: 404 });
  }

  return NextResponse.json({ ok: true, profile: result.profile });
}
