import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getUserIdWithDevBypass } from "@/lib/dev-auth-bypass";
import { prisma } from "@/lib/prisma";
import { syncYoutubeProfileForUser } from "@/lib/youtube";

const LINK_TARGET_COOKIE = "kf_youtube_link_target_user_id";

function getSessionToken(request: Request) {
  const cookieHeader = request.headers.get("cookie") || "";
  const cookies = cookieHeader.split(";").map((part) => part.trim());

  for (const name of ["__Secure-next-auth.session-token", "next-auth.session-token"]) {
    const cookie = cookies.find((part) => part.startsWith(`${name}=`));
    if (cookie) {
      return decodeURIComponent(cookie.slice(name.length + 1));
    }
  }

  return null;
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  const sourceUserId = await getUserIdWithDevBypass(session?.user?.id);

  if (!sourceUserId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const linkTargetUserId = request.headers
    .get("cookie")
    ?.split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${LINK_TARGET_COOKIE}=`))
    ?.split("=")?.[1];

  if (!linkTargetUserId) {
    return NextResponse.json({ merged: false, reason: "no-link-context" });
  }

  const targetUserId = decodeURIComponent(linkTargetUserId);

  const response = NextResponse.json({ merged: false, reason: "noop" });
  response.cookies.set({
    name: LINK_TARGET_COOKIE,
    value: "",
    path: "/",
    maxAge: 0,
  });

  if (targetUserId === sourceUserId) {
    const syncResult = await syncYoutubeProfileForUser(sourceUserId);
    if (syncResult.status !== "ok") {
      const failed = NextResponse.json({ merged: false, reason: "sync-failed", syncResult });
      failed.cookies.set({
        name: LINK_TARGET_COOKIE,
        value: "",
        path: "/",
        maxAge: 0,
      });
      return failed;
    }
    const sameUser = NextResponse.json({ merged: false, reason: "noop", synced: true });
    sameUser.cookies.set({
      name: LINK_TARGET_COOKIE,
      value: "",
      path: "/",
      maxAge: 0,
    });
    return sameUser;
  }

  const [sourceUser, targetUser] = await Promise.all([
    prisma.user.findUnique({ where: { id: sourceUserId }, select: { id: true, email: true } }),
    prisma.user.findUnique({ where: { id: targetUserId }, select: { id: true } }),
  ]);

  if (!sourceUser || !targetUser) {
    return response;
  }

  const [sourceAccounts, targetAccounts, sourceChannels] = await Promise.all([
    prisma.account.findMany({ where: { userId: sourceUserId } }),
    prisma.account.findMany({ where: { userId: targetUserId } }),
    prisma.youtubeChannel.findMany({ where: { userId: sourceUserId } }),
  ]);

  const targetAccountKeys = new Set(
    targetAccounts.map((account) => `${account.provider}:${account.providerAccountId}`),
  );

  await prisma.$transaction(async (tx) => {
    for (const account of sourceAccounts) {
      const key = `${account.provider}:${account.providerAccountId}`;
      if (targetAccountKeys.has(key)) {
        await tx.account.delete({ where: { id: account.id } });
      } else {
        await tx.account.update({ where: { id: account.id }, data: { userId: targetUserId } });
      }
    }

    for (const channel of sourceChannels) {
      await tx.youtubeChannel.upsert({
        where: {
          userId_channelId: {
            userId: targetUserId,
            channelId: channel.channelId,
          },
        },
        create: {
          userId: targetUserId,
          channelId: channel.channelId,
          title: channel.title,
          avatarUrl: channel.avatarUrl,
          bannerUrl: channel.bannerUrl,
          isActive: channel.isActive,
          lastSyncedAt: channel.lastSyncedAt,
        },
        update: {
          title: channel.title,
          avatarUrl: channel.avatarUrl,
          bannerUrl: channel.bannerUrl,
          isActive: channel.isActive,
          lastSyncedAt: channel.lastSyncedAt,
        },
      });
    }

    await tx.youtubeChannel.deleteMany({ where: { userId: sourceUserId } });

    const activeChannel = await tx.youtubeChannel.findFirst({
      where: { userId: targetUserId, isActive: true },
      select: {
        channelId: true,
        title: true,
        avatarUrl: true,
        bannerUrl: true,
      },
      orderBy: [{ updatedAt: "desc" }],
    });

    if (activeChannel) {
      await tx.user.update({
        where: { id: targetUserId },
        data: {
          youtubeChannelId: activeChannel.channelId,
          youtubeChannelTitle: activeChannel.title,
          youtubeAvatarUrl: activeChannel.avatarUrl,
          youtubeBannerUrl: activeChannel.bannerUrl,
          youtubeLinkedAt: new Date(),
        },
      });
    }

    const token = getSessionToken(request);
    if (token) {
      await tx.session.updateMany({
        where: { sessionToken: token },
        data: { userId: targetUserId },
      });
    }

    await tx.session.deleteMany({ where: { userId: sourceUserId } });

    if (sourceUser.email?.endsWith("@pages.plusgoogle.com")) {
      const projectCount = await tx.videoProject.count({ where: { userId: sourceUserId } });
      const accountCount = await tx.account.count({ where: { userId: sourceUserId } });
      const channelCount = await tx.youtubeChannel.count({ where: { userId: sourceUserId } });

      if (projectCount === 0 && accountCount === 0 && channelCount === 0) {
        await tx.user.delete({ where: { id: sourceUserId } });
      }
    }
  });

  const syncResult = await syncYoutubeProfileForUser(targetUserId);

  if (syncResult.status !== "ok") {
    const failed = NextResponse.json({ merged: true, targetUserId, syncFailed: true, syncResult });
    failed.cookies.set({
      name: LINK_TARGET_COOKIE,
      value: "",
      path: "/",
      maxAge: 0,
    });
    return failed;
  }

  const mergedResponse = NextResponse.json({ merged: true, targetUserId, synced: true });
  mergedResponse.cookies.set({
    name: LINK_TARGET_COOKIE,
    value: "",
    path: "/",
    maxAge: 0,
  });

  return mergedResponse;
}
