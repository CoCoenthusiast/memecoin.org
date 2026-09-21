-- CreateTable
CREATE TABLE "PostView" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,
    "postId" TEXT NOT NULL,

    CONSTRAINT "PostView_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PostView_postId_idx" ON "PostView"("postId");

-- CreateIndex
CREATE UNIQUE INDEX "PostView_userId_postId_key" ON "PostView"("userId", "postId");

-- AddForeignKey
ALTER TABLE "PostView" ADD CONSTRAINT "PostView_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PostView" ADD CONSTRAINT "PostView_postId_fkey" FOREIGN KEY ("postId") REFERENCES "Post"("id") ON DELETE CASCADE ON UPDATE CASCADE;
