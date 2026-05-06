import { prisma } from "@/lib/prisma";

const DEV_BYPASS_EMAIL = "dev-bypass@keyframe.local";

export function isDevAuthBypassEnabled() {
  return process.env.NODE_ENV === "development" || process.env.KEYFRAME_DEV_BYPASS_AUTH === "true";
}

export async function getUserIdWithDevBypass(sessionUserId?: string | null) {
  if (sessionUserId) {
    return sessionUserId;
  }

  if (!isDevAuthBypassEnabled()) {
    return null;
  }

  const user = await prisma.user.upsert({
    where: { email: DEV_BYPASS_EMAIL },
    update: {
      name: "Dev Creator",
    },
    create: {
      email: DEV_BYPASS_EMAIL,
      name: "Dev Creator",
    },
    select: { id: true },
  });

  return user.id;
}