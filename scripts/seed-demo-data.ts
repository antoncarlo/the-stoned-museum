import { drizzle } from "drizzle-orm/mysql2";
import { artworks, slots, users } from "../drizzle/schema";

async function seedDemoData() {
  console.log("🌱 Seeding demo data...");

  const db = drizzle(process.env.DATABASE_URL!);

  try {
    // Create demo artworks
    const demoArtworks = [
      {
        mint: "demo_artwork_1_common",
        name: "Starry Night",
        rarity: "Common" as const,
        gp: 10,
        imageUrl: "https://example.com/starry-night.jpg",
        artist: "Vincent van Gogh",
        description: "A beautiful night sky painting",
        ownerWallet: null,
      },
      {
        mint: "demo_artwork_2_rare",
        name: "The Scream",
        rarity: "Rare" as const,
        gp: 25,
        imageUrl: "https://example.com/the-scream.jpg",
        artist: "Edvard Munch",
        description: "An iconic expressionist painting",
        ownerWallet: null,
      },
      {
        mint: "demo_artwork_3_epic",
        name: "Girl with a Pearl Earring",
        rarity: "Epic" as const,
        gp: 50,
        imageUrl: "https://example.com/girl-pearl.jpg",
        artist: "Johannes Vermeer",
        description: "A masterpiece of Dutch Golden Age painting",
        ownerWallet: null,
      },
      {
        mint: "demo_artwork_4_legendary",
        name: "The Birth of Venus",
        rarity: "Legendary" as const,
        gp: 100,
        imageUrl: "https://example.com/birth-venus.jpg",
        artist: "Sandro Botticelli",
        description: "A Renaissance masterpiece",
        ownerWallet: null,
      },
      {
        mint: "demo_artwork_5_mythic",
        name: "Mona Lisa",
        rarity: "Mythic" as const,
        gp: 200,
        imageUrl: "https://example.com/mona-lisa.jpg",
        artist: "Leonardo da Vinci",
        description: "The most famous painting in the world",
        ownerWallet: null,
      },
      {
        mint: "demo_artwork_6_common",
        name: "The Great Wave",
        rarity: "Common" as const,
        gp: 12,
        imageUrl: "https://example.com/great-wave.jpg",
        artist: "Hokusai",
        description: "A famous Japanese woodblock print",
        ownerWallet: null,
      },
      {
        mint: "demo_artwork_7_rare",
        name: "American Gothic",
        rarity: "Rare" as const,
        gp: 30,
        imageUrl: "https://example.com/american-gothic.jpg",
        artist: "Grant Wood",
        description: "An iconic American painting",
        ownerWallet: null,
      },
      {
        mint: "demo_artwork_8_epic",
        name: "The Kiss",
        rarity: "Epic" as const,
        gp: 60,
        imageUrl: "https://example.com/the-kiss.jpg",
        artist: "Gustav Klimt",
        description: "A golden Art Nouveau masterpiece",
        ownerWallet: null,
      },
      {
        mint: "demo_artwork_9_legendary",
        name: "The Persistence of Memory",
        rarity: "Legendary" as const,
        gp: 120,
        imageUrl: "https://example.com/persistence-memory.jpg",
        artist: "Salvador Dalí",
        description: "A surrealist masterpiece with melting clocks",
        ownerWallet: null,
      },
      {
        mint: "demo_artwork_10_mythic",
        name: "The Last Supper",
        rarity: "Mythic" as const,
        gp: 250,
        imageUrl: "https://example.com/last-supper.jpg",
        artist: "Leonardo da Vinci",
        description: "One of the most famous religious paintings",
        ownerWallet: null,
      },
    ];

    console.log("📦 Creating demo artworks...");
    for (const artwork of demoArtworks) {
      await db.insert(artworks).values(artwork).onDuplicateKeyUpdate({
        set: { name: artwork.name },
      });
    }
    console.log(`✅ Created ${demoArtworks.length} demo artworks`);

    // Get all users and create initial slots for them
    const allUsers = await db.select().from(users);
    
    if (allUsers.length > 0) {
      console.log(`👥 Found ${allUsers.length} users, creating initial slots...`);
      
      for (const user of allUsers) {
        // Create 3 initial slots for each user
        for (let i = 1; i <= 3; i++) {
          await db.insert(slots).values({
            userId: user.id,
            slotNumber: i,
            artworkMint: null,
          }).onDuplicateKeyUpdate({
            set: { slotNumber: i },
          });
        }
        console.log(`✅ Created 3 initial slots for user ${user.id}`);
      }
    } else {
      console.log("⚠️  No users found. Slots will be created when users register.");
    }

    console.log("🎉 Demo data seeded successfully!");
  } catch (error) {
    console.error("❌ Error seeding demo data:", error);
    throw error;
  }
}

seedDemoData()
  .then(() => {
    console.log("✅ Seed completed");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Seed failed:", error);
    process.exit(1);
  });

