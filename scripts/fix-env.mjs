import { readFileSync, writeFileSync } from "fs";

const envPath = ".env";
const raw = readFileSync(envPath, "utf8");
const lines = raw.split("\n");
const vars = {};

for (const line of lines) {
  const t = line.trim();
  if (!t || t.startsWith("#")) continue;
  const i = t.indexOf("=");
  if (i === -1) continue;
  vars[t.slice(0, i).trim()] = t.slice(i + 1).trim();
}

const url = vars.NEXT_PUBLIC_SUPABASE_URL ?? "";
let changed = false;

if (url.startsWith("postgresql://") || url.startsWith("postgres://")) {
  if (!vars.SUPABASE_DB_URL) {
    vars.SUPABASE_DB_URL = url;
    changed = true;
    console.log("Moved Postgres URI → SUPABASE_DB_URL");
  }

  const refMatch =
    url.match(/postgres\.([^:@/]+)/) ||
    url.match(/@db\.([^.\/]+)\.supabase\.co/) ||
    url.match(/postgres:([^@]+)@db\.([^.\/]+)\.supabase/);

  const ref = refMatch?.[1] ?? refMatch?.[2];
  if (ref) {
    vars.NEXT_PUBLIC_SUPABASE_URL = `https://${ref}.supabase.co`;
    changed = true;
    console.log(`Set NEXT_PUBLIC_SUPABASE_URL → https://${ref}.supabase.co`);
  } else {
    console.error(
      "Could not detect project ref from Postgres URL. Set NEXT_PUBLIC_SUPABASE_URL manually to https://YOUR_REF.supabase.co"
    );
    process.exit(1);
  }
}

if (!changed) {
  console.log(".env looks OK (no auto-fix needed).");
  process.exit(0);
}

const order = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_DB_URL",
  "SUPABASE_SERVICE_ROLE_KEY",
];
const written = new Set();
const out = [];

for (const key of order) {
  if (vars[key]) {
    out.push(`${key}=${vars[key]}`);
    written.add(key);
  }
}
for (const [key, val] of Object.entries(vars)) {
  if (!written.has(key)) out.push(`${key}=${val}`);
}

writeFileSync(envPath, out.join("\n") + "\n");
console.log("Updated .env");
