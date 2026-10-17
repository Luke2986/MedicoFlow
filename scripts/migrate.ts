import "dotenv/config";
import { closeDb, isInMemory } from "../server/db";
import { migrateDatabase } from "../server/prepare-db";

if (isInMemory) {
  console.error("DATABASE_URL non impostata: senza database esterno l'app crea le tabelle da sola all'avvio.");
  process.exit(1);
}
await migrateDatabase();
console.log("Migrazioni applicate");
await closeDb();
