import { PublicKey } from "@solana/web3.js";

/**
 * Game Service per The Stoned Museum
 * Implementazione simulata pronta per integrazione Honeycomb
 */

export interface ArtworkNFT {
  id: string;
  mint: string;
  name: string;
  artist: string;
  rarity: "Common" | "Rare" | "Epic" | "Legendary" | "Mythic";
  gp: number;
  imageUrl: string;
  description: string;
}

export interface UserSlot {
  slotNumber: number;
  artwork: ArtworkNFT | null;
  unlockedAt: number;
}

export interface MiningStats {
  totalGP: number;
  hourlyRate: number;
  lastClaimed: number;
  pendingRewards: number;
}

export interface StakingPool {
  duration: "flexible" | "30gg" | "90gg" | "180gg" | "365gg";
  bonus: number;
  stakedAmount: number;
  startedAt?: number;
}

export interface UserProfile {
  walletAddress: string;
  hasMuseumPass: boolean;
  level: number;
  xp: number;
  museumBalance: number;
  stonedBalance: number;
  slots: UserSlot[];
  stakingPool: StakingPool | null;
}

// Mock data per demo
const MOCK_ARTWORKS: ArtworkNFT[] = [
  {
    id: "1",
    mint: "mock_mint_1",
    name: "Crypto Mona Lisa",
    artist: "Beeple",
    rarity: "Mythic",
    gp: 2000,
    imageUrl: "/placeholder-art.png",
    description: "A digital reimagining of the iconic masterpiece",
  },
  {
    id: "2",
    mint: "mock_mint_2",
    name: "Solana Sunrise",
    artist: "Pak",
    rarity: "Legendary",
    gp: 400,
    imageUrl: "/placeholder-art.png",
    description: "Abstract representation of blockchain dawn",
  },
  {
    id: "3",
    mint: "mock_mint_3",
    name: "NFT Revolution",
    artist: "XCOPY",
    rarity: "Epic",
    gp: 100,
    imageUrl: "/placeholder-art.png",
    description: "Glitchy art celebrating the NFT movement",
  },
];

class GameService {
  private userProfile: UserProfile | null = null;

  /**
   * Inizializza profilo utente
   */
  async initializeUser(walletAddress: PublicKey): Promise<UserProfile> {
    // Simula caricamento da database/blockchain
    this.userProfile = {
      walletAddress: walletAddress.toString(),
      hasMuseumPass: false,
      level: 1,
      xp: 0,
      museumBalance: 0,
      stonedBalance: 0,
      slots: [
        { slotNumber: 1, artwork: null, unlockedAt: Date.now() },
        { slotNumber: 2, artwork: null, unlockedAt: Date.now() },
        { slotNumber: 3, artwork: null, unlockedAt: Date.now() },
      ],
      stakingPool: null,
    };

    return this.userProfile;
  }

  /**
   * Acquista Museum Pass (0.8 SOL)
   */
  async purchaseMuseumPass(walletAddress: PublicKey): Promise<boolean> {
    // TODO: Implementare transazione Solana reale
    console.log("Purchasing Museum Pass for", walletAddress.toString());
    
    if (this.userProfile) {
      this.userProfile.hasMuseumPass = true;
    }
    
    return true;
  }

  /**
   * Ottieni opere disponibili nel marketplace
   */
  async getMarketplaceArtworks(): Promise<ArtworkNFT[]> {
    // TODO: Query da Honeycomb/blockchain
    return MOCK_ARTWORKS;
  }

  /**
   * Acquista opera NFT
   */
  async purchaseArtwork(artworkId: string, price: number): Promise<ArtworkNFT | null> {
    // TODO: Implementare transazione
    const artwork = MOCK_ARTWORKS.find((a) => a.id === artworkId);
    return artwork || null;
  }

  /**
   * Equipaggia opera in uno slot
   */
  async equipArtwork(slotNumber: number, artwork: ArtworkNFT): Promise<boolean> {
    if (!this.userProfile) return false;

    const slot = this.userProfile.slots.find((s) => s.slotNumber === slotNumber);
    if (!slot) return false;

    slot.artwork = artwork;
    return true;
  }

  /**
   * Rimuovi opera da slot
   */
  async unequipArtwork(slotNumber: number): Promise<boolean> {
    if (!this.userProfile) return false;

    const slot = this.userProfile.slots.find((s) => s.slotNumber === slotNumber);
    if (!slot) return false;

    slot.artwork = null;
    return true;
  }

  /**
   * Sblocca nuovo slot (costa XP o $MUSEUM)
   */
  async unlockSlot(cost: number): Promise<boolean> {
    if (!this.userProfile || this.userProfile.museumBalance < cost) return false;

    const nextSlotNumber = this.userProfile.slots.length + 1;
    if (nextSlotNumber > 10) return false; // Max 10 slot

    this.userProfile.slots.push({
      slotNumber: nextSlotNumber,
      artwork: null,
      unlockedAt: Date.now(),
    });

    this.userProfile.museumBalance -= cost;
    return true;
  }

  /**
   * Calcola statistiche mining
   */
  getMiningStats(): MiningStats {
    if (!this.userProfile) {
      return {
        totalGP: 0,
        hourlyRate: 0,
        lastClaimed: Date.now(),
        pendingRewards: 0,
      };
    }

    const totalGP = this.userProfile.slots
      .filter((s) => s.artwork)
      .reduce((sum, s) => sum + (s.artwork?.gp || 0), 0);

    const stakingBonus = this.userProfile.stakingPool?.bonus || 0;
    const baseRate = totalGP * 10; // 10 $MUSEUM per GP per ora
    const hourlyRate = baseRate * (1 + stakingBonus / 100);

    // Simula pending rewards (in un'app reale, calcolare da lastClaimed)
    const hoursElapsed = 2; // Mock
    const pendingRewards = Math.floor(hourlyRate * hoursElapsed);

    return {
      totalGP,
      hourlyRate,
      lastClaimed: Date.now() - hoursElapsed * 3600000,
      pendingRewards,
    };
  }

  /**
   * Claim mining rewards
   */
  async claimRewards(): Promise<number> {
    if (!this.userProfile) return 0;

    const stats = this.getMiningStats();
    this.userProfile.museumBalance += stats.pendingRewards;

    return stats.pendingRewards;
  }

  /**
   * Converti $MUSEUM in $STONED
   */
  async convertTokens(museumAmount: number): Promise<number> {
    if (!this.userProfile || this.userProfile.museumBalance < museumAmount) {
      return 0;
    }

    const conversionRate = 1000; // 1000 $MUSEUM = 1 $STONED
    const stonedAmount = museumAmount / conversionRate;

    this.userProfile.museumBalance -= museumAmount;
    this.userProfile.stonedBalance += stonedAmount;

    return stonedAmount;
  }

  /**
   * Stake $STONED in un pool
   */
  async stakeTokens(
    amount: number,
    duration: StakingPool["duration"]
  ): Promise<boolean> {
    if (!this.userProfile || this.userProfile.stonedBalance < amount) {
      return false;
    }

    const bonusMap = {
      flexible: 15,
      "30gg": 30,
      "90gg": 60,
      "180gg": 120,
      "365gg": 250,
    };

    this.userProfile.stakingPool = {
      duration,
      bonus: bonusMap[duration],
      stakedAmount: amount,
      startedAt: Date.now(),
    };

    this.userProfile.stonedBalance -= amount;
    return true;
  }

  /**
   * Unstake $STONED
   */
  async unstakeTokens(): Promise<number> {
    if (!this.userProfile || !this.userProfile.stakingPool) {
      return 0;
    }

    const amount = this.userProfile.stakingPool.stakedAmount;
    this.userProfile.stonedBalance += amount;
    this.userProfile.stakingPool = null;

    return amount;
  }

  /**
   * Ottieni profilo corrente
   */
  getUserProfile(): UserProfile | null {
    return this.userProfile;
  }

  /**
   * Calcola costo per sbloccare prossimo slot
   */
  getNextSlotCost(): number {
    if (!this.userProfile) return 0;
    
    const slotCount = this.userProfile.slots.length;
    // Costo aumenta esponenzialmente: 1000, 2500, 5000, 10000, ...
    return Math.floor(1000 * Math.pow(2, slotCount - 3));
  }

  /**
   * Aggiungi XP e gestisci level up
   */
  addXP(amount: number): boolean {
    if (!this.userProfile) return false;

    this.userProfile.xp += amount;
    
    // Level up ogni 1000 XP
    const newLevel = Math.floor(this.userProfile.xp / 1000) + 1;
    if (newLevel > this.userProfile.level) {
      this.userProfile.level = newLevel;
      return true; // Level up!
    }

    return false;
  }
}

export const gameService = new GameService();

