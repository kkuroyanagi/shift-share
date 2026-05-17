import type { Config } from "drizzle-kit";

// drizzle-kit は Next.js と独立したCLIなので .env.local を自動で読まない
try { process.loadEnvFile(".env.local"); } catch {}

export default {
  schema: "./lib/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
} satisfies Config;
