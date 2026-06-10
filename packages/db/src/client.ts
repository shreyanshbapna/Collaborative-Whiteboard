import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

console.log("DB URL:", process.env.DATABASE_URL);

const connectionString = `${process.env.DATABASE_URL}`;

const adapter = new PrismaPg({ connectionString });
const prismaClient = new PrismaClient({ adapter });

export { prismaClient };

