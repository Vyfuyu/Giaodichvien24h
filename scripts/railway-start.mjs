import { execSync } from "child_process";
import crypto from "crypto";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");

async function runMigrations() {
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
}

async function seedAdmin() {
  console.log("[Railway] Checking admin user...");

  const { default: pg } = await import("pg");
  const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

  try {
    const result = await pool.query(
      "SELECT id FROM users WHERE email = $1",
      ["admin@giaodichvien24h.vn"]
    );

    if (result.rows.length === 0) {
      const salt = crypto.randomBytes(16).toString("hex");
      const hash = crypto.scryptSync("admin@2008", salt, 64).toString("hex");
      const passwordHash = `${salt}:${hash}`;

      await pool.query(
        `INSERT INTO users (uid, name, email, phone, password_hash, role, status, badge)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        ["#000000", "Admin", "admin@giaodichvien24h.vn", "0000000000", passwordHash, "ADMIN", "NORMAL", "NONE"]
      );
      console.log("[Railway] Admin user created: admin@giaodichvien24h.vn");
    } else {
      console.log("[Railway] Admin user already exists.");
    }
  } catch (err) {
    console.error("[Railway] Failed to seed admin:", err.message);
  } finally {
    await pool.end();
  }
}

async function startServer() {
  console.log("[Railway] Starting API server...");
  const serverPath = path.resolve(repoRoot, "artifacts/api-server/dist/index.mjs");
  await import(serverPath);
}

await runMigrations();
await seedAdmin();
await startServer();
