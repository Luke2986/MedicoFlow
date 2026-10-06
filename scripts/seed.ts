import "dotenv/config";
import { seedSpecializations } from "../server/seed";
import { pool } from "../server/db";

await seedSpecializations();
await pool.end();
