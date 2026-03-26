// @ts-nocheck
import { spawn } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

const cwd = process.cwd();

function stripWrappingQuotes(value) {
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    return value.slice(1, -1);
  }

  return value;
}

function parseEnvFile(filePath) {
  if (!existsSync(filePath)) {
    return {};
  }

  const content = readFileSync(filePath, "utf8");
  const values = {};

  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;

    const normalizedLine = line.startsWith("export ")
      ? line.slice("export ".length)
      : line;
    const separatorIndex = normalizedLine.indexOf("=");
    if (separatorIndex <= 0) continue;

    const key = normalizedLine.slice(0, separatorIndex).trim();
    const rawValue = normalizedLine.slice(separatorIndex + 1).trim();
    if (!key) continue;

    const value = stripWrappingQuotes(rawValue).replace(/\\n/g, "\n");
    values[key] = value;
  }

  return values;
}

const mergedEnv = {
  ...process.env,
  ...parseEnvFile(path.join(cwd, ".env")),
  ...parseEnvFile(path.join(cwd, ".env.local")),
};

if (!mergedEnv.DATABASE_URL) {
  console.error(
    "DATABASE_URL is missing. Set it in .env or override it in .env.local.",
  );
  process.exit(1);
}

const prismaCliEntrypoint = path.join(cwd, "node_modules", "prisma", "build", "index.js");
const prismaArgs = process.argv.slice(2);

if (prismaArgs.length === 0) {
  console.error(
    "Usage: node scripts/prisma-with-env.mjs <prisma args...>\nExample: npm run prisma:local:db:push",
  );
  process.exit(1);
}

const child = spawn(process.execPath, [prismaCliEntrypoint, ...prismaArgs], {
  cwd,
  env: mergedEnv,
  stdio: "inherit",
});

child.on("exit", (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }

  process.exit(code ?? 1);
});
