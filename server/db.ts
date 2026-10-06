import pg from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "../shared/schema";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL non impostata. Copia .env.example in .env e configura il database.");
}

export const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  max: process.env.VERCEL ? 1 : 10,
});
// Idle connections can be dropped by the server or a pooler (e.g. Supabase); without a listener pg crashes the process.
pool.on("error", (err) => {
  console.error("Errore connessione database inattiva:", err.message);
});

export const db = drizzle(pool, { schema });
