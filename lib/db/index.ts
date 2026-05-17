import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const connectionString = process.env.DATABASE_URL!;

// HMR 時に接続を使い回す
const globalForDb = globalThis as unknown as { sql: ReturnType<typeof postgres> };
const sql = globalForDb.sql ?? postgres(connectionString);
if (process.env.NODE_ENV !== "production") globalForDb.sql = sql;

export const db = drizzle(sql, { schema });
