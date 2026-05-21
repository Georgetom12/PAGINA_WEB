import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema";

const { Pool } = pg;

const dbUrl = process.env.PSY_DATABASE_URL || process.env.DATABASE_URL;

if (!dbUrl) {
  console.warn("[db] WARNING: DATABASE_URL not set — DB operations will fail at runtime but server will start");
}

export const pool = new Pool({ connectionString: dbUrl ?? "" });
export const db = drizzle(pool, { schema });

export * from "./schema";
