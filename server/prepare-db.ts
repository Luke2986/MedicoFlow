import path from "path";
import { sql } from "drizzle-orm";
import { db, isInMemory } from "./db";
import { seedSpecializations } from "./seed";
import { seedDemo } from "./demo/seed";

const migrationsFolder = path.resolve(process.cwd(), "migrations");

export async function migrateDatabase() {
  if (isInMemory) {
    const { migrate } = await import("drizzle-orm/pglite/migrator");
    await migrate(db as any, { migrationsFolder });
  } else {
    const { migrate } = await import("drizzle-orm/node-postgres/migrator");
    await migrate(db, { migrationsFolder });
  }
}

/** Empties every application table (the migrations journal lives in its own schema and is kept). */
export async function truncateAllTables() {
  const { rows } = await db.execute<{ tablename: string }>(
    sql`SELECT tablename FROM pg_tables WHERE schemaname = 'public'`,
  );
  if (rows.length) {
    await db.execute(sql.raw(`TRUNCATE ${rows.map((r) => `"${r.tablename}"`).join(", ")} CASCADE`));
  }
}

export const demoDataEnabled = process.env.DEMO_DATA !== "false";

/** The in-memory database starts empty on every boot: build the schema and fill it. Real databases are left alone. */
export async function prepareDatabase() {
  if (!isInMemory) return;
  await migrateDatabase();
  await seedSpecializations();
  if (demoDataEnabled) await seedDemo();
}

export async function resetDemoDatabase(mode: "demo" | "empty") {
  await truncateAllTables();
  await seedSpecializations();
  if (mode === "demo") await seedDemo();
}
