
const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");

const globalForPrisma = global;
const adapter = globalForPrisma.prismaPgAdapter || new PrismaPg(process.env.DATABASE_URL);

const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
  globalForPrisma.prismaPgAdapter = adapter;
}

module.exports = { prisma };
