#!/usr/bin/env tsx
/**
 * CLI Script per inserire opere NFT reali nel database
 * 
 * Usage:
 *   pnpm tsx scripts/add-artwork.ts
 * 
 * Lo script chiederà interattivamente tutti i dati necessari
 */

import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import { artworks } from "../drizzle/schema";
import * as readline from "readline";

const DATABASE_URL = process.env.DATABASE_URL || "mysql://root@localhost:3306/stoned_museum";

// Create readline interface
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function question(prompt: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(prompt, (answer) => {
      resolve(answer.trim());
    });
  });
}

async function addArtwork() {
  console.log("\n🎨 The Stoned Museum - Add Artwork CLI\n");
  console.log("=".repeat(60));
  console.log("\nInserisci i dati dell'opera NFT:\n");

  try {
    // Collect artwork data
    const mint = await question("Mint Address (Solana): ");
    if (!mint) {
      throw new Error("Mint address è obbligatorio");
    }

    const name = await question("Nome dell'opera: ");
    if (!name) {
      throw new Error("Nome è obbligatorio");
    }

    console.log("\nRarità disponibili:");
    console.log("  1. Common (1x multiplier)");
    console.log("  2. Rare (2x multiplier)");
    console.log("  3. Epic (4x multiplier)");
    console.log("  4. Legendary (8x multiplier)");
    console.log("  5. Mythic (16x multiplier)");
    const rarityChoice = await question("\nScegli rarità (1-5): ");
    
    const rarityMap: { [key: string]: "Common" | "Rare" | "Epic" | "Legendary" | "Mythic" } = {
      "1": "Common",
      "2": "Rare",
      "3": "Epic",
      "4": "Legendary",
      "5": "Mythic",
    };
    
    const rarity = rarityMap[rarityChoice];
    if (!rarity) {
      throw new Error("Rarità non valida");
    }

    const gpInput = await question("GP (Gallery Points, es. 10-300): ");
    const gp = parseInt(gpInput);
    if (isNaN(gp) || gp <= 0) {
      throw new Error("GP deve essere un numero positivo");
    }

    const imageUrl = await question("URL Immagine (opzionale, premi Enter per saltare): ");
    const artist = await question("Artista (opzionale, premi Enter per saltare): ");
    const description = await question("Descrizione (opzionale, premi Enter per saltare): ");
    const ownerWallet = await question("Wallet Proprietario (opzionale, premi Enter per saltare): ");

    // Confirm data
    console.log("\n" + "=".repeat(60));
    console.log("\n📋 Riepilogo Opera:\n");
    console.log(`  Mint:        ${mint}`);
    console.log(`  Nome:        ${name}`);
    console.log(`  Rarità:      ${rarity}`);
    console.log(`  GP:          ${gp}`);
    console.log(`  Immagine:    ${imageUrl || "(non specificata)"}`);
    console.log(`  Artista:     ${artist || "(non specificato)"}`);
    console.log(`  Descrizione: ${description || "(non specificata)"}`);
    console.log(`  Proprietario: ${ownerWallet || "(non specificato)"}`);
    console.log("\n" + "=".repeat(60));

    const confirm = await question("\nConfermi l'inserimento? (y/n): ");
    if (confirm.toLowerCase() !== "y" && confirm.toLowerCase() !== "yes") {
      console.log("\n❌ Operazione annullata");
      rl.close();
      process.exit(0);
    }

    // Connect to database
    console.log("\n🔌 Connessione al database...");
    const connection = await mysql.createConnection(DATABASE_URL);
    const db = drizzle(connection);

    // Insert artwork
    console.log("💾 Inserimento opera...");
    await db.insert(artworks).values({
      mint,
      name,
      rarity,
      gp,
      imageUrl: imageUrl || null,
      artist: artist || null,
      description: description || null,
      ownerWallet: ownerWallet || null,
    });

    console.log("\n✅ Opera inserita con successo!");
    console.log("\n📊 Statistiche Mining:");
    
    const rarityMultipliers: { [key: string]: number } = {
      Common: 1,
      Rare: 2,
      Epic: 4,
      Legendary: 8,
      Mythic: 16,
    };
    
    const multiplier = rarityMultipliers[rarity];
    const baseMiningRate = gp * multiplier;
    
    console.log(`  Mining Rate Base: ${baseMiningRate} $MUSEUM/h`);
    console.log(`  Con Level 5 (+5%): ${Math.floor(baseMiningRate * 1.05)} $MUSEUM/h`);
    console.log(`  Con Level 10 (+10%): ${Math.floor(baseMiningRate * 1.10)} $MUSEUM/h`);

    await connection.end();
    console.log("\n" + "=".repeat(60));

    // Ask if user wants to add another artwork
    const addAnother = await question("\nVuoi aggiungere un'altra opera? (y/n): ");
    if (addAnother.toLowerCase() === "y" || addAnother.toLowerCase() === "yes") {
      await addArtwork();
    } else {
      rl.close();
      console.log("\n👋 Arrivederci!\n");
      process.exit(0);
    }

  } catch (error: any) {
    console.error("\n❌ Errore:", error.message);
    rl.close();
    process.exit(1);
  }
}

// Run the script
addArtwork().catch((error) => {
  console.error("\n❌ Errore fatale:", error);
  rl.close();
  process.exit(1);
});

