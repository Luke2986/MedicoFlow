import "dotenv/config";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { db, pool } from "../server/db";

await migrate(db, { migrationsFolder: "./migrations" });
console.log("Migrazioni applicate");
await pool.end();
