import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";

type PoolType = "flexible" | "30gg" | "90gg" | "180gg" | "365gg";

const POOL_INFO = {
  flexible: { name: "Flexible", icon: "🔄" },
  "30gg": { name: "30 Days", icon: "📅" },
  "90gg": { name: "90 Days", icon: "📆" },
  "180gg": { name: "180 Days", icon: "🗓️" },
  "365gg": { name: "365 Days", icon: "📅" },
};

export default function Staking() {
  const [, setLocation] = useLocation();
  const [stakeModalOpen, setStakeModalOpen] = useState(false);
  const [unstakeModalOpen, setUnstakeModalOpen] = useState(false);
  const [selectedPool, setSelectedPool] = useState<PoolType | null>(null);
  const [stakeAmount, setStakeAmount] = useState("");
  const [understoodPenalty, setUnderstoodPenalty] = useState(false);

  // Queries
  const { data: poolStats, isLoading: poolStatsLoading } = trpc.staking.getPoolStats.useQuery();
  const { data: rewards } = trpc.staking.getRewards.useQuery();

  // Mutations
  const stakeMutation = trpc.staking.stake.useMutation({
    onSuccess: () => {
      alert("Staked successfully!");
      setStakeModalOpen(false);
      setStakeAmount("");
      setSelectedPool(null);
    },
    onError: (error) => {
      alert(`Failed to stake: ${error.message}`);
    },
  });

  const unstakeMutation = trpc.staking.unstake.useMutation({
    onSuccess: (data) => {
      alert(
        `Unstaked successfully!\nReturned: ${data.totalReturn} $MUSEUM\nRewards: ${data.rewards} $MUSEUM\nPenalty: ${data.penalty} $MUSEUM`
      );
      setUnstakeModalOpen(false);
      setSelectedPool(null);
      setUnderstoodPenalty(false);
    },
    onError: (error) => {
      alert(`Failed to unstake: ${error.message}`);
    },
  });

  const claimMutation = trpc.staking.claimRewards.useMutation({
    onSuccess: (data) => {
      alert(`Claimed ${data.rewards} $MUSEUM successfully!`);
    },
    onError: (error) => {
      alert(`Failed to claim: ${error.message}`);
    },
  });

  function handleOpenStakeModal(pool: PoolType) {
    setSelectedPool(pool);
    setStakeModalOpen(true);
  }

  function handleOpenUnstakeModal(pool: PoolType) {
    setSelectedPool(pool);
    setUnstakeModalOpen(true);
  }

  function handleStake() {
    if (!selectedPool || !stakeAmount) {
      alert("Please enter an amount");
      return;
    }

    const amount = parseFloat(stakeAmount);
    if (isNaN(amount) || amount <= 0) {
      alert("Please enter a valid amount");
      return;
    }

    stakeMutation.mutate({
      amount,
      pool: selectedPool,
    });
  }

  function handleUnstake() {
    if (!selectedPool) return;

    const poolRewards = rewards;
    if (poolRewards && !poolRewards.canUnstakeWithoutPenalty && !understoodPenalty) {
      alert("Please confirm that you understand the early unstake penalty");
      return;
    }

    unstakeMutation.mutate({ pool: selectedPool });
  }

  function handleClaimRewards() {
    if (confirm("Claim your staking rewards?")) {
      claimMutation.mutate();
    }
  }

  const selectedPoolStats = poolStats?.find((p) => p.pool === selectedPool);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-black to-purple-900 text-white p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold mb-2">💰 Staking</h1>
            <p className="text-gray-400">Stake $MUSEUM tokens to earn rewards</p>
          </div>
          <Button onClick={() => setLocation("/")} variant="outline" className="border-purple-500/50">
            ← Back
          </Button>
        </div>

        {/* Rewards Summary */}
        {rewards && rewards.pool !== "none" && (
          <Card className="bg-gradient-to-r from-purple-800/50 to-pink-800/50 border-purple-500/50 mb-8">
            <CardHeader>
              <CardTitle className="text-2xl">Your Active Stake</CardTitle>
              <CardDescription className="text-gray-300">
                Pool: {POOL_INFO[rewards.pool as PoolType].name}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-gray-400 text-sm">Staked Amount</p>
                  <p className="text-2xl font-bold">{rewards.stakedAmount} $MUSEUM</p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Current Rewards</p>
                  <p className="text-2xl font-bold text-yellow-400">{rewards.rewards} $MUSEUM</p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Days Staked</p>
                  <p className="text-2xl font-bold">{rewards.daysStaked} / {rewards.lockDays}</p>
                </div>
                <div className="flex items-end gap-2">
                  <Button
                    onClick={handleClaimRewards}
                    className="bg-yellow-600 hover:bg-yellow-700"
                    disabled={rewards.rewards <= 0 || claimMutation.isPending}
                  >
                    {claimMutation.isPending ? "Claiming..." : "Claim Rewards"}
                  </Button>
                  <Button
                    onClick={() => handleOpenUnstakeModal(rewards.pool as PoolType)}
                    variant="outline"
                    className="border-red-500/50 text-red-400 hover:bg-red-900/30"
                  >
                    Unstake
                  </Button>
                </div>
              </div>
              {!rewards.canUnstakeWithoutPenalty && (
                <div className="mt-4 p-3 bg-red-900/30 border border-red-500/50 rounded">
                  <p className="text-sm text-red-300">
                    ⚠️ Early unstake penalty: {(rewards.penalty * 100).toFixed(0)}% of rewards will be lost
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Pool Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {poolStatsLoading ? (
            <div className="col-span-full text-center py-12">Loading pools...</div>
          ) : (
            poolStats?.map((pool) => (
              <Card
                key={pool.pool}
                className="bg-gray-800/50 border-purple-500/30 hover:border-purple-500 transition-all"
              >
                <CardHeader>
                  <div className="flex items-center justify-between mb-2">
                    <CardTitle className="text-2xl">
                      {POOL_INFO[pool.pool].icon} {POOL_INFO[pool.pool].name}
                    </CardTitle>
                    <Badge className="bg-purple-600 text-lg px-3 py-1">
                      {(pool.apy * 100).toFixed(0)}% APY
                    </Badge>
                  </div>
                  <CardDescription className="text-gray-400">
                    {pool.lockDays === 0 ? "No lock period" : `${pool.lockDays} days lock`}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-400">TVL:</span>
                      <span className="font-semibold">{pool.tvl.toLocaleString()} $MUSEUM</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Stakers:</span>
                      <span className="font-semibold">{pool.userCount}</span>
                    </div>
                    {pool.userStaked > 0 && (
                      <div className="flex justify-between">
                        <span className="text-gray-400">Your Stake:</span>
                        <span className="font-semibold text-yellow-400">
                          {pool.userStaked} $MUSEUM
                        </span>
                      </div>
                    )}
                    {pool.penalty > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400">Early Penalty:</span>
                        <span className="text-red-400">{(pool.penalty * 100).toFixed(0)}%</span>
                      </div>
                    )}
                    <Button
                      onClick={() => handleOpenStakeModal(pool.pool)}
                      className="w-full bg-purple-600 hover:bg-purple-700 mt-4"
                      disabled={pool.userStaked > 0}
                    >
                      {pool.userStaked > 0 ? "Already Staked" : "Stake"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Stake Modal */}
        <Dialog open={stakeModalOpen} onOpenChange={setStakeModalOpen}>
          <DialogContent className="bg-gray-900 text-white border-purple-500/50">
            <DialogHeader>
              <DialogTitle>
                Stake in {selectedPool && POOL_INFO[selectedPool].name} Pool
              </DialogTitle>
              <DialogDescription className="text-gray-400">
                {selectedPoolStats && (
                  <>
                    APY: {(selectedPoolStats.apy * 100).toFixed(0)}% |
                    Lock: {selectedPoolStats.lockDays === 0 ? "None" : `${selectedPoolStats.lockDays} days`}
                  </>
                )}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div>
                <Label>Amount ($MUSEUM)</Label>
                <Input
                  type="number"
                  value={stakeAmount}
                  onChange={(e) => setStakeAmount(e.target.value)}
                  placeholder="Enter amount..."
                  className="bg-gray-800 border-purple-500/50"
                />
              </div>
              {selectedPoolStats && stakeAmount && (
                <div className="p-3 bg-purple-900/30 border border-purple-500/50 rounded">
                  <p className="text-sm text-gray-300">
                    Estimated rewards after {selectedPoolStats.lockDays || 365} days:
                    <span className="font-bold text-yellow-400 ml-2">
                      {Math.floor(
                        parseFloat(stakeAmount) *
                          selectedPoolStats.apy *
                          ((selectedPoolStats.lockDays || 365) / 365)
                      )}{" "}
                      $MUSEUM
                    </span>
                  </p>
                </div>
              )}
              <Button
                onClick={handleStake}
                className="w-full bg-purple-600 hover:bg-purple-700"
                disabled={stakeMutation.isPending}
              >
                {stakeMutation.isPending ? "Staking..." : "Confirm Stake"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Unstake Modal */}
        <Dialog open={unstakeModalOpen} onOpenChange={setUnstakeModalOpen}>
          <DialogContent className="bg-gray-900 text-white border-purple-500/50">
            <DialogHeader>
              <DialogTitle>Unstake from {selectedPool && POOL_INFO[selectedPool].name} Pool</DialogTitle>
              <DialogDescription className="text-gray-400">
                Withdraw your staked tokens and rewards
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              {rewards && !rewards.canUnstakeWithoutPenalty && (
                <div className="p-4 bg-red-900/30 border border-red-500/50 rounded">
                  <p className="text-red-300 font-semibold mb-2">⚠️ Early Unstake Warning</p>
                  <p className="text-sm text-gray-300 mb-3">
                    You are unstaking before the lock period ends. You will lose{" "}
                    {(rewards.penalty * 100).toFixed(0)}% of your rewards.
                  </p>
                  <p className="text-sm text-gray-300 mb-3">
                    Estimated penalty: ~{Math.floor(rewards.rewards * rewards.penalty)} $MUSEUM
                  </p>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="understand"
                      checked={understoodPenalty}
                      onCheckedChange={(checked) => setUnderstoodPenalty(checked as boolean)}
                    />
                    <label htmlFor="understand" className="text-sm cursor-pointer">
                      I understand and accept the penalty
                    </label>
                  </div>
                </div>
              )}
              <Button
                onClick={handleUnstake}
                variant="destructive"
                className="w-full"
                disabled={unstakeMutation.isPending}
              >
                {unstakeMutation.isPending ? "Unstaking..." : "Confirm Unstake"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}

