-- AlterTable
ALTER TABLE "Post" ADD COLUMN     "editedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Reply" ADD COLUMN     "editedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "ProfileComment" ADD COLUMN     "editedAt" TIMESTAMP(3);
