/**
 * Cron Job: Mining Rewards
 * 
 * Questo job viene eseguito ogni ora per calcolare e distribuire
 * i rewards del mining passivo a tutti gli utenti con slot attivi.
 * 
 * Schedule: Ogni ora (0 * * * *)
 */

import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import { users, slots, artworks, miningRewards } from "../../drizzle/schema";
import { eq, and, isNotNull } from "drizzle-orm";

const DATABASE_URL = process.env.DATABASE_URL || "mysql://root@localhost:3306/stoned_museum";

// Rarity multipliers
const RARITY_MULTIPLIERS = {
  Common: 1,
  Rare: 2,
  Epic: 4,
  Legendary: 8,
  Mythic: 16,
} as const;

/**
 * Calculate level bonus
 * +5% every 5 levels
 */
function calculateLevelBonus(level: number): number {
  const bonusLevels = Math.floor(level / 5);
  return 1 + bonusLevels * 0.05;
}

/**
 * Calculate mining rate for a user
 */
async function calculateUserMiningRate(
  db: any,
  userId: number,
  userLevel: number
): Promise<number> {
  // Get all user's slots with artworks
  const userSlots = await db
    .select()
    .from(slots)
    .leftJoin(artworks, eq(slots.artworkMint, artworks.mint))
    .where(and(eq(slots.userId, userId), isNotNull(slots.artworkMint)));

  if (userSlots.length === 0) {
    return 0;
  }

  // Calculate total GP with rarity multipliers
  let totalMiningPower = 0;
  for (const slot of userSlots) {
    if (slot.artworks) {
      const gp = slot.artworks.gp;
      const rarity = slot.artworks.rarity as keyof typeof RARITY_MULTIPLIERS;
      const multiplier = RARITY_MULTIPLIERS[rarity] || 1;
      totalMiningPower += gp * multiplier;
    }
  }

  // Apply level bonus
  const levelBonus = calculateLevelBonus(userLevel);
  const hourlyRate = Math.floor(totalMiningPower * levelBonus);

  return hourlyRate;
}

/**
 * Process mining rewards for all users
 */
async function processMiningRewards() {
  console.log("\n⛏️  Mining Rewards Cron Job Started");
  console.log("=".repeat(60));
  console.log(`Time: ${new Date().toISOString()}\n`);

  let connection;
  try {
    // Connect to database
    connection = await mysql.createConnection(DATABASE_URL);
    const db = drizzle(connection);

    // Get all users with Museum Pass (museumPassMint not null)
    const allUsers = await db
      .select()
      .from(users)
      .where(isNotNull(users.museumPassMint));

    console.log(`Found ${allUsers.length} users with Museum Pass\n`);

    let processedCount = 0;
    let totalRewardsDistributed = 0;

    for (const user of allUsers) {
      try {
        // Calculate mining rate
        const hourlyRate = await calculateUserMiningRate(db, user.id, user.level);

        if (hourlyRate > 0) {
          // Update user balance
          const newBalance = user.museumBalance + hourlyRate;
          await db
            .update(users)
            .set({ museumBalance: newBalance })
            .where(eq(users.id, user.id));

          // Record mining reward
          await db.insert(miningRewards).values({
            userId: user.id,
            amount: hourlyRate,
            miningRate: hourlyRate,
          });

          processedCount++;
          totalRewardsDistributed += hourlyRate;

          console.log(
            `✅ User ${user.id} (${user.walletAddress?.substring(0, 8)}...): +${hourlyRate} $MUSEUM (rate: ${hourlyRate}/h)`
          );
        } else {
          console.log(
            `⚠️  User ${user.id} (${user.walletAddress?.substring(0, 8)}...): No active slots, skipped`
          );
        }
      } catch (error: any) {
        console.error(`❌ Error processing user ${user.id}:`, error.message);
      }
    }

    // Summary
    console.log("\n" + "=".repeat(60));
    console.log("\n📊 Mining Rewards Summary:\n");
    console.log(`  Total users processed: ${processedCount}/${allUsers.length}`);
    console.log(`  Total rewards distributed: ${totalRewardsDistributed} $MUSEUM`);
    console.log(`  Average reward per user: ${Math.floor(totalRewardsDistributed / processedCount || 0)} $MUSEUM`);
    console.log("\n" + "=".repeat(60));
    console.log("\n✅ Mining Rewards Cron Job Completed\n");
  } catch (error: any) {
    console.error("\n❌ Mining Rewards Cron Job Failed:", error.message);
    throw error;
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

export { processMiningRewards };

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  processMiningRewards()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

