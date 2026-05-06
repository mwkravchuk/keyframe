-- Support multiple YouTube channels per app user.
CREATE TABLE "YoutubeChannel" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "channelId" TEXT NOT NULL,
  "title" TEXT,
  "avatarUrl" TEXT,
  "bannerUrl" TEXT,
  "isActive" BOOLEAN NOT NULL DEFAULT false,
  "lastSyncedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "YoutubeChannel_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "YoutubeChannel_userId_channelId_key" ON "YoutubeChannel"("userId", "channelId");
CREATE INDEX "YoutubeChannel_userId_isActive_idx" ON "YoutubeChannel"("userId", "isActive");

ALTER TABLE "YoutubeChannel"
ADD CONSTRAINT "YoutubeChannel_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
