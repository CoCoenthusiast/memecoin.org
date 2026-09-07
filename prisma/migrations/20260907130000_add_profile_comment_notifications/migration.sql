-- AlterTable: Make postId nullable and add profileCommentId
ALTER TABLE "Notification" ALTER COLUMN "postId" DROP NOT NULL;
ALTER TABLE "Notification" ADD COLUMN "profileCommentId" TEXT;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_profileCommentId_fkey" FOREIGN KEY ("profileCommentId") REFERENCES "ProfileComment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateIndex
CREATE INDEX "Notification_profileCommentId_idx" ON "Notification"("profileCommentId");
