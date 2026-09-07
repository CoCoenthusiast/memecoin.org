-- AlterTable
ALTER TABLE "Reaction" ADD COLUMN "profileCommentId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Reaction_userId_profileCommentId_key" ON "Reaction"("userId", "profileCommentId");

-- AddForeignKey
ALTER TABLE "Reaction" ADD CONSTRAINT "Reaction_profileCommentId_fkey" FOREIGN KEY ("profileCommentId") REFERENCES "ProfileComment"("id") ON DELETE SET NULL ON UPDATE CASCADE;
