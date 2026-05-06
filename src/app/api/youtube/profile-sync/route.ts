import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getUserIdWithDevBypass } from "@/lib/dev-auth-bypass";
import { syncYoutubeProfileForUser } from "@/lib/youtube";

export async function POST() {
  const session = await getServerSession(authOptions);
  const userId = await getUserIdWithDevBypass(session?.user?.id);

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await syncYoutubeProfileForUser(userId);

  if (result.status === "ok") {
    return NextResponse.json({ ok: true, profile: result.profile });
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

  if (result.status === "google-oauth-not-configured") {
    return NextResponse.json(
      { error: "Google OAuth environment variables are not configured." },
      { status: 500 },
    );
  }

  if (result.status === "no-channel") {
    return NextResponse.json(
      {
        error:
          "No YouTube channel found for this Google account. Create a channel first, then sync again.",
      },
      { status: 404 },
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
