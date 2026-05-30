import { readFileSync } from "fs";
import { createClient } from "@supabase/supabase-js";

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

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!url || !key) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or Supabase key in .env");
  process.exit(1);
}

const supabase = createClient(url, key);
const tables = ["profiles", "groups", "group_members", "expenses", "expense_participants"];

async function main() {
  console.log("Supabase URL:", url.replace(/https:\/\/([^.]+).*/, "https://$1..."));

  const { error: authError } = await supabase.auth.getSession();
  if (authError) {
    console.warn("Auth check:", authError.message);
  } else {
    console.log("API connection: OK");
  }

  const dbUrl = process.env.SUPABASE_DB_URL || process.env.DATABASE_URL;
  let schemaOk = false;
  if (dbUrl) {
    const { spawnSync } = await import("child_process");
    const sql = `SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name IN ('${tables.join("','")}') ORDER BY 1;`;
    const result = spawnSync("psql", [dbUrl, "-t", "-A", "-c", sql], {
      encoding: "utf8",
    });
    if (result.status === 0) {
      const found = result.stdout.trim().split("\n").filter(Boolean);
      console.log("\nSchema check (database):");
      let allOk = true;
      for (const table of tables) {
        if (found.includes(table)) {
          console.log(`  ✓ ${table}`);
        } else {
          allOk = false;
          console.log(`  ✗ ${table} — missing`);
        }
      }
      if (!allOk) {
        console.log("\nRun: npm run db:migrate");
        process.exit(2);
      }
      schemaOk = true;
    }
  } else {
    const results = {};
    for (const table of tables) {
      const { error } = await supabase
        .from(table)
        .select("id", { count: "exact", head: true });
      results[table] = error
        ? { ok: false, message: error.message }
        : { ok: true };
    }
    console.log("\nSchema check (API):");
    for (const [table, r] of Object.entries(results)) {
      console.log(r.ok ? `  ✓ ${table}` : `  ✗ ${table} — ${r.message}`);
    }
  }

  const { error: keyError } = await supabase.from("profiles").select("id").limit(1);
  if (keyError?.message?.includes("Invalid API key")) {
    console.warn(
      "\n⚠ NEXT_PUBLIC_SUPABASE_ANON_KEY is invalid for this project."
    );
    console.warn(
      "  Update it from Supabase → Project Settings → API → anon public key."
    );
    if (schemaOk) {
      console.log("\nDatabase migrations are OK. Fix the anon key before using the app.");
    }
    process.exit(1);
  }

  const { data: rpc, error: rpcError } = await supabase.rpc("join_group_by_invite", {
    p_invite_code: "TEST",
  });
  void rpc;
  if (rpcError?.message?.includes("Not authenticated") || rpcError?.code === "PGRST202") {
    if (rpcError.code === "PGRST202") {
      console.log("\n⚠ join_group_by_invite RPC not found — run migrations.");
      process.exit(2);
    }
    console.log("\n✓ RPC join_group_by_invite exists");
  } else if (!rpcError) {
    console.log("\n✓ RPC join_group_by_invite exists");
  }

  console.log("\nDatabase schema looks ready.");
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
