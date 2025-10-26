import { z } from "zod";
import { eq, and, sql } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { router, protectedProcedure } from "../_core/trpc";
import { getDb } from "../db";
import { slots, artworks, miningRewards, users } from "../../drizzle/schema";

// Rarity multipliers
const RARITY_MULTIPLIERS = {
  Common: 1,
  Rare: 2,
  Epic: 4,
  Legendary: 8,
  Mythic: 16,
} as const;

/**
 * Calculate level bonus: +5% every 5 levels
 */
function calculateLevelBonus(level: number): number {
  const bonusLevels = Math.floor(level / 5);
  return 1 + bonusLevels * 0.05;
}

export const miningRouter = router({
  /**
   * Calculate current mining rewards for user
   */
  calculateRewards: protectedProcedure
    .input(
      z.object({
        userId: z.number().positive().optional(),
      })
    )
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Database not available",
        });
      }

      const targetUserId = input.userId || ctx.user.id;

      try {
        // Get user's slots with artworks
        const userSlots = await db.select().from(slots).where(eq(slots.userId, targetUserId));

        // Filter slots with artworks
        const occupiedSlots = userSlots.filter((s) => s.artworkMint);

        if (occupiedSlots.length === 0) {
          return {
            totalRewards: 0,
            hourlyRate: 0,
            artworksCount: 0,
          };
        }

        // Get artwork details
        const artworkDetails = await Promise.all(
          occupiedSlots.map(async (slot) => {
            const artwork = await db
              .select()
              .from(artworks)
              .where(eq(artworks.mint, slot.artworkMint!))
              .limit(1);
            return artwork.length > 0 ? artwork[0] : null;
          })
        );

        // Calculate hourly rate
        const levelBonus = calculateLevelBonus(ctx.user.level);
        let totalHourlyRate = 0;

        artworkDetails.forEach((artwork) => {
          if (!artwork) return;
          const rarityMultiplier = RARITY_MULTIPLIERS[artwork.rarity];
          const hourlyRate = artwork.gp * rarityMultiplier * levelBonus;
          totalHourlyRate += hourlyRate;
        });

        // Get unclaimed rewards from database
        const unclaimedRewards = await db
          .select()
          .from(miningRewards)
          .where(and(eq(miningRewards.userId, targetUserId), eq(miningRewards.claimed, false)));

        const totalUnclaimed = unclaimedRewards.reduce((sum, r) => sum + Number(r.amount), 0);

        return {
          totalRewards: totalUnclaimed,
          hourlyRate: Math.floor(totalHourlyRate),
          artworksCount: artworkDetails.filter((a) => a !== null).length,
        };
      } catch (error) {
        console.error("[Mining] Failed to calculate rewards:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to calculate mining rewards",
        });
      }
    }),

  /**
   * Claim accumulated mining rewards
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
      // Get unclaimed rewards
      const unclaimedRewards = await db
        .select()
        .from(miningRewards)
        .where(and(eq(miningRewards.userId, ctx.user.id), eq(miningRewards.claimed, false)));

      if (unclaimedRewards.length === 0) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "No rewards to claim",
        });
      }

      const totalRewards = unclaimedRewards.reduce((sum, r) => sum + Number(r.amount), 0);

      if (totalRewards <= 0) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "No rewards to claim",
        });
      }

      // Mark rewards as claimed
      await db
        .update(miningRewards)
        .set({
          claimed: true,
          claimedAt: new Date(),
        })
        .where(and(eq(miningRewards.userId, ctx.user.id), eq(miningRewards.claimed, false)));

      // Add rewards to user balance
      await db
        .update(users)
        .set({
          museumBalance: sql`${users.museumBalance} + ${totalRewards}`,
        })
        .where(eq(users.id, ctx.user.id));

      return {
        success: true,
        message: `Successfully claimed ${totalRewards} $MUSEUM`,
        rewards: totalRewards,
      };
    } catch (error) {
      if (error instanceof TRPCError) {
        throw error;
      }
      console.error("[Mining] Failed to claim rewards:", error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to claim rewards",
      });
    }
  }),

  /**
   * Get current mining rate per hour
   */
  getMiningRate: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Database not available",
      });
    }

    try {
      // Get user's slots with artworks
      const userSlots = await db.select().from(slots).where(eq(slots.userId, ctx.user.id));

      // Filter slots with artworks
      const occupiedSlots = userSlots.filter((s) => s.artworkMint);

      if (occupiedSlots.length === 0) {
        return {
          hourlyRate: 0,
          artworksCount: 0,
          levelBonus: calculateLevelBonus(ctx.user.level),
        };
      }

      // Get artwork details
      const artworkDetails = await Promise.all(
        occupiedSlots.map(async (slot) => {
          const artwork = await db
            .select()
            .from(artworks)
            .where(eq(artworks.mint, slot.artworkMint!))
            .limit(1);
          return artwork.length > 0 ? artwork[0] : null;
        })
      );

      // Calculate hourly rate
      const levelBonus = calculateLevelBonus(ctx.user.level);
      let totalHourlyRate = 0;

      artworkDetails.forEach((artwork) => {
        if (!artwork) return;
        const rarityMultiplier = RARITY_MULTIPLIERS[artwork.rarity];
        const hourlyRate = artwork.gp * rarityMultiplier * levelBonus;
        totalHourlyRate += hourlyRate;
      });

      return {
        hourlyRate: Math.floor(totalHourlyRate),
        artworksCount: artworkDetails.filter((a) => a !== null).length,
        levelBonus,
      };
    } catch (error) {
      console.error("[Mining] Failed to get mining rate:", error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to get mining rate",
      });
    }
  }),
});

