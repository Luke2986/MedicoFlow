import "dotenv/config";
import { seedSpecializations, seedDatabase } from "../server/seed";
import { pool } from "../server/db";

await seedSpecializations();
await seedDatabase();
await pool.end();
