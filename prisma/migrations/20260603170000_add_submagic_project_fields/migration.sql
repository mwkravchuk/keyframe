ALTER TABLE "VideoProject"
ADD COLUMN "submagicProjectId" TEXT,
ADD COLUMN "submagicStatus" TEXT,
ADD COLUMN "submagicData" TEXT,
ADD COLUMN "submagicSyncedAt" TIMESTAMP(3);

CREATE INDEX "VideoProject_userId_submagicProjectId_idx"
ON "VideoProject"("userId", "submagicProjectId");
