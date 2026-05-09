-- Drop viewer promise fields now that the feature has been removed
ALTER TABLE "VideoProject"
  DROP COLUMN IF EXISTS "proposedViewerPromise",
  DROP COLUMN IF EXISTS "shortlistedViewerPromise",
  DROP COLUMN IF EXISTS "selectedViewerPromise";
