import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type RarityType = "Common" | "Rare" | "Epic" | "Legendary" | "Mythic";

export default function Inventory() {
  const [, setLocation] = useLocation();
  const [selectedArtwork, setSelectedArtwork] = useState<any>(null);
  const [rarityFilter, setRarityFilter] = useState<RarityType | "all">("all");
  const [sortBy, setSortBy] = useState<"gp" | "rarity" | "recent">("recent");
  const [slotFilter, setSlotFilter] = useState<"all" | "in-slot" | "not-in-slot">("all");
  const [assignSlotModalOpen, setAssignSlotModalOpen] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<string>("");

  // Queries
  const { data: userArtworks, isLoading: artworksLoading } = trpc.artworks.getUserArtworks.useQuery({});
  const { data: userSlots, isLoading: slotsLoading } = trpc.slots.getUserSlots.useQuery({});
  const { data: miningRate } = trpc.mining.getMiningRate.useQuery();

  // Mutations
  const assignMutation = trpc.slots.assignArtwork.useMutation({
    onSuccess: () => {
      alert("Artwork assigned to slot successfully!");
      setAssignSlotModalOpen(false);
      setSelectedArtwork(null);
      setSelectedSlot("");
    },
    onError: (error) => {
      alert(`Failed to assign: ${error.message}`);
    },
  });

  const removeMutation = trpc.slots.removeArtwork.useMutation({
    onSuccess: () => {
      alert("Artwork removed from slot successfully!");
    },
    onError: (error) => {
      alert(`Failed to remove: ${error.message}`);
    },
  });

  // Filter and sort artworks
  let filteredArtworks = userArtworks || [];

  // Apply rarity filter
  if (rarityFilter !== "all") {
    filteredArtworks = filteredArtworks.filter((a) => a.rarity === rarityFilter);
  }

  // Apply slot filter
  const artworksInSlots = userSlots?.filter((s) => s.artworkMint).map((s) => s.artworkMint) || [];
  if (slotFilter === "in-slot") {
    filteredArtworks = filteredArtworks.filter((a) => artworksInSlots.includes(a.mint));
  } else if (slotFilter === "not-in-slot") {
    filteredArtworks = filteredArtworks.filter((a) => !artworksInSlots.includes(a.mint));
  }

  // Sort artworks
  filteredArtworks = [...filteredArtworks].sort((a, b) => {
    if (sortBy === "gp") {
      return b.gp - a.gp;
    } else if (sortBy === "rarity") {
      const rarityOrder = { Mythic: 5, Legendary: 4, Epic: 3, Rare: 2, Common: 1 };
      return rarityOrder[b.rarity as keyof typeof rarityOrder] - rarityOrder[a.rarity as keyof typeof rarityOrder];
    } else {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    }
  });

  function handleOpenAssignModal(artwork: any) {
    setSelectedArtwork(artwork);
    setAssignSlotModalOpen(true);
  }

  function handleAssignToSlot() {
    if (!selectedArtwork || !selectedSlot) {
      alert("Please select a slot");
      return;
    }

    assignMutation.mutate({
      slotNumber: parseInt(selectedSlot),
      artworkMint: selectedArtwork.mint,
    });
  }

  function handleRemoveFromSlot(slotNumber: number) {
    if (confirm("Remove artwork from this slot?")) {
      removeMutation.mutate({ slotNumber });
    }
  }

  // Get available slots (empty slots)
  const availableSlots = userSlots?.filter((s) => !s.artworkMint) || [];
  const occupiedSlots = userSlots?.filter((s) => s.artworkMint) || [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-black to-purple-900 text-white p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold mb-2">🎨 Inventory</h1>
            <p className="text-gray-400">Manage your NFT collection and museum slots</p>
          </div>
          <Button onClick={() => setLocation("/")} variant="outline" className="border-purple-500/50">
            ← Back
          </Button>
        </div>

        {/* Mining Rate Summary */}
        {miningRate && (
          <Card className="bg-gradient-to-r from-green-800/50 to-emerald-800/50 border-green-500/50 mb-8">
            <CardHeader>
              <CardTitle className="text-2xl">⛏️ Mining Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-gray-300 text-sm">Hourly Mining Rate</p>
                  <p className="text-3xl font-bold text-yellow-400">{miningRate.hourlyRate} $MUSEUM/h</p>
                </div>
                <div>
                  <p className="text-gray-300 text-sm">Artworks in Slots</p>
                  <p className="text-3xl font-bold">{miningRate.artworksCount}</p>
                </div>
                <div>
                  <p className="text-gray-300 text-sm">Level Bonus</p>
                  <p className="text-3xl font-bold text-green-400">+{((miningRate.levelBonus - 1) * 100).toFixed(0)}%</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <Tabs defaultValue="collection" className="w-full">
          <TabsList className="bg-gray-800/50 border border-purple-500/30">
            <TabsTrigger value="collection">My Collection</TabsTrigger>
            <TabsTrigger value="slots">Museum Slots</TabsTrigger>
          </TabsList>

          <TabsContent value="collection" className="mt-6">
            {/* Filters */}
            <div className="flex gap-4 mb-6">
              <Select value={rarityFilter} onValueChange={(v) => setRarityFilter(v as RarityType | "all")}>
                <SelectTrigger className="w-48 bg-gray-800 border-purple-500/50">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-purple-500/50">
                  <SelectItem value="all">All Rarities</SelectItem>
                  <SelectItem value="Common">Common</SelectItem>
                  <SelectItem value="Rare">Rare</SelectItem>
                  <SelectItem value="Epic">Epic</SelectItem>
                  <SelectItem value="Legendary">Legendary</SelectItem>
                  <SelectItem value="Mythic">Mythic</SelectItem>
                </SelectContent>
              </Select>
              <Select value={slotFilter} onValueChange={(v) => setSlotFilter(v as any)}>
                <SelectTrigger className="w-48 bg-gray-800 border-purple-500/50">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-purple-500/50">
                  <SelectItem value="all">All Artworks</SelectItem>
                  <SelectItem value="in-slot">In Slot</SelectItem>
                  <SelectItem value="not-in-slot">Not in Slot</SelectItem>
                </SelectContent>
              </Select>
              <Select value={sortBy} onValueChange={(v) => setSortBy(v as any)}>
                <SelectTrigger className="w-48 bg-gray-800 border-purple-500/50">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-purple-500/50">
                  <SelectItem value="recent">Most Recent</SelectItem>
                  <SelectItem value="gp">GP: High to Low</SelectItem>
                  <SelectItem value="rarity">Rarity: High to Low</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Artworks Grid */}
            {artworksLoading ? (
              <div className="text-center py-12">Loading collection...</div>
            ) : filteredArtworks.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredArtworks.map((artwork) => {
                  const isInSlot = artworksInSlots.includes(artwork.mint);
                  const slotNumber = userSlots?.find((s) => s.artworkMint === artwork.mint)?.slotNumber;

                  return (
                    <Card
                      key={artwork.mint}
                      className="bg-gray-800/50 border-purple-500/30 hover:border-purple-500 transition-all"
                    >
                      <CardHeader>
                        <div className="flex justify-between items-start mb-2">
                          <CardTitle className="text-lg">{artwork.name}</CardTitle>
                          <Badge className={getRarityColor(artwork.rarity)}>
                            {artwork.rarity}
                          </Badge>
                        </div>
                        <CardDescription className="text-gray-400">
                          by {artwork.artist || "Unknown"}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-gray-400">GP:</span>
                            <span className="font-semibold">{artwork.gp}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-400">Mining Rate:</span>
                            <span className="font-semibold text-green-400">
                              {calculateMiningRate(artwork.gp, artwork.rarity, miningRate?.levelBonus || 1)} $MUSEUM/h
                            </span>
                          </div>
                          {isInSlot && (
                            <div className="p-2 bg-green-900/30 border border-green-500/50 rounded text-sm">
                              <span className="text-green-400">✓ In Slot #{slotNumber}</span>
                            </div>
                          )}
                          <div className="flex gap-2 mt-4">
                            {isInSlot ? (
                              <Button
                                onClick={() => handleRemoveFromSlot(slotNumber!)}
                                variant="outline"
                                className="flex-1 border-red-500/50 text-red-400 hover:bg-red-900/30"
                                disabled={removeMutation.isPending}
                              >
                                {removeMutation.isPending ? "Removing..." : "Remove"}
                              </Button>
                            ) : (
                              <Button
                                onClick={() => handleOpenAssignModal(artwork)}
                                className="flex-1 bg-purple-600 hover:bg-purple-700"
                                disabled={availableSlots.length === 0}
                              >
                                {availableSlots.length === 0 ? "No Slots" : "Assign to Slot"}
                              </Button>
                            )}
                            <Button
                              onClick={() => setSelectedArtwork(artwork)}
                              variant="outline"
                              className="border-purple-500/50"
                            >
                              Details
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12 text-gray-400">
                No artworks found. Try adjusting your filters.
              </div>
            )}
          </TabsContent>

          <TabsContent value="slots" className="mt-6">
            {slotsLoading ? (
              <div className="text-center py-12">Loading slots...</div>
            ) : (
              <>
                {/* Occupied Slots */}
                <div className="mb-8">
                  <h2 className="text-2xl font-bold mb-4">🖼️ Occupied Slots ({occupiedSlots.length})</h2>
                  {occupiedSlots.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                      {occupiedSlots.map((slot) => (
                        <Card
                          key={slot.id}
                          className="bg-gray-800/50 border-green-500/30"
                        >
                          <CardHeader>
                            <div className="flex justify-between items-start mb-2">
                              <CardTitle className="text-lg">Slot #{slot.slotNumber}</CardTitle>
                              <Badge className="bg-green-600">Active</Badge>
                            </div>
                            {slot.artwork && (
                              <CardDescription className="text-gray-300">
                                {slot.artwork.name}
                              </CardDescription>
                            )}
                          </CardHeader>
                          <CardContent>
                            {slot.artwork && (
                              <div className="space-y-2">
                                <div className="flex justify-between">
                                  <span className="text-gray-400">Rarity:</span>
                                  <Badge className={getRarityColor(slot.artwork.rarity)}>
                                    {slot.artwork.rarity}
                                  </Badge>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-gray-400">GP:</span>
                                  <span className="font-semibold">{slot.artwork.gp}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-gray-400">Mining:</span>
                                  <span className="font-semibold text-green-400">
                                    {calculateMiningRate(slot.artwork.gp, slot.artwork.rarity, miningRate?.levelBonus || 1)} $MUSEUM/h
                                  </span>
                                </div>
                                <Button
                                  onClick={() => handleRemoveFromSlot(slot.slotNumber)}
                                  variant="outline"
                                  className="w-full mt-4 border-red-500/50 text-red-400 hover:bg-red-900/30"
                                  disabled={removeMutation.isPending}
                                >
                                  {removeMutation.isPending ? "Removing..." : "Remove from Slot"}
                                </Button>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-400">
                      No artworks in slots yet. Assign artworks from your collection.
                    </div>
                  )}
                </div>

                {/* Available Slots */}
                <div>
                  <h2 className="text-2xl font-bold mb-4">📦 Available Slots ({availableSlots.length})</h2>
                  {availableSlots.length > 0 ? (
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-4">
                      {availableSlots.map((slot) => (
                        <Card
                          key={slot.id}
                          className="bg-gray-800/30 border-gray-500/30 aspect-square flex items-center justify-center"
                        >
                          <div className="text-center">
                            <p className="text-4xl mb-2">📦</p>
                            <p className="text-sm text-gray-400">Slot #{slot.slotNumber}</p>
                            <p className="text-xs text-gray-500">Empty</p>
                          </div>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-400">
                      All slots are occupied! Great job!
                    </div>
                  )}
                </div>
              </>
            )}
          </TabsContent>
        </Tabs>

        {/* Assign to Slot Modal */}
        <Dialog open={assignSlotModalOpen} onOpenChange={setAssignSlotModalOpen}>
          <DialogContent className="bg-gray-900 text-white border-purple-500/50">
            <DialogHeader>
              <DialogTitle>Assign to Slot</DialogTitle>
              <DialogDescription className="text-gray-400">
                {selectedArtwork && `Assign "${selectedArtwork.name}" to a museum slot`}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div>
                <label className="text-sm text-gray-400 mb-2 block">Select Slot</label>
                <Select value={selectedSlot} onValueChange={setSelectedSlot}>
                  <SelectTrigger className="bg-gray-800 border-purple-500/50">
                    <SelectValue placeholder="Choose slot..." />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-purple-500/50">
                    {availableSlots.map((slot) => (
                      <SelectItem key={slot.id} value={slot.slotNumber.toString()}>
                        Slot #{slot.slotNumber}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {selectedArtwork && (
                <div className="p-3 bg-purple-900/30 border border-purple-500/50 rounded">
                  <p className="text-sm text-gray-300">
                    This artwork will generate:
                    <span className="font-bold text-green-400 ml-2">
                      {calculateMiningRate(selectedArtwork.gp, selectedArtwork.rarity, miningRate?.levelBonus || 1)} $MUSEUM/hour
                    </span>
                  </p>
                </div>
              )}
              <Button
                onClick={handleAssignToSlot}
                className="w-full bg-purple-600 hover:bg-purple-700"
                disabled={assignMutation.isPending}
              >
                {assignMutation.isPending ? "Assigning..." : "Confirm Assignment"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Artwork Details Modal */}
        {selectedArtwork && !assignSlotModalOpen && (
          <Dialog open={!!selectedArtwork} onOpenChange={() => setSelectedArtwork(null)}>
            <DialogContent className="bg-gray-900 text-white border-purple-500/50">
              <DialogHeader>
                <DialogTitle>{selectedArtwork.name}</DialogTitle>
                <DialogDescription className="text-gray-400">
                  by {selectedArtwork.artist || "Unknown"}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-3 mt-4">
                <div className="flex justify-between">
                  <span className="text-gray-400">Rarity:</span>
                  <Badge className={getRarityColor(selectedArtwork.rarity)}>
                    {selectedArtwork.rarity}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">GP:</span>
                  <span className="font-semibold">{selectedArtwork.gp}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Mining Rate:</span>
                  <span className="font-semibold text-green-400">
                    {calculateMiningRate(selectedArtwork.gp, selectedArtwork.rarity, miningRate?.levelBonus || 1)} $MUSEUM/h
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Mint:</span>
                  <span className="font-mono text-xs">{selectedArtwork.mint.slice(0, 8)}...</span>
                </div>
                {selectedArtwork.description && (
                  <div>
                    <p className="text-gray-400 text-sm mb-1">Description:</p>
                    <p className="text-sm">{selectedArtwork.description}</p>
                  </div>
                )}
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </div>
  );
}

function getRarityColor(rarity: string): string {
  const colors: { [key: string]: string } = {
    Common: "bg-gray-600",
    Rare: "bg-blue-600",
    Epic: "bg-purple-600",
    Legendary: "bg-orange-600",
    Mythic: "bg-pink-600",
  };
  return colors[rarity] || "bg-gray-600";
}

const RARITY_MULTIPLIERS: { [key: string]: number } = {
  Common: 1,
  Rare: 2,
  Epic: 4,
  Legendary: 8,
  Mythic: 16,
};

function calculateMiningRate(gp: number, rarity: string, levelBonus: number): number {
  const rarityMultiplier = RARITY_MULTIPLIERS[rarity] || 1;
  return Math.floor(gp * rarityMultiplier * levelBonus);
}

