export interface NFTArtwork {
  id: string;
  title: string;
  artist: string;
  description: string;
  gallery: string;
  position: [number, number, number];
  color: number;
}

export const nftArtworks: NFTArtwork[] = [
  // North Gallery - Contemporary Digital Art
  {
    id: 'nft-001',
    title: 'Crypto Dreams',
    artist: 'Beeple',
    description: 'Una visione futuristica del mondo digitale dove blockchain e arte si fondono in un\'esplosione di colori vibranti.',
    gallery: 'North Gallery',
    position: [-5, 2.5, -19.5],
    color: 0xff00ff,
  },
  {
    id: 'nft-002',
    title: 'Decentralized Vision',
    artist: 'Pak',
    description: 'Un\'opera che esplora il concetto di decentralizzazione attraverso forme geometriche astratte e pattern ipnotici.',
    gallery: 'North Gallery',
    position: [0, 2.5, -19.5],
    color: 0xd946ef,
  },
  {
    id: 'nft-003',
    title: 'Neon Genesis',
    artist: 'XCOPY',
    description: 'Una rappresentazione glitch art della nascita di una nuova era digitale, caratterizzata da colori neon pulsanti.',
    gallery: 'North Gallery',
    position: [5, 2.5, -19.5],
    color: 0xff1493,
  },
  
  // East Gallery - Generative Art
  {
    id: 'nft-004',
    title: 'Algorithmic Beauty',
    artist: 'Tyler Hobbs',
    description: 'Arte generativa creata attraverso algoritmi complessi che producono pattern unici e irripetibili.',
    gallery: 'East Gallery',
    position: [-24.5, 2.5, 10],
    color: 0xff69b4,
  },
  {
    id: 'nft-005',
    title: 'Chromatic Harmony',
    artist: 'Dmitri Cherniak',
    description: 'Un\'esplorazione della teoria del colore attraverso forme geometriche generate proceduralmente.',
    gallery: 'East Gallery',
    position: [-24.5, 2.5, 13],
    color: 0xff1493,
  },
  
  // South Gallery - 3D & Metaverse Art
  {
    id: 'nft-006',
    title: 'Virtual Realm',
    artist: 'Fewocious',
    description: 'Una porta verso mondi virtuali inesplorati, dove la realtà si fonde con l\'immaginazione digitale.',
    gallery: 'South Gallery',
    position: [24.5, 2.5, 10],
    color: 0x00ffff,
  },
  {
    id: 'nft-007',
    title: 'Metaverse Dreams',
    artist: 'Mad Dog Jones',
    description: 'Paesaggi cyberpunk che rappresentano il futuro del metaverso e delle esperienze digitali immersive.',
    gallery: 'South Gallery',
    position: [24.5, 2.5, 13],
    color: 0x0080ff,
  },
  
  // Central Atrium - Featured Artists
  {
    id: 'nft-008',
    title: 'Digital Renaissance',
    artist: 'Refik Anadol',
    description: 'Un\'opera che utilizza intelligenza artificiale per reinterpretare i capolavori del Rinascimento in chiave moderna.',
    gallery: 'Central Atrium',
    position: [-14.5, 2.5, -5],
    color: 0x8b5cf6,
  },
  {
    id: 'nft-009',
    title: 'Quantum Entanglement',
    artist: 'Hackatao',
    description: 'Una rappresentazione visiva dei principi della fisica quantistica attraverso l\'arte digitale surrealista.',
    gallery: 'Central Atrium',
    position: [14.5, 2.5, -5],
    color: 0xa855f7,
  },
];

export function getNFTByPosition(position: [number, number, number], threshold = 2): NFTArtwork | null {
  for (const artwork of nftArtworks) {
    const distance = Math.sqrt(
      Math.pow(artwork.position[0] - position[0], 2) +
      Math.pow(artwork.position[2] - position[2], 2)
    );
    
    if (distance < threshold) {
      return artwork;
    }
  }
  
  return null;
}

