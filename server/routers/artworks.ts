import { z } from "zod";
import { eq, desc } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { router, protectedProcedure, publicProcedure, adminProcedure } from "../_core/trpc";
import { getDb } from "../db";
import { artworks } from "../../drizzle/schema";

export const artworksRouter = router({
  /**
   * Get all artworks
   */
  list: publicProcedure
    .input(
      z
        .object({
          rarity: z.enum(["Common", "Rare", "Epic", "Legendary", "Mythic"]).optional(),
          sortBy: z.enum(["gp_desc", "recent"]).default("recent"),
        })
        .optional()
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Database not available",
        });
      }

      try {
        let query = db.select().from(artworks);

        // Apply sorting
        if (input?.sortBy === "gp_desc") {
          query = query.orderBy(desc(artworks.gp));
        } else {
          query = query.orderBy(desc(artworks.createdAt));
        }

        let results = await query;

        // Apply rarity filter
        if (input?.rarity) {
          results = results.filter((a) => a.rarity === input.rarity);
        }

        return results;
      } catch (error) {
        console.error("[Artworks] Failed to list:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch artworks",
        });
      }
    }),

  /**
   * Get single artwork by ID
   */
  getById: publicProcedure
    .input(
      z.object({
        id: z.number().positive(),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Database not available",
        });
      }

      try {
        const result = await db.select().from(artworks).where(eq(artworks.id, input.id)).limit(1);

        if (result.length === 0) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Artwork not found",
          });
        }

        return result[0];
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }
        console.error("[Artworks] Failed to get by ID:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch artwork",
        });
      }
    }),

  /**
   * Get user's artwork collection
   */
  getUserArtworks: protectedProcedure
    .input(
      z.object({
        walletAddress: z.string().optional(),
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

      // Use provided wallet or current user's wallet
      const targetWallet = input.walletAddress || ctx.user.walletAddress;

      if (!targetWallet) {
        return [];
      }

      try {
        const results = await db
          .select()
          .from(artworks)
          .where(eq(artworks.ownerWallet, targetWallet))
          .orderBy(desc(artworks.createdAt));

        return results;
      } catch (error) {
        console.error("[Artworks] Failed to get user artworks:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch user artworks",
        });
      }
    }),

  /**
   * Mint new artwork (admin only)
   */
  mint: adminProcedure
    .input(
      z.object({
        mint: z.string().min(1).max(64),
        name: z.string().min(1),
        rarity: z.enum(["Common", "Rare", "Epic", "Legendary", "Mythic"]),
        gp: z.number().positive(),
        imageUrl: z.string().url().optional(),
        artist: z.string().optional(),
        description: z.string().optional(),
        ownerWallet: z.string().max(64).optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Database not available",
        });
      }

      try {
        // Check if mint already exists
        const existing = await db
          .select()
          .from(artworks)
          .where(eq(artworks.mint, input.mint))
          .limit(1);

        if (existing.length > 0) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Artwork with this mint already exists",
          });
        }

        // Create artwork
        await db.insert(artworks).values({
          mint: input.mint,
          name: input.name,
          rarity: input.rarity,
          gp: input.gp,
          imageUrl: input.imageUrl,
          artist: input.artist,
          description: input.description,
          ownerWallet: input.ownerWallet,
        });

        return {
          success: true,
          message: "Artwork minted successfully",
        };
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }
        console.error("[Artworks] Failed to mint:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to mint artwork",
        });
      }
    }),
});

