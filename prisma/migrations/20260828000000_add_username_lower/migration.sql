-- Step 1: add the column as nullable so existing rows can be backfilled first
ALTER TABLE "User" ADD COLUMN "usernameLower" TEXT;

-- Step 2: backfill existing rows from the original username
UPDATE "User" SET "usernameLower" = LOWER("username");

-- Step 3: enforce NOT NULL and uniqueness
ALTER TABLE "User" ALTER COLUMN "usernameLower" SET NOT NULL;
CREATE UNIQUE INDEX "User_usernameLower_key" ON "User"("usernameLower");
