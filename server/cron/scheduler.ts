/**
 * Cron Job Scheduler
 * 
 * Gestisce la schedulazione e l'esecuzione di tutti i cron jobs
 * per The Stoned Museum.
 */

import cron from "node-cron";
import { processMiningRewards } from "./mining-rewards";
import { processStakingRewards } from "./staking-rewards";

/**
 * Initialize all cron jobs
 */
export function initializeCronJobs() {
  console.log("\n🕐 Initializing Cron Jobs...\n");

  // Mining Rewards - Every hour
  cron.schedule("0 * * * *", async () => {
    console.log("\n[CRON] Mining Rewards job triggered");
    try {
      await processMiningRewards();
    } catch (error) {
      console.error("[CRON] Mining Rewards job failed:", error);
    }
  });
  console.log("✅ Mining Rewards job scheduled (every hour)");

  // Staking Rewards - Every day at midnight
  cron.schedule("0 0 * * *", async () => {
    console.log("\n[CRON] Staking Rewards job triggered");
    try {
      await processStakingRewards();
    } catch (error) {
      console.error("[CRON] Staking Rewards job failed:", error);
    }
  });
  console.log("✅ Staking Rewards job scheduled (daily at midnight)");

  console.log("\n✅ All cron jobs initialized successfully\n");
}

/**
 * Run all cron jobs immediately (for testing)
 */
export async function runAllCronJobsNow() {
  console.log("\n🚀 Running all cron jobs immediately...\n");

  try {
    await processMiningRewards();
    await processStakingRewards();
    console.log("\n✅ All cron jobs completed successfully\n");
  } catch (error) {
    console.error("\n❌ Error running cron jobs:", error);
    throw error;
  }
}

