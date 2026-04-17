import { execSync, spawnSync } from "child_process";
import path from "path";
import { fileURLToPath } from "url";
import { existsSync } from "fs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function findDrizzleKit() {
  const candidates = [
    path.resolve(repoRoot, "lib/db/node_modules/.bin/drizzle-kit"),
    path.resolve(repoRoot, "node_modules/.bin/drizzle-kit"),
    path.resolve(repoRoot, "node_modules/.pnpm/node_modules/.bin/drizzle-kit"),
  ];
  for (const p of candidates) {
    if (existsSync(p)) return p;
  }
  return null;
}

async function runMigrations(retries = 3) {
  const drizzleKit = findDrizzleKit();
  const config = path.resolve(repoRoot, "lib/db/drizzle.config.ts");

  if (!drizzleKit) {
    console.warn("[Railway] drizzle-kit not found, skipping migrations.");
    return;
  }

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      console.log(`[Railway] Running migrations (attempt ${attempt}/${retries})...`);
      execSync(`"${drizzleKit}" push --force --config "${config}"`, {
        stdio: "inherit",
        cwd: repoRoot,
        env: { ...process.env },
      });
      console.log("[Railway] Migrations completed successfully.");
      return;
    } catch (err) {
      console.error(`[Railway] Migration attempt ${attempt} failed:`, err.message);
      if (attempt < retries) {
        console.log("[Railway] Retrying in 3 seconds...");
        await sleep(3000);
      }
    }
  }
  console.warn("[Railway] All migration attempts failed. Starting server anyway...");
}

await runMigrations();

console.log("[Railway] Starting API server...");
const serverPath = path.resolve(repoRoot, "artifacts/api-server/dist/index.mjs");
await import(serverPath);
