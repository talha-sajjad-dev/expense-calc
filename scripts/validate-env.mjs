import { readFileSync } from "fs";

function loadEnv() {
  const vars = {};
  for (const line of readFileSync(".env", "utf8").split("\n")) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const i = t.indexOf("=");
    vars[t.slice(0, i).trim()] = t.slice(i + 1).trim();
  }
  return vars;
}

function refFromUrl(url) {
  const m = url.match(/https:\/\/([^.]+)\.supabase\.co/);
  return m?.[1] ?? null;
}

function refFromJwt(token) {
  try {
    const payload = JSON.parse(
      Buffer.from(token.split(".")[1], "base64url").toString("utf8")
    );
    return payload.ref ?? null;
  } catch {
    return null;
  }
}

function refFromDbUrl(url) {
  return (
    url.match(/@db\.([^./]+)\.supabase\.co/)?.[1] ??
    url.match(/postgres\.([^:@/]+)/)?.[1] ??
    null
  );
}

const vars = loadEnv();
const urlRef = refFromUrl(vars.NEXT_PUBLIC_SUPABASE_URL ?? "");
const keyRef = refFromJwt(vars.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "");
const dbRef = refFromDbUrl(vars.SUPABASE_DB_URL ?? "");

console.log("Project ref in API URL:     ", urlRef ?? "(missing/invalid)");
console.log("Project ref in anon JWT:    ", keyRef ?? "(missing/invalid)");
console.log("Project ref in DB URL:      ", dbRef ?? "(missing)");

const refs = [urlRef, keyRef, dbRef].filter(Boolean);
const unique = [...new Set(refs)];

if (unique.length === 1) {
  console.log("\n✓ All env vars point to the same project:", unique[0]);
  process.exit(0);
}

console.log("\n✗ MISMATCH — these must all be the same Supabase project.");
console.log(
  "  Dashboard → Project Settings → API: copy URL + anon key together."
);
console.log(
  "  Dashboard → Project Settings → Database: copy connection string for SUPABASE_DB_URL."
);
process.exit(1);
