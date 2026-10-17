import "dotenv/config";
import { seedSpecializations } from "../server/seed";
import { closeDb } from "../server/db";

await seedSpecializations();
await closeDb();
