-- Add pinned flag to posts (pinned posts appear at the top of channel listings)
ALTER TABLE "Post" ADD COLUMN "pinned" BOOLEAN NOT NULL DEFAULT false;
