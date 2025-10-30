/**
 * Database Auto-Initialization
 * 
 * This script checks if the database tables exist and creates them if needed.
 * It runs automatically on server startup in production.
 */

import mysql from "mysql2/promise";
import fs from "fs";
import path from "path";

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

async function runMigrations(): Promise<void> {
  if (!DATABASE_URL) {
    throw new Error("DATABASE_URL is not set");
  }

  let connection;
  try {
    connection = await mysql.createConnection(DATABASE_URL);
    
    // Read the schema SQL file from drizzle migrations
    const migrationsDir = path.resolve(__dirname, "../../drizzle");
    
    // If migrations directory doesn't exist, try to find the latest SQL file
    let sqlFiles: string[] = [];
    if (fs.existsSync(migrationsDir)) {
      sqlFiles = fs.readdirSync(migrationsDir)
        .filter(f => f.endsWith('.sql'))
        .sort()
        .reverse(); // Get the latest migration first
    }
    
    if (sqlFiles.length > 0) {
      const latestMigration = path.join(migrationsDir, sqlFiles[0]);
      const sql = fs.readFileSync(latestMigration, 'utf-8');
      
      // Split by semicolon and execute each statement
      const statements = sql.split(';').filter(s => s.trim());
      
      for (const statement of statements) {
        if (statement.trim()) {
          await connection.query(statement);
        }
      }
      
      console.log(`✅ Applied migration: ${sqlFiles[0]}`);
    } else {
      console.log("⚠️  No migration files found, skipping...");
    }
    
  } catch (error: any) {
    console.error("❌ Error running migrations:", error.message);
    throw error;
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
    await runMigrations();
    console.log("\n✅ Database initialized successfully!\n");
  } catch (error: any) {
    console.error("\n❌ Failed to initialize database:", error.message);
    console.error("The server will start anyway, but database operations may fail.\n");
    // Don't throw - let the server start anyway
  }
}

