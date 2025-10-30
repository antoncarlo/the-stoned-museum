/**
 * Database Auto-Initialization
 * 
 * This script checks if the database tables exist and creates them if needed.
 * It runs automatically on server startup in production.
 */

import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import { execSync } from "child_process";

const DATABASE_URL = process.env.DATABASE_URL;

async function checkDatabaseInitialized(): Promise<boolean> {
  if (!DATABASE_URL) {
    console.error("❌ DATABASE_URL is not set");
    return false;
  }

  let connection;
  try {
    connection = await mysql.createConnection(DATABASE_URL);
    
    // Check if the users table exists
    const [rows] = await connection.query(
      "SELECT COUNT(*) as count FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = 'users'"
    );
    
    const tableExists = (rows as any)[0].count > 0;
    return tableExists;
  } catch (error: any) {
    console.error("❌ Error checking database:", error.message);
    return false;
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

export async function initializeDatabase(): Promise<void> {
  console.log("\n🔍 Checking database initialization...");
  
  const isInitialized = await checkDatabaseInitialized();
  
  if (isInitialized) {
    console.log("✅ Database is already initialized\n");
    return;
  }
  
  console.log("⚠️  Database not initialized, running migrations...\n");
  
  try {
    // Run drizzle-kit push to create tables
    console.log("📦 Generating schema...");
    execSync("pnpm drizzle-kit generate", { stdio: "inherit" });
    
    console.log("🚀 Applying migrations...");
    execSync("pnpm drizzle-kit migrate", { stdio: "inherit" });
    
    console.log("\n✅ Database initialized successfully!\n");
  } catch (error: any) {
    console.error("\n❌ Failed to initialize database:", error.message);
    console.error("Please run 'pnpm db:push' manually\n");
    throw error;
  }
}

