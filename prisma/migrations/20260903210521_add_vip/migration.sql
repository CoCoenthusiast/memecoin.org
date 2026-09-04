-- AlterTable
ALTER TABLE "User" ADD COLUMN     "isVip" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "vipExpiresAt" TIMESTAMP(3);
