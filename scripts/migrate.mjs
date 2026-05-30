import { readFileSync, readdirSync, existsSync, writeFileSync } from "fs";
import { join } from "path";
import { spawnSync } from "child_process";

function loadEnv() {
  try {
    const raw = readFileSync(".env", "utf8");
    for (const line of raw.split("\n")) {
      const t = line.trim();
      if (!t || t.startsWith("#")) continue;
      const i = t.indexOf("=");
      if (i === -1) continue;
      const key = t.slice(0, i).trim();
      let val = t.slice(i + 1).trim();
      if (
        (val.startsWith('"') && val.endsWith('"')) ||
        (val.startsWith("'") && val.endsWith("'"))
      ) {
        val = val.slice(1, -1);
      }
      if (!process.env[key]) process.env[key] = val;
    }
  } catch {
    /* no .env */
  }
}

loadEnv();

const dbUrl = process.env.SUPABASE_DB_URL || process.env.DATABASE_URL;

if (!dbUrl) {
  console.error("Missing SUPABASE_DB_URL in .env");
  process.exit(1);
}

const migrationsDir = join(process.cwd(), "supabase", "migrations");
const stateFile = join(process.cwd(), "supabase", ".migrations_applied.json");

let applied = [];
if (existsSync(stateFile)) {
  applied = JSON.parse(readFileSync(stateFile, "utf8"));
}
const appliedSet = new Set(applied);

const files = readdirSync(migrationsDir)
  .filter((f) => f.endsWith(".sql"))
  .sort();

const pending = files.filter((f) => !appliedSet.has(f));

if (pending.length === 0) {
  console.log("✓ All migrations already applied.");
  process.exit(0);
}

console.log(`Applying ${pending.length} pending migration(s)...\n`);

for (const file of pending) {
  const path = join(migrationsDir, file);
  console.log(`→ ${file}`);

  const result = spawnSync(
    "psql",
    [dbUrl, "-v", "ON_ERROR_STOP=1", "-f", path],
    { stdio: "inherit", env: process.env }
  );

  if (result.error?.code === "ENOENT") {
    console.error("'psql' not found. Run migrations in Supabase SQL Editor.");
    process.exit(1);
  }

  if (result.status !== 0) {
    console.error(`\nFailed on ${file}`);
    process.exit(result.status ?? 1);
  }

  appliedSet.add(file);
  writeFileSync(stateFile, JSON.stringify([...appliedSet].sort(), null, 2) + "\n");
}

console.log("\n✓ All pending migrations applied.");
