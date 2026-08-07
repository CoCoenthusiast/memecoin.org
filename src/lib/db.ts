import path from "path";
import { PrismaClient } from "@/generated/db/client";

process.env.DATABASE_URL = `file:${path.resolve(process.cwd(), "prisma/dev.db")}`;

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
