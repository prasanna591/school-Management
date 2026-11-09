import type { Config } from "drizzle-kit";

export default {
  outDir: "./drizzle",
  schema: "./src/db/schema.ts",
  dialect: "postgresql",
  dbCredentials: {
    connectionString: "${DATABASE_URL}",
  },
  verbose: true,
  strict: true,
} satisfies Config;
