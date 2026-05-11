-- Remove selected hook persistence from project model.
ALTER TABLE "VideoProject" DROP COLUMN IF EXISTS "hook";
