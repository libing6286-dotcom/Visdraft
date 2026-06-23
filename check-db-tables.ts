// Quick script to check if tables exist in the database
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing environment variables");
  process.exit(1);
}

const client = createClient(supabaseUrl, supabaseKey);

async function checkTables() {
  try {
    console.log("Checking database tables...\n");

    // Query the information schema to list all tables
    const { data, error } = await client
      .from("information_schema.tables")
      .select("table_name, table_schema")
      .eq("table_schema", "public")
      .order("table_name");

    if (error) {
      console.error("Error querying tables:", error);
      return;
    }

    if (!data || data.length === 0) {
      console.log("❌ No tables found in public schema!");
      console.log("\nAttempting direct SQL query...");

      // Try direct query
      const { data: sqlData, error: sqlError } = await client.rpc(
        "raw_sql",
        {
          sql: "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'",
        },
      );

      if (!sqlError && sqlData) {
        console.log("Tables from direct query:", sqlData);
      } else {
        console.log("Direct query also failed or returned no results");
      }

      return;
    }

    console.log(`✅ Found ${data.length} tables:\n`);
    (data as any[]).forEach((row) => {
      console.log(`  - ${row.table_name}`);
    });

    // Check specific credit tables
    console.log("\n--- Checking Credit System Tables ---");
    const creditTables = [
      "subscriptions",
      "credit_balances",
      "credit_transactions",
      "daily_credit_claims",
    ];

    for (const tableName of creditTables) {
      const { count, error } = await client
        .from(tableName)
        .select("*", { count: "exact", head: true });

      if (error) {
        console.log(`  ❌ ${tableName}: ${error.message}`);
      } else {
        console.log(`  ✅ ${tableName}: OK (${count || 0} rows)`);
      }
    }
  } catch (err) {
    console.error("Fatal error:", err);
  }
}

checkTables();
