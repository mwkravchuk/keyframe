-- Add YouTube profile metadata to support creator avatar/banner sync.
ALTER TABLE "User"
ADD COLUMN "youtubeChannelId" TEXT,
ADD COLUMN "youtubeChannelTitle" TEXT,
ADD COLUMN "youtubeAvatarUrl" TEXT,
ADD COLUMN "youtubeBannerUrl" TEXT,
ADD COLUMN "youtubeLinkedAt" TIMESTAMP(3);
