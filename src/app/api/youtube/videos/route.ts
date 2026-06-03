import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getUserIdWithDevBypass } from "@/lib/dev-auth-bypass";
import { listRecentYoutubeVideosForUser } from "@/lib/youtube";

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  const userId = await getUserIdWithDevBypass(session?.user?.id);

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const channelId = searchParams.get("channelId");
  const pageToken = searchParams.get("pageToken");
  const parsedLimit = Number(searchParams.get("limit") ?? "12");
  const limit = Number.isFinite(parsedLimit) ? parsedLimit : 12;

  const result = await listRecentYoutubeVideosForUser(userId, {
    channelId,
    limit,
    pageToken,
  });

  if (result.status === "ok") {
    return NextResponse.json({ videos: result.videos, nextPageToken: result.nextPageToken });
  }

  if (result.status === "missing-google-account") {
    return NextResponse.json(
      { error: "Google account is not connected." },
      { status: 400 },
    );
  }

  if (result.status === "missing-refresh-token") {
    return NextResponse.json(
      {
        error:
          "Missing refresh token. Sign out and sign in again to reconnect Google.",
      },
      { status: 400 },
    );
  }

  return NextResponse.json(
    {
      error: result.message,
      code: result.code,
    },
    { status: result.code >= 400 && result.code < 600 ? result.code : 502 },
  );
}
