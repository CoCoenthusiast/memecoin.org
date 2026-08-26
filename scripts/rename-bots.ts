import "dotenv/config";
import { PrismaClient } from "../src/generated/db/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const RENAMES: { username: string; newUsername: string }[] = [
  { username: "alice", newUsername: "0xluna" },
  { username: "bob", newUsername: "wagmi_bo" },
  { username: "charlie", newUsername: "chartchad" },
  { username: "diana", newUsername: "rugsurvivor_d" },
];

async function main() {
  for (const { username, newUsername } of RENAMES) {
    const user = await prisma.user.findUnique({ where: { username } });
    if (!user) {
      console.warn(`WARNING: "${username}" not found, skipping.`);
      continue;
    }
    await prisma.user.update({ where: { id: user.id }, data: { username: newUsername } });
    console.log(`${username} → ${newUsername}`);
  }
  console.log("Done.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
