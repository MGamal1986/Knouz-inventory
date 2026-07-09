import { PrismaClient } from "@prisma/client";

// Singleton pattern so we don't exhaust DB connections with hot-reload in dev
export const prisma = new PrismaClient();
