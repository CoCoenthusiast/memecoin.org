-- CreateIndex
CREATE INDEX "Notification_userId_read_idx" ON "Notification"("userId", "read");

-- CreateIndex
CREATE INDEX "Post_lastActivityAt_idx" ON "Post"("lastActivityAt");

-- CreateIndex
CREATE INDEX "Post_channelId_lastActivityAt_idx" ON "Post"("channelId", "lastActivityAt");

-- CreateIndex
CREATE INDEX "Reply_postId_createdAt_idx" ON "Reply"("postId", "createdAt");

-- CreateIndex
CREATE INDEX "Reply_authorId_idx" ON "Reply"("authorId");

-- CreateIndex
CREATE INDEX "Report_status_idx" ON "Report"("status");
