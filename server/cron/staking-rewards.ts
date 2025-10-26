/**
 * Cron Job: Staking Rewards
 * 
 * Questo job viene eseguito ogni giorno per calcolare e accreditare
 * i rewards dello staking per tutti gli utenti con stake attivo.
 * 
 * Schedule: Ogni giorno a mezzanotte (0 0 * * *)
 */

import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import { users } from "../../drizzle/schema";
import { eq, and, ne, isNotNull } from "drizzle-orm";

const DATABASE_URL = process.env.DATABASE_URL || "mysql://root@localhost:3306/stoned_museum";

// Staking pool configurations
const STAKING_POOLS = {
  flexible: { apy: 0.05, lockDays: 0, penalty: 0 },
  "30gg": { apy: 0.1, lockDays: 30, penalty: 0.1 },
  "90gg": { apy: 0.25, lockDays: 90, penalty: 0.25 },
  "180gg": { apy: 0.5, lockDays: 180, penalty: 0.4 },
  "365gg": { apy: 0.8, lockDays: 365, penalty: 0.5 },
} as const;

type StakingPool = keyof typeof STAKING_POOLS;

/**
 * Calculate staking rewards for a user
 */
function calculateStakingRewards(
  stakedAmount: number,
  pool: StakingPool,
  daysStaked: number
): number {
  const poolConfig = STAKING_POOLS[pool];
  if (!poolConfig) return 0;

  // Daily rewards based on APY
  const dailyRewards = Math.floor(stakedAmount * poolConfig.apy / 365);
  return dailyRewards;
}

/**
 * Process staking rewards for all users
 */
async function processStakingRewards() {
  console.log("\n💎 Staking Rewards Cron Job Started");
  console.log("=".repeat(60));
  console.log(`Time: ${new Date().toISOString()}\n`);

  let connection;
  try {
    // Connect to database
    connection = await mysql.createConnection(DATABASE_URL);
    const db = drizzle(connection);

    // Get all users with active staking
    const stakingUsers = await db
      .select()
      .from(users)
      .where(
        and(
          ne(users.stakingPool, "none"),
          isNotNull(users.stakingStartedAt)
        )
      );

    console.log(`Found ${stakingUsers.length} users with active staking\n`);

    let processedCount = 0;
    let totalRewardsDistributed = 0;

    for (const user of stakingUsers) {
      try {
        const pool = user.stakingPool as StakingPool;
        const stakedAmount = user.stakingAmount;
        const stakingStartedAt = user.stakingStartedAt;

        if (!stakingStartedAt || stakedAmount <= 0) {
          console.log(`⚠️  User ${user.id}: Invalid staking data, skipped`);
          continue;
        }

        // Calculate days staked
        const now = new Date();
        const startDate = new Date(stakingStartedAt);
        const daysStaked = Math.floor((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));

        // Calculate daily rewards
        const dailyRewards = calculateStakingRewards(stakedAmount, pool, daysStaked);

        if (dailyRewards > 0) {
          // Add rewards to staked amount (compound interest)
          const newStakedAmount = stakedAmount + dailyRewards;
          await db
            .update(users)
            .set({ stakingAmount: newStakedAmount })
            .where(eq(users.id, user.id));

          processedCount++;
          totalRewardsDistributed += dailyRewards;

          const poolConfig = STAKING_POOLS[pool];
          console.log(
            `✅ User ${user.id} (${user.walletAddress?.substring(0, 8)}...): +${dailyRewards} $MUSEUM (Pool: ${pool}, APY: ${poolConfig.apy * 100}%, Days: ${daysStaked})`
          );
        }
      } catch (error: any) {
        console.error(`❌ Error processing user ${user.id}:`, error.message);
      }
    }

    // Summary
    console.log("\n" + "=".repeat(60));
    console.log("\n📊 Staking Rewards Summary:\n");
    console.log(`  Total users processed: ${processedCount}/${stakingUsers.length}`);
    console.log(`  Total rewards distributed: ${totalRewardsDistributed} $MUSEUM`);
    console.log(`  Average reward per user: ${Math.floor(totalRewardsDistributed / processedCount || 0)} $MUSEUM`);
    console.log("\n" + "=".repeat(60));
    console.log("\n✅ Staking Rewards Cron Job Completed\n");
  } catch (error: any) {
    console.error("\n❌ Staking Rewards Cron Job Failed:", error.message);
    throw error;
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

export { processStakingRewards };

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  processStakingRewards()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

