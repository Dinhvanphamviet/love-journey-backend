
import pkg from "@prisma/client";
import adapterPkg from "@prisma/adapter-pg";

const { PrismaClient } = pkg;
const { PrismaPg } = adapterPkg;

const globalForPrisma = globalThis;
const adapter = globalForPrisma.prismaPgAdapter ?? new PrismaPg(process.env.DATABASE_URL);

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
  globalForPrisma.prismaPgAdapter = adapter;
}
