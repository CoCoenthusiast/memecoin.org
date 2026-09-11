import "dotenv/config";
import { PrismaClient } from "../src/generated/db/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { cleanupUnverifiedUsers } from "../src/lib/cleanup";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const UNVERIFIED_MAX_AGE_MS = 24 * 60 * 60 * 1000; // 24 hours

async function main() {
  const count = await cleanupUnverifiedUsers(prisma, UNVERIFIED_MAX_AGE_MS);
  console.log(`Deleted ${count} unverified user(s) older than 24 hours.`);
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
