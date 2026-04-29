-- CreateEnum
CREATE TYPE "VideoProjectStage" AS ENUM ('IDEA', 'DRAFTING', 'RECORDING', 'EDITING', 'PUBLISHED', 'REVIEW');

-- CreateTable
CREATE TABLE "VideoProject" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "concept" TEXT,
    "notes" TEXT,
    "stage" "VideoProjectStage" NOT NULL DEFAULT 'IDEA',
    "nextStep" TEXT,
    "targetPublishAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VideoProject_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "VideoProject_userId_stage_idx" ON "VideoProject"("userId", "stage");

-- AddForeignKey
ALTER TABLE "VideoProject" ADD CONSTRAINT "VideoProject_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
