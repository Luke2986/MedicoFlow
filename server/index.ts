import { startServer } from "./server";
import { serveStatic } from "./static";

startServer((app) => serveStatic(app));
