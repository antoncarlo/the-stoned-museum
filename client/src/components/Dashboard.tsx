import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Button } from "./ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { gameService, type UserProfile, type ArtworkNFT } from "@/lib/gameService";
import { toast } from "sonner";

export default function Dashboard() {
  const { publicKey, connected } = useWallet();
  const [, setLocation] = useLocation();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [miningStats, setMiningStats] = useState(gameService.getMiningStats());

  useEffect(() => {
    if (connected && publicKey) {
      initializeUser();
    }
  }, [connected, publicKey]);

  useEffect(() => {
    // Aggiorna mining stats ogni 5 secondi
    const interval = setInterval(() => {
      setMiningStats(gameService.getMiningStats());
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  async function initializeUser() {
    if (!publicKey) return;

    setLoading(true);
    try {
      const userProfile = await gameService.initializeUser(publicKey);
      setProfile(userProfile);
    } catch (error) {
      console.error("Error initializing user:", error);
      toast.error("Failed to initialize user");
    } finally {
      setLoading(false);
    }
  }

  async function handlePurchasePass() {
    if (!publicKey) return;

    setLoading(true);
    try {
      await gameService.purchaseMuseumPass(publicKey);
      const updatedProfile = gameService.getUserProfile();
      setProfile(updatedProfile);
      toast.success("Museum Pass purchased! Welcome to The Stoned Museum");
    } catch (error) {
      console.error("Error purchasing pass:", error);
      toast.error("Failed to purchase Museum Pass");
    } finally {
      setLoading(false);
    }
  }

  async function handleClaimRewards() {
    setLoading(true);
    try {
      const amount = await gameService.claimRewards();
      const updatedProfile = gameService.getUserProfile();
      setProfile(updatedProfile);
      setMiningStats(gameService.getMiningStats());
      toast.success(`Claimed ${amount} $MUSEUM!`);
    } catch (error) {
      console.error("Error claiming rewards:", error);
      toast.error("Failed to claim rewards");
    } finally {
      setLoading(false);
    }
  }

  async function handleUnlockSlot() {
    const cost = gameService.getNextSlotCost();
    
    setLoading(true);
    try {
      const success = await gameService.unlockSlot(cost);
      if (success) {
        const updatedProfile = gameService.getUserProfile();
        setProfile(updatedProfile);
        toast.success(`Slot unlocked! Cost: ${cost} $MUSEUM`);
      } else {
        toast.error("Not enough $MUSEUM to unlock slot");
      }
    } catch (error) {
      console.error("Error unlocking slot:", error);
      toast.error("Failed to unlock slot");
    } finally {
      setLoading(false);
    }
  }

  if (!connected) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-950 via-black to-pink-950">
        <Card className="w-96 bg-black/50 border-purple-500/50 backdrop-blur">
          <CardHeader>
            <CardTitle className="text-3xl bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              The Stoned Museum
            </CardTitle>
            <CardDescription className="text-gray-300">
              Connect your Solana wallet to enter
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            <WalletMultiButton />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loading && !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-950 via-black to-pink-950">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  if (!profile?.hasMuseumPass) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-950 via-black to-pink-950 p-4">
        <Card className="w-full max-w-2xl bg-black/50 border-purple-500/50 backdrop-blur">
          <CardHeader>
            <CardTitle className="text-4xl bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              Welcome to The Stoned Museum
            </CardTitle>
            <CardDescription className="text-gray-300 text-lg mt-4">
              Purchase your Museum Pass NFT to enter the Louvre and start mining $MUSEUM tokens
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="bg-gradient-to-r from-purple-900/50 to-pink-900/50 p-6 rounded-lg border border-purple-500/30">
              <h3 className="text-2xl font-bold text-white mb-4">Museum Pass Benefits</h3>
              <ul className="space-y-2 text-gray-300">
                <li>✨ Access to the 3D Louvre Museum</li>
                <li>🎨 Collect and display NFT artworks</li>
                <li>⛏️ Mine $MUSEUM tokens passively (24/7)</li>
                <li>💎 Convert $MUSEUM to $STONED</li>
                <li>🏆 Stake for bonus mining rewards</li>
                <li>🎯 Complete quests and join clans</li>
              </ul>
            </div>

            <div className="flex items-center justify-between p-4 bg-purple-900/30 rounded-lg border border-purple-500/30">
              <div>
                <p className="text-gray-400">Entry Fee</p>
                <p className="text-3xl font-bold text-white">0.8 SOL</p>
              </div>
              <Button
                onClick={handlePurchasePass}
                disabled={loading}
                size="lg"
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
              >
                {loading ? "Processing..." : "Purchase Museum Pass"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-950 via-black to-pink-950 p-4">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-6">
        <div className="flex items-center justify-between">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            The Stoned Museum
          </h1>
          <WalletMultiButton />
        </div>
      </div>

      {/* Stats Cards */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card className="bg-black/50 border-purple-500/50 backdrop-blur">
          <CardHeader className="pb-2">
            <CardDescription className="text-gray-400">Level</CardDescription>
            <CardTitle className="text-3xl text-purple-400">{profile.level}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-500">{profile.xp} XP</p>
          </CardContent>
        </Card>

        <Card className="bg-black/50 border-purple-500/50 backdrop-blur">
          <CardHeader className="pb-2">
            <CardDescription className="text-gray-400">$MUSEUM</CardDescription>
            <CardTitle className="text-3xl text-yellow-400">
              {profile.museumBalance.toLocaleString()}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-500">Internal Token</p>
          </CardContent>
        </Card>

        <Card className="bg-black/50 border-purple-500/50 backdrop-blur">
          <CardHeader className="pb-2">
            <CardDescription className="text-gray-400">$STONED</CardDescription>
            <CardTitle className="text-3xl text-green-400">
              {profile.stonedBalance.toFixed(2)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-500">Tradable Token</p>
          </CardContent>
        </Card>

        <Card className="bg-black/50 border-purple-500/50 backdrop-blur">
          <CardHeader className="pb-2">
            <CardDescription className="text-gray-400">Total GP</CardDescription>
            <CardTitle className="text-3xl text-pink-400">{miningStats.totalGP}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-500">
              {miningStats.hourlyRate.toFixed(0)} $MUSEUM/hr
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Mining Section */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <Card className="lg:col-span-2 bg-black/50 border-purple-500/50 backdrop-blur">
          <CardHeader>
            <CardTitle className="text-2xl text-white">Mining Dashboard</CardTitle>
            <CardDescription>Passive income from your artworks</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-purple-900/30 rounded-lg border border-purple-500/30">
                <p className="text-gray-400 text-sm">Pending Rewards</p>
                <p className="text-2xl font-bold text-yellow-400">
                  {miningStats.pendingRewards.toLocaleString()} $MUSEUM
                </p>
              </div>
              <div className="p-4 bg-purple-900/30 rounded-lg border border-purple-500/30">
                <p className="text-gray-400 text-sm">Hourly Rate</p>
                <p className="text-2xl font-bold text-green-400">
                  {miningStats.hourlyRate.toFixed(0)} $MUSEUM
                </p>
              </div>
            </div>

            <Button
              onClick={handleClaimRewards}
              disabled={loading || miningStats.pendingRewards === 0}
              className="w-full bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-700 hover:to-orange-700"
              size="lg"
            >
              Claim Rewards
            </Button>

            {profile.stakingPool && (
              <div className="p-4 bg-green-900/30 rounded-lg border border-green-500/30">
                <p className="text-green-400 font-semibold mb-2">
                  🎯 Staking Active: +{profile.stakingPool.bonus}% Mining Bonus
                </p>
                <p className="text-sm text-gray-400">
                  {profile.stakingPool.stakedAmount} $STONED staked ({profile.stakingPool.duration})
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="bg-black/50 border-purple-500/50 backdrop-blur">
          <CardHeader>
            <CardTitle className="text-xl text-white">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button 
              variant="outline" 
              className="w-full justify-start border-purple-500/50 text-white hover:bg-purple-900/30"
              onClick={() => setLocation("/museum")}
            >
              🏛️ Enter Museum (3D)
            </Button>
            <Button variant="outline" className="w-full justify-start border-purple-500/50 text-white hover:bg-purple-900/30">
              🛒 Marketplace
            </Button>
            <Button variant="outline" className="w-full justify-start border-purple-500/50 text-white hover:bg-purple-900/30">
              💎 Staking
            </Button>
            <Button variant="outline" className="w-full justify-start border-purple-500/50 text-white hover:bg-purple-900/30">
              🎯 Quests
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Slots Section */}
      <div className="max-w-7xl mx-auto">
        <Card className="bg-black/50 border-purple-500/50 backdrop-blur">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-2xl text-white">Artwork Slots</CardTitle>
                <CardDescription>
                  {profile.slots.length}/10 slots unlocked
                </CardDescription>
              </div>
              {profile.slots.length < 10 && (
                <Button
                  onClick={handleUnlockSlot}
                  disabled={loading}
                  className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                >
                  Unlock Slot ({gameService.getNextSlotCost()} $MUSEUM)
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {profile.slots.map((slot) => (
                <div
                  key={slot.slotNumber}
                  className="aspect-square border-2 border-dashed border-purple-500/50 rounded-lg flex items-center justify-center bg-purple-900/20 hover:bg-purple-900/30 transition-colors cursor-pointer"
                >
                  {slot.artwork ? (
                    <div className="text-center p-2">
                      <div className="w-full h-20 bg-gradient-to-br from-purple-500 to-pink-500 rounded mb-2"></div>
                      <p className="text-xs font-semibold text-white truncate">
                        {slot.artwork.name}
                      </p>
                      <p className="text-xs text-gray-400">{slot.artwork.gp} GP</p>
                    </div>
                  ) : (
                    <div className="text-center">
                      <p className="text-4xl text-purple-500/50">+</p>
                      <p className="text-xs text-gray-500 mt-2">Empty Slot</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

