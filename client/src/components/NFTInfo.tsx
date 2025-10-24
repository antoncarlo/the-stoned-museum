import { useEffect, useState } from 'react';

interface NFTInfoProps {
  visible: boolean;
  nftData: {
    title: string;
    artist: string;
    description: string;
    gallery: string;
  } | null;
}

export default function NFTInfo({ visible, nftData }: NFTInfoProps) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (visible && nftData) {
      setShow(true);
    } else {
      setShow(false);
    }
  }, [visible, nftData]);

  if (!show || !nftData) return null;

  return (
    <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-purple-900/90 to-pink-900/90 backdrop-blur-md text-white p-6 rounded-lg max-w-md z-20 border-2 border-purple-500/50 shadow-2xl">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h3 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-300 to-pink-300">
            {nftData.title}
          </h3>
          <p className="text-sm text-purple-200 mt-1">
            by <span className="font-semibold">{nftData.artist}</span>
          </p>
        </div>
        <div className="ml-4 px-3 py-1 bg-purple-500/30 rounded-full text-xs font-medium">
          {nftData.gallery}
        </div>
      </div>
      
      <p className="text-sm text-gray-200 leading-relaxed mb-4">
        {nftData.description}
      </p>
      
      <div className="flex gap-2">
        <button className="flex-1 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 rounded-md text-sm font-medium transition-all duration-200 transform hover:scale-105">
          View on Chain
        </button>
        <button className="px-4 py-2 bg-purple-500/20 hover:bg-purple-500/30 rounded-md text-sm font-medium transition-all duration-200">
          Details
        </button>
      </div>
      
      <p className="text-xs text-purple-300 mt-3 text-center">
        Press ESC to close
      </p>
    </div>
  );
}

