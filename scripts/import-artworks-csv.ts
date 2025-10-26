#!/usr/bin/env tsx
/**
 * Script per importare opere NFT da file CSV
 * 
 * Usage:
 *   pnpm tsx scripts/import-artworks-csv.ts path/to/artworks.csv
 * 
 * Formato CSV (con header):
 *   mint,name,rarity,gp,imageUrl,artist,description,ownerWallet
 * 
 * Esempio:
 *   7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU,Crypto Mona Lisa,Mythic,200,https://arweave.net/...,Digital Leonardo,A masterpiece,
 */

import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import { artworks } from "../drizzle/schema";
import * as fs from "fs";
import * as path from "path";

const DATABASE_URL = process.env.DATABASE_URL || "mysql://root@localhost:3306/stoned_museum";

interface ArtworkCSVRow {
  mint: string;
  name: string;
  rarity: "Common" | "Rare" | "Epic" | "Legendary" | "Mythic";
  gp: number;
  imageUrl?: string;
  artist?: string;
  description?: string;
  ownerWallet?: string;
}

function parseCSV(filePath: string): ArtworkCSVRow[] {
  const content = fs.readFileSync(filePath, "utf-8");
  const lines = content.split("\n").filter(line => line.trim());
  
  if (lines.length < 2) {
    throw new Error("CSV file must have at least a header and one data row");
  }

  const header = lines[0].split(",").map(h => h.trim());
  const rows: ArtworkCSVRow[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(",").map(v => v.trim());
    
    if (values.length < 4) {
      console.warn(`⚠️  Skipping line ${i + 1}: insufficient columns`);
      continue;
    }

    const row: any = {};
    header.forEach((key, index) => {
      row[key] = values[index] || null;
    });

    // Validate required fields
    if (!row.mint || !row.name || !row.rarity || !row.gp) {
      console.warn(`⚠️  Skipping line ${i + 1}: missing required fields`);
      continue;
    }

    // Validate rarity
    const validRarities = ["Common", "Rare", "Epic", "Legendary", "Mythic"];
    if (!validRarities.includes(row.rarity)) {
      console.warn(`⚠️  Skipping line ${i + 1}: invalid rarity "${row.rarity}"`);
      continue;
    }

    // Parse GP as number
    const gp = parseInt(row.gp);
    if (isNaN(gp) || gp <= 0) {
      console.warn(`⚠️  Skipping line ${i + 1}: invalid GP "${row.gp}"`);
      continue;
    }

    rows.push({
      mint: row.mint,
      name: row.name,
      rarity: row.rarity as ArtworkCSVRow["rarity"],
      gp,
      imageUrl: row.imageUrl || undefined,
      artist: row.artist || undefined,
      description: row.description || undefined,
      ownerWallet: row.ownerWallet || undefined,
    });
  }

  return rows;
}

async function importArtworks() {
  console.log("\n🎨 The Stoned Museum - Import Artworks from CSV\n");
  console.log("=".repeat(60));

  // Get CSV file path from command line
  const csvPath = process.argv[2];
  if (!csvPath) {
    console.error("\n❌ Error: CSV file path is required");
    console.log("\nUsage:");
    console.log("  pnpm tsx scripts/import-artworks-csv.ts path/to/artworks.csv");
    console.log("\nCSV Format (with header):");
    console.log("  mint,name,rarity,gp,imageUrl,artist,description,ownerWallet");
    console.log("\nExample:");
    console.log("  7xKXt...,Crypto Mona Lisa,Mythic,200,https://...,Artist Name,Description,");
    process.exit(1);
  }

  // Check if file exists
  if (!fs.existsSync(csvPath)) {
    console.error(`\n❌ Error: File not found: ${csvPath}`);
    process.exit(1);
  }

  try {
    // Parse CSV
    console.log(`\n📄 Parsing CSV file: ${csvPath}`);
    const artworksData = parseCSV(csvPath);
    
    if (artworksData.length === 0) {
      console.log("\n⚠️  No valid artworks found in CSV file");
      process.exit(0);
    }

    console.log(`\n✅ Found ${artworksData.length} valid artworks`);

    // Show preview
    console.log("\n📋 Preview (first 3 artworks):\n");
    artworksData.slice(0, 3).forEach((artwork, index) => {
      console.log(`${index + 1}. ${artwork.name}`);
      console.log(`   Mint: ${artwork.mint}`);
      console.log(`   Rarity: ${artwork.rarity} | GP: ${artwork.gp}`);
      if (artwork.artist) console.log(`   Artist: ${artwork.artist}`);
      console.log("");
    });

    if (artworksData.length > 3) {
      console.log(`   ... and ${artworksData.length - 3} more\n`);
    }

    // Connect to database
    console.log("🔌 Connecting to database...");
    const connection = await mysql.createConnection(DATABASE_URL);
    const db = drizzle(connection);

    // Insert artworks
    console.log("💾 Inserting artworks...\n");
    let successCount = 0;
    let errorCount = 0;

    for (const artwork of artworksData) {
      try {
        await db.insert(artworks).values({
          mint: artwork.mint,
          name: artwork.name,
          rarity: artwork.rarity,
          gp: artwork.gp,
          imageUrl: artwork.imageUrl || null,
          artist: artwork.artist || null,
          description: artwork.description || null,
          ownerWallet: artwork.ownerWallet || null,
        });
        
        successCount++;
        console.log(`✅ ${successCount}/${artworksData.length} - ${artwork.name}`);
      } catch (error: any) {
        errorCount++;
        console.error(`❌ Failed to insert "${artwork.name}": ${error.message}`);
      }
    }

    await connection.end();

    // Summary
    console.log("\n" + "=".repeat(60));
    console.log("\n📊 Import Summary:\n");
    console.log(`  Total artworks in CSV: ${artworksData.length}`);
    console.log(`  ✅ Successfully inserted: ${successCount}`);
    console.log(`  ❌ Failed: ${errorCount}`);
    console.log("\n" + "=".repeat(60));

    if (successCount > 0) {
      console.log("\n🎉 Import completed successfully!");
    }

  } catch (error: any) {
    console.error("\n❌ Error:", error.message);
    process.exit(1);
  }
}

// Run the script
importArtworks().catch((error) => {
  console.error("\n❌ Fatal error:", error);
  process.exit(1);
});

