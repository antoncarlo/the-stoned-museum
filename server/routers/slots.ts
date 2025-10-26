import { z } from "zod";
import { eq, and } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { router, protectedProcedure } from "../_core/trpc";
import { getDb } from "../db";
import { slots, artworks } from "../../drizzle/schema";

export const slotsRouter = router({
  /**
   * Get user's slots with artwork details
   */
  getUserSlots: protectedProcedure
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
        // Get all slots for user
        const userSlots = await db.select().from(slots).where(eq(slots.userId, targetUserId));

        // Get artwork details for each slot
        const slotsWithArtworks = await Promise.all(
          userSlots.map(async (slot) => {
            if (!slot.artworkMint) {
              return {
                ...slot,
                artwork: null,
              };
            }

            const artworkResult = await db
              .select()
              .from(artworks)
              .where(eq(artworks.mint, slot.artworkMint))
              .limit(1);

            return {
              ...slot,
              artwork: artworkResult.length > 0 ? artworkResult[0] : null,
            };
          })
        );

        return slotsWithArtworks;
      } catch (error) {
        console.error("[Slots] Failed to get user slots:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch user slots",
        });
      }
    }),

  /**
   * Assign artwork to slot
   */
  assignArtwork: protectedProcedure
    .input(
      z.object({
        slotNumber: z.number().positive(),
        artworkMint: z.string().min(1).max(64),
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
        // Check if artwork exists and is owned by user
        const artwork = await db
          .select()
          .from(artworks)
          .where(eq(artworks.mint, input.artworkMint))
          .limit(1);

        if (artwork.length === 0) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Artwork not found",
          });
        }

        if (artwork[0].ownerWallet !== ctx.user.walletAddress) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "You don't own this artwork",
          });
        }

        // Check if artwork is already in another slot
        const existingSlot = await db
          .select()
          .from(slots)
          .where(and(eq(slots.userId, ctx.user.id), eq(slots.artworkMint, input.artworkMint)))
          .limit(1);

        if (existingSlot.length > 0 && existingSlot[0].slotNumber !== input.slotNumber) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Artwork is already assigned to another slot",
          });
        }

        // Check if slot exists for user
        const slot = await db
          .select()
          .from(slots)
          .where(and(eq(slots.userId, ctx.user.id), eq(slots.slotNumber, input.slotNumber)))
          .limit(1);

        if (slot.length === 0) {
          // Create new slot
          await db.insert(slots).values({
            userId: ctx.user.id,
            slotNumber: input.slotNumber,
            artworkMint: input.artworkMint,
          });
        } else {
          // Update existing slot
          await db
            .update(slots)
            .set({ artworkMint: input.artworkMint })
            .where(and(eq(slots.userId, ctx.user.id), eq(slots.slotNumber, input.slotNumber)));
        }

        return {
          success: true,
          message: "Artwork assigned to slot successfully",
        };
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }
        console.error("[Slots] Failed to assign artwork:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to assign artwork to slot",
        });
      }
    }),

  /**
   * Remove artwork from slot
   */
  removeArtwork: protectedProcedure
    .input(
      z.object({
        slotNumber: z.number().positive(),
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
        // Check if slot exists
        const slot = await db
          .select()
          .from(slots)
          .where(and(eq(slots.userId, ctx.user.id), eq(slots.slotNumber, input.slotNumber)))
          .limit(1);

        if (slot.length === 0) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Slot not found",
          });
        }

        if (!slot[0].artworkMint) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Slot is already empty",
          });
        }

        // Remove artwork from slot
        await db
          .update(slots)
          .set({ artworkMint: null })
          .where(and(eq(slots.userId, ctx.user.id), eq(slots.slotNumber, input.slotNumber)));

        return {
          success: true,
          message: "Artwork removed from slot successfully",
        };
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }
        console.error("[Slots] Failed to remove artwork:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to remove artwork from slot",
        });
      }
    }),

  /**
   * Unlock new slot (level requirement check)
   */
  unlockSlot: protectedProcedure
    .input(
      z.object({
        slotNumber: z.number().positive(),
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
        // Check level requirements
        // Level 1-4: 10 slots
        // Level 5: 20 slots
        // Level 10: 30 slots
        let maxSlots = 10;
        if (ctx.user.level >= 10) {
          maxSlots = 30;
        } else if (ctx.user.level >= 5) {
          maxSlots = 20;
        }

        if (input.slotNumber > maxSlots) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: `You need level ${input.slotNumber <= 20 ? 5 : 10} to unlock this slot`,
          });
        }

        // Check if slot already exists
        const existingSlot = await db
          .select()
          .from(slots)
          .where(and(eq(slots.userId, ctx.user.id), eq(slots.slotNumber, input.slotNumber)))
          .limit(1);

        if (existingSlot.length > 0) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Slot is already unlocked",
          });
        }

        // Create new slot
        await db.insert(slots).values({
          userId: ctx.user.id,
          slotNumber: input.slotNumber,
          artworkMint: null,
        });

        return {
          success: true,
          message: `Slot ${input.slotNumber} unlocked successfully`,
        };
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }
        console.error("[Slots] Failed to unlock slot:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to unlock slot",
        });
      }
    }),
});

