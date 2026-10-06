export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}

// console.error(zodError) crashes Node 24's inspector, so errors are formatted to plain strings first.
export function logError(context: string, error: unknown) {
  let detail: string;
  if (error && typeof error === "object" && "issues" in error) {
    detail = `ValidationError ${JSON.stringify((error as { issues: unknown }).issues)}`;
  } else if (error instanceof Error) {
    detail = error.stack ?? error.message;
  } else {
    detail = String(error);
  }
  console.error(`${context} ${detail}`);
}
