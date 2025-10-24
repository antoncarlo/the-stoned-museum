import LouvreMuseum3DNew from "@/components/LouvreMuseum3DNew";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useLocation } from "wouter";

export default function Museum() {
  const [, setLocation] = useLocation();
  const [selectedArtwork, setSelectedArtwork] = useState<string | null>(null);

  // Mock artworks posizionati nel museo
  const artworks = [
    {
      id: "1",
      name: "Crypto Mona Lisa",
      artist: "Beeple",
      rarity: "Mythic",
      position: [-5, 3, -10] as [number, number, number],
    },
    {
      id: "2",
      name: "Solana Sunrise",
      artist: "Pak",
      rarity: "Legendary",
      position: [5, 3, -10] as [number, number, number],
    },
    {
      id: "3",
      name: "NFT Revolution",
      artist: "XCOPY",
      rarity: "Epic",
      position: [-5, 3, -20] as [number, number, number],
    },
    {
      id: "4",
      name: "Digital Renaissance",
      artist: "FEWOCiOUS",
      rarity: "Rare",
      position: [5, 3, -20] as [number, number, number],
    },
    {
      id: "5",
      name: "Blockchain Dreams",
      artist: "Mad Dog Jones",
      rarity: "Epic",
      position: [20, 3, -20] as [number, number, number],
    },
  ];

  function handleArtworkClick(artworkId: string) {
    setSelectedArtwork(artworkId);
  }

  const selectedArtworkData = artworks.find((a) => a.id === selectedArtwork);

  return (
    <div className="relative">
      <LouvreMuseum3DNew artworks={artworks} onArtworkClick={handleArtworkClick} />

      {/* Back button */}
      <Button
        onClick={() => setLocation("/")}
        className="absolute top-4 left-4 z-20 bg-purple-600 hover:bg-purple-700"
      >
        ← Back to Dashboard
      </Button>

      {/* Artwork info panel */}
      {selectedArtworkData && (
        <div className="absolute bottom-4 right-4 z-20 w-80">
          <Card className="bg-black/80 border-purple-500/50 backdrop-blur">
            <CardHeader>
              <CardTitle className="text-xl text-white">
                {selectedArtworkData.name}
              </CardTitle>
              <CardDescription className="text-gray-300">
                by {selectedArtworkData.artist}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-400">Rarity:</span>
                  <span className={`font-semibold ${getRarityColor(selectedArtworkData.rarity)}`}>
                    {selectedArtworkData.rarity}
                  </span>
                </div>
                <Button
                  onClick={() => setSelectedArtwork(null)}
                  variant="outline"
                  className="w-full mt-4 border-purple-500/50 text-white hover:bg-purple-900/30"
                >
                  Close
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

function getRarityColor(rarity: string): string {
  const colors: { [key: string]: string } = {
    Common: "text-gray-400",
    Rare: "text-blue-400",
    Epic: "text-purple-400",
    Legendary: "text-orange-400",
    Mythic: "text-pink-400",
  };
  return colors[rarity] || "text-white";
}

