import pg from "pg";
import { drizzle as drizzlePg, type NodePgDatabase } from "drizzle-orm/node-postgres";
import { drizzle as drizzlePglite } from "drizzle-orm/pglite";
import { PGlite } from "@electric-sql/pglite";
import * as schema from "../shared/schema";

/** Without DATABASE_URL the app runs on an in-memory PostgreSQL (PGlite): handy for demos, lost on restart. */
export const isInMemory = !process.env.DATABASE_URL;

function connectPostgres() {
  const pool = new pg.Pool({
    connectionString: process.env.DATABASE_URL,
    max: process.env.VERCEL ? 1 : 10,
  });
  // Idle connections can be dropped by the server or a pooler (e.g. Supabase); without a listener pg crashes the process.
  pool.on("error", (err) => {
    console.error("Errore connessione database inattiva:", err.message);
  });
  return { db: drizzlePg(pool, { schema }), close: () => pool.end() };
}

function connectInMemory() {
  const client = new PGlite();
  // Both drivers expose the same Drizzle query API; only the raw result type differs, and `.rows` exists on both.
  const db = drizzlePglite(client, { schema }) as unknown as NodePgDatabase<typeof schema>;
  return { db, close: () => client.close() };
}

const connection = isInMemory ? connectInMemory() : connectPostgres();

export const db = connection.db;
export const closeDb = connection.close;
