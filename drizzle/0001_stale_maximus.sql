CREATE TABLE `artworks` (
	`id` int AUTO_INCREMENT NOT NULL,
	`mint` varchar(64) NOT NULL,
	`name` text NOT NULL,
	`rarity` enum('Common','Rare','Epic','Legendary','Mythic') NOT NULL,
	`gp` int NOT NULL,
	`imageUrl` text,
	`artist` text,
	`description` text,
	`ownerWallet` varchar(64),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `artworks_id` PRIMARY KEY(`id`),
	CONSTRAINT `artworks_mint_unique` UNIQUE(`mint`)
);
--> statement-breakpoint
CREATE TABLE `clans` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(100) NOT NULL,
	`leaderWallet` varchar(64) NOT NULL,
	`memberCount` int NOT NULL DEFAULT 1,
	`totalGp` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `clans_id` PRIMARY KEY(`id`),
	CONSTRAINT `clans_name_unique` UNIQUE(`name`)
);
--> statement-breakpoint
CREATE TABLE `conversions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`museumAmount` bigint NOT NULL,
	`stonedAmount` bigint NOT NULL,
	`rate` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `conversions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `marketplaceListings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`artworkMint` varchar(64) NOT NULL,
	`sellerWallet` varchar(64) NOT NULL,
	`price` bigint NOT NULL,
	`active` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`expiresAt` timestamp NOT NULL,
	`soldAt` timestamp,
	`buyerWallet` varchar(64),
	CONSTRAINT `marketplaceListings_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `miningRewards` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`amount` bigint NOT NULL,
	`claimed` boolean NOT NULL DEFAULT false,
	`claimedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `miningRewards_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `quests` (
	`id` int AUTO_INCREMENT NOT NULL,
	`type` enum('daily','weekly','achievement') NOT NULL,
	`title` text NOT NULL,
	`description` text NOT NULL,
	`rewardMuseum` int NOT NULL DEFAULT 0,
	`rewardXp` int NOT NULL DEFAULT 0,
	`rewardArtworkMint` varchar(64),
	`requirement` text NOT NULL,
	`active` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `quests_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `slots` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`slotNumber` int NOT NULL,
	`artworkMint` varchar(64),
	`unlockedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `slots_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `transactions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`signature` varchar(128) NOT NULL,
	`type` enum('entry_fee','mint_pass','mint_artwork','marketplace_buy','marketplace_sell','claim_rewards','convert_tokens','stake','unstake') NOT NULL,
	`userId` int NOT NULL,
	`amount` bigint,
	`status` enum('pending','confirmed','failed') NOT NULL DEFAULT 'pending',
	`metadata` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `transactions_id` PRIMARY KEY(`id`),
	CONSTRAINT `transactions_signature_unique` UNIQUE(`signature`)
);
--> statement-breakpoint
CREATE TABLE `userQuests` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`questId` int NOT NULL,
	`progress` int NOT NULL DEFAULT 0,
	`completed` boolean NOT NULL DEFAULT false,
	`completedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `userQuests_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `users` ADD `walletAddress` varchar(64);--> statement-breakpoint
ALTER TABLE `users` ADD `museumPassMint` varchar(64);--> statement-breakpoint
ALTER TABLE `users` ADD `level` int DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `xp` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `museumBalance` bigint DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `stonedBalance` bigint DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `clanId` int;--> statement-breakpoint
ALTER TABLE `users` ADD `stakingPool` enum('none','flexible','30gg','90gg','180gg','365gg') DEFAULT 'none' NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `stakingAmount` bigint DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `stakingStartedAt` timestamp;--> statement-breakpoint
ALTER TABLE `users` ADD `hasGuardieElite` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD CONSTRAINT `users_walletAddress_unique` UNIQUE(`walletAddress`);--> statement-breakpoint
ALTER TABLE `users` ADD CONSTRAINT `users_museumPassMint_unique` UNIQUE(`museumPassMint`);