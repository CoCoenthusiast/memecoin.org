-- CreateTable
CREATE TABLE "DailyRecap" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "imageUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DailyRecap_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DailyRecap_createdAt_idx" ON "DailyRecap"("createdAt");
