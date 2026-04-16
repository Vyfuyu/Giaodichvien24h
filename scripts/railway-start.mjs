import { execSync } from "child_process";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");

console.log("[Railway] Running database migrations...");
try {
  execSync("pnpm --filter @workspace/db run push-force", {
    stdio: "inherit",
    cwd: repoRoot,
  });
  console.log("[Railway] Migrations completed.");
} catch (err) {
  console.error("[Railway] Migration failed:", err.message);
  process.exit(1);
}

console.log("[Railway] Starting API server...");
const serverPath = path.resolve(repoRoot, "artifacts/api-server/dist/index.mjs");
await import(serverPath);
