import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";

type RarityType = "Common" | "Rare" | "Epic" | "Legendary" | "Mythic";
type SortType = "price_asc" | "price_desc" | "gp_desc" | "recent";

export default function Marketplace() {
  const [, setLocation] = useLocation();
  const [rarity, setRarity] = useState<RarityType | undefined>(undefined);
  const [sortBy, setSortBy] = useState<SortType>("recent");
  const [search, setSearch] = useState("");
  const [selectedListing, setSelectedListing] = useState<number | null>(null);
  const [sellModalOpen, setSellModalOpen] = useState(false);
  const [selectedArtworkToSell, setSelectedArtworkToSell] = useState("");
  const [sellPrice, setSellPrice] = useState("");
  const [expirationDays, setExpirationDays] = useState("7");

  // Queries
  const { data: listings, isLoading: listingsLoading } = trpc.marketplace.list.useQuery({
    rarity,
    sortBy,
    search: search || undefined,
  });

  const { data: myListings } = trpc.marketplace.myListings.useQuery();
  const { data: userArtworks } = trpc.artworks.getUserArtworks.useQuery({});

  // Mutations
  const buyMutation = trpc.marketplace.buy.useMutation({
    onSuccess: () => {
      alert("Artwork purchased successfully!");
      setSelectedListing(null);
    },
    onError: (error) => {
      alert(`Failed to purchase: ${error.message}`);
    },
  });

  const sellMutation = trpc.marketplace.sell.useMutation({
    onSuccess: () => {
      alert("Artwork listed successfully!");
      setSellModalOpen(false);
      setSelectedArtworkToSell("");
      setSellPrice("");
    },
    onError: (error) => {
      alert(`Failed to list: ${error.message}`);
    },
  });

  const cancelMutation = trpc.marketplace.cancel.useMutation({
    onSuccess: () => {
      alert("Listing cancelled successfully!");
    },
    onError: (error) => {
      alert(`Failed to cancel: ${error.message}`);
    },
  });

  function handleBuy(listingId: number) {
    if (confirm("Are you sure you want to buy this artwork?")) {
      buyMutation.mutate({ listingId });
    }
  }

  function handleSell() {
    if (!selectedArtworkToSell || !sellPrice) {
      alert("Please select an artwork and enter a price");
      return;
    }

    const price = parseFloat(sellPrice);
    if (isNaN(price) || price <= 0) {
      alert("Please enter a valid price");
      return;
    }

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + parseInt(expirationDays));

    sellMutation.mutate({
      artworkMint: selectedArtworkToSell,
      price,
      expiresAt,
    });
  }

  function handleCancel(listingId: number) {
    if (confirm("Are you sure you want to cancel this listing?")) {
      cancelMutation.mutate({ listingId });
    }
  }

  const availableArtworksToSell = userArtworks?.filter(
    (artwork) => !myListings?.some((listing) => listing.artworkMint === artwork.mint && listing.active)
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-black to-purple-900 text-white p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold mb-2">🛒 Marketplace</h1>
            <p className="text-gray-400">Buy and sell NFT artworks</p>
          </div>
          <div className="flex gap-4">
            <Dialog open={sellModalOpen} onOpenChange={setSellModalOpen}>
              <DialogTrigger asChild>
                <Button className="bg-purple-600 hover:bg-purple-700">
                  + Sell Artwork
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-gray-900 text-white border-purple-500/50">
                <DialogHeader>
                  <DialogTitle>Sell Artwork</DialogTitle>
                  <DialogDescription className="text-gray-400">
                    List your artwork on the marketplace
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 mt-4">
                  <div>
                    <Label>Select Artwork</Label>
                    <Select value={selectedArtworkToSell} onValueChange={setSelectedArtworkToSell}>
                      <SelectTrigger className="bg-gray-800 border-purple-500/50">
                        <SelectValue placeholder="Choose artwork..." />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-800 border-purple-500/50">
                        {availableArtworksToSell?.map((artwork) => (
                          <SelectItem key={artwork.mint} value={artwork.mint}>
                            {artwork.name} ({artwork.rarity})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Price ($MUSEUM)</Label>
                    <Input
                      type="number"
                      value={sellPrice}
                      onChange={(e) => setSellPrice(e.target.value)}
                      placeholder="Enter price..."
                      className="bg-gray-800 border-purple-500/50"
                    />
                  </div>
                  <div>
                    <Label>Expiration (days)</Label>
                    <Select value={expirationDays} onValueChange={setExpirationDays}>
                      <SelectTrigger className="bg-gray-800 border-purple-500/50">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-800 border-purple-500/50">
                        <SelectItem value="1">1 day</SelectItem>
                        <SelectItem value="3">3 days</SelectItem>
                        <SelectItem value="7">7 days</SelectItem>
                        <SelectItem value="14">14 days</SelectItem>
                        <SelectItem value="30">30 days</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button
                    onClick={handleSell}
                    className="w-full bg-purple-600 hover:bg-purple-700"
                    disabled={sellMutation.isPending}
                  >
                    {sellMutation.isPending ? "Listing..." : "List Artwork"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
            <Button onClick={() => setLocation("/")} variant="outline" className="border-purple-500/50">
              ← Back
            </Button>
          </div>
        </div>

        <Tabs defaultValue="browse" className="w-full">
          <TabsList className="bg-gray-800/50 border border-purple-500/30">
            <TabsTrigger value="browse">Browse</TabsTrigger>
            <TabsTrigger value="my-listings">My Listings</TabsTrigger>
          </TabsList>

          <TabsContent value="browse" className="mt-6">
            {/* Filters */}
            <div className="flex gap-4 mb-6">
              <div className="flex-1">
                <Input
                  placeholder="Search artworks..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="bg-gray-800 border-purple-500/50"
                />
              </div>
              <Select value={rarity} onValueChange={(v) => setRarity(v as RarityType)}>
                <SelectTrigger className="w-48 bg-gray-800 border-purple-500/50">
                  <SelectValue placeholder="All Rarities" />
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
              <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortType)}>
                <SelectTrigger className="w-48 bg-gray-800 border-purple-500/50">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-purple-500/50">
                  <SelectItem value="recent">Most Recent</SelectItem>
                  <SelectItem value="price_asc">Price: Low to High</SelectItem>
                  <SelectItem value="price_desc">Price: High to Low</SelectItem>
                  <SelectItem value="gp_desc">GP: High to Low</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Listings Grid */}
            {listingsLoading ? (
              <div className="text-center py-12">Loading...</div>
            ) : listings && listings.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {listings.map((listing) => (
                  <Card
                    key={listing.id}
                    className="bg-gray-800/50 border-purple-500/30 hover:border-purple-500 transition-all cursor-pointer"
                    onClick={() => setSelectedListing(listing.id)}
                  >
                    <CardHeader>
                      <div className="flex justify-between items-start mb-2">
                        <CardTitle className="text-lg">{listing.artwork.name}</CardTitle>
                        <Badge className={getRarityColor(listing.artwork.rarity)}>
                          {listing.artwork.rarity}
                        </Badge>
                      </div>
                      <CardDescription className="text-gray-400">
                        by {listing.artwork.artist || "Unknown"}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-gray-400">GP:</span>
                          <span className="font-semibold">{listing.artwork.gp}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Price:</span>
                          <span className="font-semibold text-yellow-400">
                            {listing.price} $MUSEUM
                          </span>
                        </div>
                        <Button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleBuy(listing.id);
                          }}
                          className="w-full bg-purple-600 hover:bg-purple-700 mt-4"
                          disabled={buyMutation.isPending}
                        >
                          {buyMutation.isPending ? "Buying..." : "Buy Now"}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-gray-400">
                No listings found. Try adjusting your filters.
              </div>
            )}
          </TabsContent>

          <TabsContent value="my-listings" className="mt-6">
            {myListings && myListings.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {myListings.map((listing) => (
                  <Card
                    key={listing.id}
                    className="bg-gray-800/50 border-purple-500/30"
                  >
                    <CardHeader>
                      <div className="flex justify-between items-start mb-2">
                        <CardTitle className="text-lg">{listing.artwork.name}</CardTitle>
                        <Badge className={listing.active ? "bg-green-600" : "bg-gray-600"}>
                          {listing.active ? "Active" : "Sold"}
                        </Badge>
                      </div>
                      <CardDescription className="text-gray-400">
                        by {listing.artwork.artist || "Unknown"}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-gray-400">Price:</span>
                          <span className="font-semibold text-yellow-400">
                            {listing.price} $MUSEUM
                          </span>
                        </div>
                        {listing.active && (
                          <Button
                            onClick={() => handleCancel(listing.id)}
                            variant="destructive"
                            className="w-full mt-4"
                            disabled={cancelMutation.isPending}
                          >
                            {cancelMutation.isPending ? "Cancelling..." : "Cancel Listing"}
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-gray-400">
                You don't have any listings yet.
              </div>
            )}
          </TabsContent>
        </Tabs>
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

