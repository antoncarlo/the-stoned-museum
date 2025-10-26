import { z } from "zod";
import { eq, and, desc, asc, gte, lte, sql } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { router, protectedProcedure, publicProcedure } from "../_core/trpc";
import { getDb } from "../db";
import { marketplaceListings, artworks, users } from "../../drizzle/schema";

export const marketplaceRouter = router({
  /**
   * Get all active marketplace listings with optional filters
   */
  list: publicProcedure
    .input(
      z
        .object({
          rarity: z.enum(["Common", "Rare", "Epic", "Legendary", "Mythic"]).optional(),
          minPrice: z.number().positive().optional(),
          maxPrice: z.number().positive().optional(),
          sortBy: z.enum(["price_asc", "price_desc", "gp_desc", "recent"]).default("recent"),
          search: z.string().optional(),
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
        // Build query conditions
        const conditions = [eq(marketplaceListings.active, true)];

        if (input?.minPrice) {
          conditions.push(gte(marketplaceListings.price, input.minPrice));
        }
        if (input?.maxPrice) {
          conditions.push(lte(marketplaceListings.price, input.maxPrice));
        }

        // Get listings with artwork details
        let query = db
          .select({
            listing: marketplaceListings,
            artwork: artworks,
          })
          .from(marketplaceListings)
          .innerJoin(artworks, eq(marketplaceListings.artworkMint, artworks.mint))
          .where(and(...conditions));

        // Apply sorting
        switch (input?.sortBy) {
          case "price_asc":
            query = query.orderBy(asc(marketplaceListings.price));
            break;
          case "price_desc":
            query = query.orderBy(desc(marketplaceListings.price));
            break;
          case "gp_desc":
            query = query.orderBy(desc(artworks.gp));
            break;
          case "recent":
          default:
            query = query.orderBy(desc(marketplaceListings.createdAt));
            break;
        }

        let results = await query;

        // Apply rarity filter
        if (input?.rarity) {
          results = results.filter((r) => r.artwork.rarity === input.rarity);
        }

        // Apply search filter
        if (input?.search) {
          const searchLower = input.search.toLowerCase();
          results = results.filter(
            (r) =>
              r.artwork.name.toLowerCase().includes(searchLower) ||
              r.artwork.artist?.toLowerCase().includes(searchLower)
          );
        }

        return results.map((r) => ({
          ...r.listing,
          artwork: r.artwork,
        }));
      } catch (error) {
        console.error("[Marketplace] Failed to list:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch marketplace listings",
        });
      }
    }),

  /**
   * Get current user's marketplace listings
   */
  myListings: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Database not available",
      });
    }

    if (!ctx.user.walletAddress) {
      return [];
    }

    try {
      const results = await db
        .select({
          listing: marketplaceListings,
          artwork: artworks,
        })
        .from(marketplaceListings)
        .innerJoin(artworks, eq(marketplaceListings.artworkMint, artworks.mint))
        .where(eq(marketplaceListings.sellerWallet, ctx.user.walletAddress))
        .orderBy(desc(marketplaceListings.createdAt));

      return results.map((r) => ({
        ...r.listing,
        artwork: r.artwork,
      }));
    } catch (error) {
      console.error("[Marketplace] Failed to get my listings:", error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to fetch your listings",
      });
    }
  }),

  /**
   * Create a new marketplace listing
   */
  sell: protectedProcedure
    .input(
      z.object({
        artworkMint: z.string().min(1).max(64),
        price: z.number().positive(),
        expiresAt: z.date().min(new Date()),
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

      if (!ctx.user.walletAddress) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Wallet not connected",
        });
      }

      try {
        // Check artwork ownership
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

        // Check if already listed
        const existingListing = await db
          .select()
          .from(marketplaceListings)
          .where(
            and(
              eq(marketplaceListings.artworkMint, input.artworkMint),
              eq(marketplaceListings.active, true)
            )
          )
          .limit(1);

        if (existingListing.length > 0) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Artwork is already listed",
          });
        }

        // Create listing
        await db.insert(marketplaceListings).values({
          artworkMint: input.artworkMint,
          sellerWallet: ctx.user.walletAddress,
          price: input.price,
          active: true,
          expiresAt: input.expiresAt,
        });

        return {
          success: true,
          message: "Artwork listed successfully",
        };
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }
        console.error("[Marketplace] Failed to sell:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create listing",
        });
      }
    }),

  /**
   * Buy an artwork from marketplace
   */
  buy: protectedProcedure
    .input(
      z.object({
        listingId: z.number().positive(),
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

      if (!ctx.user.walletAddress) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Wallet not connected",
        });
      }

      try {
        // Get listing
        const listing = await db
          .select()
          .from(marketplaceListings)
          .where(eq(marketplaceListings.id, input.listingId))
          .limit(1);

        if (listing.length === 0) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Listing not found",
          });
        }

        const listingData = listing[0];

        if (!listingData.active) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Listing is no longer active",
          });
        }

        if (new Date() > new Date(listingData.expiresAt)) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Listing has expired",
          });
        }

        if (listingData.sellerWallet === ctx.user.walletAddress) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "You cannot buy your own listing",
          });
        }

        // Check buyer balance
        if (ctx.user.museumBalance < listingData.price) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Insufficient $MUSEUM balance",
          });
        }

        // Transfer artwork ownership
        await db
          .update(artworks)
          .set({ ownerWallet: ctx.user.walletAddress })
          .where(eq(artworks.mint, listingData.artworkMint));

        // Update listing
        await db
          .update(marketplaceListings)
          .set({
            active: false,
            soldAt: new Date(),
            buyerWallet: ctx.user.walletAddress,
          })
          .where(eq(marketplaceListings.id, input.listingId));

        // Update buyer balance
        await db
          .update(users)
          .set({
            museumBalance: sql`${users.museumBalance} - ${listingData.price}`,
          })
          .where(eq(users.id, ctx.user.id));

        // Update seller balance
        const seller = await db
          .select()
          .from(users)
          .where(eq(users.walletAddress, listingData.sellerWallet))
          .limit(1);

        if (seller.length > 0) {
          await db
            .update(users)
            .set({
              museumBalance: sql`${users.museumBalance} + ${listingData.price}`,
            })
            .where(eq(users.id, seller[0].id));
        }

        return {
          success: true,
          message: "Artwork purchased successfully",
        };
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }
        console.error("[Marketplace] Failed to buy:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to purchase artwork",
        });
      }
    }),

  /**
   * Cancel a marketplace listing
   */
  cancel: protectedProcedure
    .input(
      z.object({
        listingId: z.number().positive(),
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

      if (!ctx.user.walletAddress) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Wallet not connected",
        });
      }

      try {
        // Get listing
        const listing = await db
          .select()
          .from(marketplaceListings)
          .where(eq(marketplaceListings.id, input.listingId))
          .limit(1);

        if (listing.length === 0) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Listing not found",
          });
        }

        const listingData = listing[0];

        if (listingData.sellerWallet !== ctx.user.walletAddress) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "You can only cancel your own listings",
          });
        }

        if (!listingData.active) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Listing is already inactive",
          });
        }

        // Cancel listing
        await db
          .update(marketplaceListings)
          .set({ active: false })
          .where(eq(marketplaceListings.id, input.listingId));

        return {
          success: true,
          message: "Listing cancelled successfully",
        };
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }
        console.error("[Marketplace] Failed to cancel:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to cancel listing",
        });
      }
    }),
});

