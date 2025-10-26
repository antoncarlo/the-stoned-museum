import { z } from "zod";
import { eq, and, sql } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { router, protectedProcedure } from "../_core/trpc";
import { getDb } from "../db";
import { users } from "../../drizzle/schema";

// Pool configurations
const POOL_CONFIGS = {
  flexible: { apy: 0.05, lockDays: 0, penalty: 0 },
  "30gg": { apy: 0.1, lockDays: 30, penalty: 0.1 },
  "90gg": { apy: 0.25, lockDays: 90, penalty: 0.25 },
  "180gg": { apy: 0.5, lockDays: 180, penalty: 0.4 },
  "365gg": { apy: 0.8, lockDays: 365, penalty: 0.5 },
} as const;

type PoolType = keyof typeof POOL_CONFIGS;

export const stakingRouter = router({
  /**
   * Get statistics for all staking pools
   */
  getPoolStats: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Database not available",
      });
    }

    try {
      // Get all users with active stakes
      const allUsers = await db.select().from(users);

      // Calculate TVL per pool
      const poolStats = Object.entries(POOL_CONFIGS).map(([poolName, config]) => {
        const usersInPool = allUsers.filter((u) => u.stakingPool === poolName);
        const tvl = usersInPool.reduce((sum, u) => sum + Number(u.stakingAmount), 0);
        const userCount = usersInPool.length;

        // Get current user's stake in this pool
        const userStaked =
          ctx.user.stakingPool === poolName ? Number(ctx.user.stakingAmount) : 0;

        return {
          pool: poolName as PoolType,
          apy: config.apy,
          lockDays: config.lockDays,
          penalty: config.penalty,
          tvl,
          userCount,
          userStaked,
        };
      });

      return poolStats;
    } catch (error) {
      console.error("[Staking] Failed to get pool stats:", error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to fetch pool statistics",
      });
    }
  }),

  /**
   * Stake $MUSEUM tokens in a pool
   */
  stake: protectedProcedure
    .input(
      z.object({
        amount: z.number().positive(),
        pool: z.enum(["flexible", "30gg", "90gg", "180gg", "365gg"]),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Database not available",
        });
      }

      try {
        // Check if user already has an active stake
        if (ctx.user.stakingPool !== "none" && ctx.user.stakingAmount > 0) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "You already have an active stake. Unstake first to change pools.",
          });
        }

        // Check balance
        if (ctx.user.museumBalance < input.amount) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Insufficient $MUSEUM balance",
          });
        }

        // Stake tokens
        await db
          .update(users)
          .set({
            stakingPool: input.pool,
            stakingAmount: input.amount,
            stakingStartedAt: new Date(),
            museumBalance: sql`${users.museumBalance} - ${input.amount}`,
          })
          .where(eq(users.id, ctx.user.id));

        return {
          success: true,
          message: `Successfully staked ${input.amount} $MUSEUM in ${input.pool} pool`,
        };
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }
        console.error("[Staking] Failed to stake:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to stake tokens",
        });
      }
    }),

  /**
   * Unstake $MUSEUM tokens from pool
   */
  unstake: protectedProcedure
    .input(
      z.object({
        pool: z.enum(["flexible", "30gg", "90gg", "180gg", "365gg"]),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Database not available",
        });
      }

      try {
        // Check if user has stake in this pool
        if (ctx.user.stakingPool !== input.pool) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "You don't have a stake in this pool",
          });
        }

        if (ctx.user.stakingAmount <= 0) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "No active stake found",
          });
        }

        if (!ctx.user.stakingStartedAt) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Invalid staking start date",
          });
        }

        const poolConfig = POOL_CONFIGS[input.pool];
        const stakingStartDate = new Date(ctx.user.stakingStartedAt);
        const now = new Date();
        const daysStaked = (now.getTime() - stakingStartDate.getTime()) / (1000 * 60 * 60 * 24);

        // Calculate rewards
        const timeElapsed = (now.getTime() - stakingStartDate.getTime()) / (1000 * 60 * 60 * 24 * 365);
        let rewards = Math.floor(ctx.user.stakingAmount * poolConfig.apy * timeElapsed);

        // Apply penalty if early unstake
        let penalty = 0;
        if (daysStaked < poolConfig.lockDays) {
          penalty = Math.floor(rewards * poolConfig.penalty);
          rewards -= penalty;
        }

        // Return staked amount + rewards
        const totalReturn = ctx.user.stakingAmount + rewards;

        await db
          .update(users)
          .set({
            stakingPool: "none",
            stakingAmount: 0,
            stakingStartedAt: null,
            museumBalance: sql`${users.museumBalance} + ${totalReturn}`,
          })
          .where(eq(users.id, ctx.user.id));

        return {
          success: true,
          message: `Successfully unstaked ${ctx.user.stakingAmount} $MUSEUM`,
          stakedAmount: ctx.user.stakingAmount,
          rewards,
          penalty,
          totalReturn,
        };
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }
        console.error("[Staking] Failed to unstake:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to unstake tokens",
        });
      }
    }),

  /**
   * Get current staking rewards
   */
  getRewards: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Database not available",
      });
    }

    try {
      if (ctx.user.stakingPool === "none" || ctx.user.stakingAmount <= 0) {
        return {
          pool: "none",
          stakedAmount: 0,
          rewards: 0,
          daysStaked: 0,
          canUnstakeWithoutPenalty: true,
        };
      }

      if (!ctx.user.stakingStartedAt) {
        return {
          pool: ctx.user.stakingPool,
          stakedAmount: ctx.user.stakingAmount,
          rewards: 0,
          daysStaked: 0,
          canUnstakeWithoutPenalty: true,
        };
      }

      const poolConfig = POOL_CONFIGS[ctx.user.stakingPool as PoolType];
      const stakingStartDate = new Date(ctx.user.stakingStartedAt);
      const now = new Date();
      const daysStaked = (now.getTime() - stakingStartDate.getTime()) / (1000 * 60 * 60 * 24);
      const timeElapsed = (now.getTime() - stakingStartDate.getTime()) / (1000 * 60 * 60 * 24 * 365);

      const rewards = Math.floor(ctx.user.stakingAmount * poolConfig.apy * timeElapsed);
      const canUnstakeWithoutPenalty = daysStaked >= poolConfig.lockDays;

      return {
        pool: ctx.user.stakingPool,
        stakedAmount: ctx.user.stakingAmount,
        rewards,
        daysStaked: Math.floor(daysStaked),
        lockDays: poolConfig.lockDays,
        canUnstakeWithoutPenalty,
        penalty: poolConfig.penalty,
      };
    } catch (error) {
      console.error("[Staking] Failed to get rewards:", error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to calculate rewards",
      });
    }
  }),

  /**
   * Claim accumulated staking rewards without unstaking
   */
  claimRewards: protectedProcedure.mutation(async ({ ctx }) => {
    const db = await getDb();
    if (!db) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Database not available",
      });
    }

    try {
      if (ctx.user.stakingPool === "none" || ctx.user.stakingAmount <= 0) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "No active stake found",
        });
      }

      if (!ctx.user.stakingStartedAt) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Invalid staking start date",
        });
      }

      const poolConfig = POOL_CONFIGS[ctx.user.stakingPool as PoolType];
      const stakingStartDate = new Date(ctx.user.stakingStartedAt);
      const now = new Date();
      const timeElapsed = (now.getTime() - stakingStartDate.getTime()) / (1000 * 60 * 60 * 24 * 365);

      const rewards = Math.floor(ctx.user.stakingAmount * poolConfig.apy * timeElapsed);

      if (rewards <= 0) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "No rewards to claim yet",
        });
      }

      // Claim rewards and reset staking start date
      await db
        .update(users)
        .set({
          museumBalance: sql`${users.museumBalance} + ${rewards}`,
          stakingStartedAt: new Date(), // Reset to now
        })
        .where(eq(users.id, ctx.user.id));

      return {
        success: true,
        message: `Successfully claimed ${rewards} $MUSEUM rewards`,
        rewards,
      };
    } catch (error) {
      if (error instanceof TRPCError) {
        throw error;
      }
      console.error("[Staking] Failed to claim rewards:", error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to claim rewards",
      });
    }
  }),
});

