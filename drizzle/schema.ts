import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, bigint, boolean } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
  
  // The Stoned Museum specific fields
  walletAddress: varchar("walletAddress", { length: 64 }).unique(),
  museumPassMint: varchar("museumPassMint", { length: 64 }).unique(),
  level: int("level").default(1).notNull(),
  xp: int("xp").default(0).notNull(),
  museumBalance: bigint("museumBalance", { mode: "number" }).default(0).notNull(),
  stonedBalance: bigint("stonedBalance", { mode: "number" }).default(0).notNull(),
  clanId: int("clanId"),
  stakingPool: mysqlEnum("stakingPool", ["none", "flexible", "30gg", "90gg", "180gg", "365gg"]).default("none").notNull(),
  stakingAmount: bigint("stakingAmount", { mode: "number" }).default(0).notNull(),
  stakingStartedAt: timestamp("stakingStartedAt"),
  hasGuardieElite: boolean("hasGuardieElite").default(false).notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Artworks (NFT Opere)
 * Rappresenta le opere NFT nel gioco con rarità e GP
 */
export const artworks = mysqlTable("artworks", {
  id: int("id").autoincrement().primaryKey(),
  mint: varchar("mint", { length: 64 }).notNull().unique(),
  name: text("name").notNull(),
  rarity: mysqlEnum("rarity", ["Common", "Rare", "Epic", "Legendary", "Mythic"]).notNull(),
  gp: int("gp").notNull(),
  imageUrl: text("imageUrl"),
  artist: text("artist"),
  description: text("description"),
  ownerWallet: varchar("ownerWallet", { length: 64 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Artwork = typeof artworks.$inferSelect;
export type InsertArtwork = typeof artworks.$inferInsert;

/**
 * Slots
 * Rappresenta gli slot del museo di ogni utente
 */
export const slots = mysqlTable("slots", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  slotNumber: int("slotNumber").notNull(),
  artworkMint: varchar("artworkMint", { length: 64 }),
  unlockedAt: timestamp("unlockedAt").defaultNow().notNull(),
});

export type Slot = typeof slots.$inferSelect;
export type InsertSlot = typeof slots.$inferInsert;

/**
 * Mining Rewards
 * Traccia i reward del mining passivo
 */
export const miningRewards = mysqlTable("miningRewards", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  amount: bigint("amount", { mode: "number" }).notNull(),
  claimed: boolean("claimed").default(false).notNull(),
  claimedAt: timestamp("claimedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type MiningReward = typeof miningRewards.$inferSelect;
export type InsertMiningReward = typeof miningRewards.$inferInsert;

/**
 * Marketplace Listings
 * Opere in vendita sul marketplace
 */
export const marketplaceListings = mysqlTable("marketplaceListings", {
  id: int("id").autoincrement().primaryKey(),
  artworkMint: varchar("artworkMint", { length: 64 }).notNull(),
  sellerWallet: varchar("sellerWallet", { length: 64 }).notNull(),
  price: bigint("price", { mode: "number" }).notNull(),
  active: boolean("active").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  expiresAt: timestamp("expiresAt").notNull(),
  soldAt: timestamp("soldAt"),
  buyerWallet: varchar("buyerWallet", { length: 64 }),
});

export type MarketplaceListing = typeof marketplaceListings.$inferSelect;
export type InsertMarketplaceListing = typeof marketplaceListings.$inferInsert;

/**
 * Clans
 * Sistema di clan per bonus mining
 */
export const clans = mysqlTable("clans", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 100 }).notNull().unique(),
  leaderWallet: varchar("leaderWallet", { length: 64 }).notNull(),
  memberCount: int("memberCount").default(1).notNull(),
  totalGp: int("totalGp").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Clan = typeof clans.$inferSelect;
export type InsertClan = typeof clans.$inferInsert;

/**
 * Quests
 * Sistema di quest giornaliere, settimanali e achievement
 */
export const quests = mysqlTable("quests", {
  id: int("id").autoincrement().primaryKey(),
  type: mysqlEnum("type", ["daily", "weekly", "achievement"]).notNull(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  rewardMuseum: int("rewardMuseum").default(0).notNull(),
  rewardXp: int("rewardXp").default(0).notNull(),
  rewardArtworkMint: varchar("rewardArtworkMint", { length: 64 }),
  requirement: text("requirement").notNull(),
  active: boolean("active").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Quest = typeof quests.$inferSelect;
export type InsertQuest = typeof quests.$inferInsert;

/**
 * User Quests
 * Traccia il progresso delle quest per ogni utente
 */
export const userQuests = mysqlTable("userQuests", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  questId: int("questId").notNull(),
  progress: int("progress").default(0).notNull(),
  completed: boolean("completed").default(false).notNull(),
  completedAt: timestamp("completedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type UserQuest = typeof userQuests.$inferSelect;
export type InsertUserQuest = typeof userQuests.$inferInsert;

/**
 * Conversions
 * Traccia le conversioni $MUSEUM → $STONED
 */
export const conversions = mysqlTable("conversions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  museumAmount: bigint("museumAmount", { mode: "number" }).notNull(),
  stonedAmount: bigint("stonedAmount", { mode: "number" }).notNull(),
  rate: int("rate").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Conversion = typeof conversions.$inferSelect;
export type InsertConversion = typeof conversions.$inferInsert;

/**
 * Transactions
 * Log di tutte le transazioni on-chain
 */
export const transactions = mysqlTable("transactions", {
  id: int("id").autoincrement().primaryKey(),
  signature: varchar("signature", { length: 128 }).notNull().unique(),
  type: mysqlEnum("type", ["entry_fee", "mint_pass", "mint_artwork", "marketplace_buy", "marketplace_sell", "claim_rewards", "convert_tokens", "stake", "unstake"]).notNull(),
  userId: int("userId").notNull(),
  amount: bigint("amount", { mode: "number" }),
  status: mysqlEnum("status", ["pending", "confirmed", "failed"]).default("pending").notNull(),
  metadata: text("metadata"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Transaction = typeof transactions.$inferSelect;
export type InsertTransaction = typeof transactions.$inferInsert;