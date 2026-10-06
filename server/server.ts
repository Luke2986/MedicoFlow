import "dotenv/config";
import { createServer, type Server } from "http";
import type { Express } from "express";
import { createApp } from "./app";
import { log } from "./log";

export async function startServer(attachFrontend: (app: Express, server: Server) => void | Promise<void>) {
  const app = await createApp();
  const server = createServer(app);

  // Frontend goes last so its catch-all route doesn't shadow the API.
  await attachFrontend(app, server);

  const port = parseInt(process.env.PORT || "5000", 10);
  server.listen({ port, host: "0.0.0.0" }, () => {
    log(`serving on port ${port}`);
  });
}
