import "dotenv/config";
import { PrismaClient } from "../src/generated/db/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";
import crypto from "crypto";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const USERNAMES = ["alice", "bob", "charlie", "diana"] as const;

async function main() {
  const results: { username: string; email: string; password: string }[] = [];

  for (const username of USERNAMES) {
    const user = await prisma.user.findUnique({ where: { username } });
    if (!user) {
      console.warn(`WARNING: user "${username}" not found, skipping.`);
      continue;
    }
    const plain = crypto.randomBytes(16).toString("hex");
    const hash = await bcrypt.hash(plain, 10);
    await prisma.user.update({ where: { id: user.id }, data: { password: hash } });
    results.push({ username, email: user.email, password: plain });
  }

  console.log("\n--- SENHAS ATUALIZADAS ---");
  for (const r of results) {
    console.log(`${r.email} : ${r.password}`);
  }
  console.log("--------------------------\n");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
