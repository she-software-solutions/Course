import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    // Fallback lets `prisma generate` (postinstall) run before .env exists;
    // migrate/seed still need a real DATABASE_URL.
    url: process.env.DATABASE_URL ?? "postgresql://localhost:5432/placeholder",
  },
});
