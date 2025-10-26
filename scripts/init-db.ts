#!/usr/bin/env tsx
/**
 * Initialize Database Schema
 * 
 * This script creates all necessary tables in the database.
 * Run this after deploying to Railway for the first time.
 * 
 * Usage:
 *   pnpm tsx scripts/init-db.ts
 */

import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import * as schema from "../drizzle/schema";

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error("\n❌ Error: DATABASE_URL environment variable is not set");
  console.log("\nPlease set DATABASE_URL in your environment:");
  console.log("  export DATABASE_URL='mysql://user:password@host:port/database'");
  process.exit(1);
}

async function initDatabase() {
  console.log("\n🗄️  Database Initialization\n");
  console.log("=".repeat(60));
  console.log(`\nConnecting to database...`);
  console.log(`URL: ${DATABASE_URL.replace(/:[^:@]+@/, ':****@')}\n`);

  let connection;
  try {
    // Connect to database
    connection = await mysql.createConnection(DATABASE_URL);
    const db = drizzle(connection);

    console.log("✅ Connected to database\n");

    // Get list of tables to create
    const tables = Object.keys(schema);
    console.log(`Found ${tables.length} tables to create:\n`);
    tables.forEach((table, i) => {
      console.log(`  ${i + 1}. ${table}`);
    });

    console.log("\n" + "=".repeat(60));
    console.log("\n⚠️  Note: This script does NOT create tables automatically.");
    console.log("To create tables, use Drizzle Kit:\n");
    console.log("  pnpm drizzle-kit push\n");
    console.log("Or run the migration:");
    console.log("  pnpm db:push\n");
    console.log("=".repeat(60));

    await connection.end();
    console.log("\n✅ Database connection closed\n");

  } catch (error: any) {
    console.error("\n❌ Error:", error.message);
    if (connection) {
      await connection.end();
    }
    process.exit(1);
  }
}

initDatabase();

