import { Client, Databases, ID, Query } from "appwrite";

const client = new Client();

client
  .setEndpoint(import.meta.env.VITE_APPWRITE_ENDPOINT || "https://sgp.cloud.appwrite.io/v1")
  .setProject(import.meta.env.VITE_APPWRITE_PROJECT_ID || "69d5081d003dd1e2fe0a");

const DATABASE_ID = "leaderboardDB";
const COLLECTION_ID = "scores";

const databases = new Databases(client);

// 51 fake player names for seeding
const FAKE_PLAYER_NAMES = [
  "ShadowNinja", "PixelPro", "GameMaster", "SpeedRunner", "BrainKing",
  "PuzzleQueen", "QuickThinker", "FirePlayer", "IceWizard", "StormBreaker",
  "NeonGhost", "DarkKnight", "AlphaGamer", "BetaBoss", "CyberChamp",
  "LogicLord", "RapidFire", "SilentHunter", "CodeCrusher", "FlashPlayer",
  "TurboMind", "SharpEdge", "BlazeHero", "FrostByte", "ThunderX",
  "NightCrawler", "SolarFlare", "EchoPlayer", "VortexKing", "NovaStar",
  "QuantumX", "ZenMaster", "GhostRider", "SkyWalker", "InfernoX",
  "CrystalMind", "MegaPlayer", "UltraThink", "HyperNova", "MindBender",
  "BrainStorm", "GameWizard", "PixelHero", "ElitePlayer", "FastFinger",
  "LuckyShot", "ProGamer", "AcePlayer", "TopScorer", "LegendX"
];

// Generate multiple score entries for fake players
function generateFakePlayers() {
  const allEntries = [];
  const gameIds = ["memory", "blink", "taptrap", "illusion", "risk"];

  FAKE_PLAYER_NAMES.forEach(name => {
    // Generate all-time total score (up to 10k)
    const totalScore = Math.floor(Math.random() * 9000) + 1000; // 1000-10000

    // Generate daily score (up to 2k)
    const dailyScore = Math.floor(Math.random() * 1800) + 200; // 200-2000

    // Create historical entries (total - daily)
    const historicalScore = totalScore - dailyScore;
    const numHistoricalGames = Math.floor(Math.random() * 15) + 5; // 5-20 games

    // Distribute historical scores
    let remainingHistorical = historicalScore;
    for (let i = 0; i < numHistoricalGames - 1; i++) {
      const gameScore = Math.floor(Math.random() * Math.min(remainingHistorical, 500)) + 10;
      const randomDaysAgo = Math.floor(Math.random() * 30) + 1; // 1-30 days ago
      const gameDate = new Date();
      gameDate.setDate(gameDate.getDate() - randomDaysAgo);

      allEntries.push({
        userId: name,
        username: name,
        score: gameScore,
        gameId: gameIds[Math.floor(Math.random() * gameIds.length)],
        createdAt: gameDate.toISOString()
      });

      remainingHistorical -= gameScore;
    }

    // Add the remaining historical score
    if (remainingHistorical > 0) {
      const randomDaysAgo = Math.floor(Math.random() * 30) + 1;
      const gameDate = new Date();
      gameDate.setDate(gameDate.getDate() - randomDaysAgo);

      allEntries.push({
        userId: name,
        username: name,
        score: remainingHistorical,
        gameId: gameIds[Math.floor(Math.random() * gameIds.length)],
        createdAt: gameDate.toISOString()
      });
    }

    // Create today's entries summing to dailyScore
    const numTodayGames = Math.floor(Math.random() * 5) + 1; // 1-5 games today
    let remainingDaily = dailyScore;

    for (let i = 0; i < numTodayGames - 1; i++) {
      const gameScore = Math.floor(Math.random() * Math.min(remainingDaily, 800)) + 10;
      const today = new Date();
      // Random time today
      today.setHours(Math.floor(Math.random() * 24));
      today.setMinutes(Math.floor(Math.random() * 60));

      allEntries.push({
        userId: name,
        username: name,
        score: gameScore,
        gameId: gameIds[Math.floor(Math.random() * gameIds.length)],
        createdAt: today.toISOString()
      });

      remainingDaily -= gameScore;
    }

    // Add the remaining daily score
    if (remainingDaily > 0) {
      const today = new Date();
      today.setHours(Math.floor(Math.random() * 24));
      today.setMinutes(Math.floor(Math.random() * 60));

      allEntries.push({
        userId: name,
        username: name,
        score: remainingDaily,
        gameId: gameIds[Math.floor(Math.random() * gameIds.length)],
        createdAt: today.toISOString()
      });
    }
  });

  return allEntries;
}

// Seed the leaderboard with 51 fake players (RUN ONLY ONCE)
async function seedLeaderboard() {
  // TEMPORARILY FORCE RESEEDING FOR DEBUGGING
  console.log("🔄 Force reseeding leaderboard with 51 players for debugging...");

  // Uncomment below to restore normal seeding check:
  // const seededVersion = localStorage.getItem("leaderboard_seeded_version");
  // if (seededVersion === "2") {
  //   console.log("⏭️ Leaderboard already seeded with latest format, skipping");
  //   return;
  // }

  try {
    const scoreEntries = generateFakePlayers();
    console.log(`📊 Generated ${scoreEntries.length} score entries for ${FAKE_PLAYER_NAMES.length} players`);

    for (let entry of scoreEntries) {
      await databases.createDocument(
        DATABASE_ID,
        COLLECTION_ID,
        ID.unique(),
        entry
      );
    }

    localStorage.setItem("leaderboard_seeded_version", "2");
    console.log(`✅ ${FAKE_PLAYER_NAMES.length} fake players seeded with ${scoreEntries.length} total score entries`);
  } catch (error) {
    console.error("❌ Error seeding leaderboard:", error);
    throw error;
  }
}

// Save score for real users
async function saveScore(score, username) {
  try {
    await databases.createDocument(
      DATABASE_ID,
      COLLECTION_ID,
      ID.unique(),
      {
        userId: username || "guest_" + Date.now(),
        username: username || "guest_" + Date.now(),
        score: score,
        createdAt: new Date().toISOString()
      }
    );
    console.log("✅ Score saved:", score, "for", username);
  } catch (error) {
    console.error("❌ Error saving score:", error);
    throw error;
  }
}

// All-time leaderboard
async function getAllTimeLeaderboard() {
  try {
    const res = await databases.listDocuments(DATABASE_ID, COLLECTION_ID, [
      Query.limit(10000)
    ]);

    console.log(`📊 Found ${res.documents.length} total score entries in database`);

    // Group by username and sum scores for cumulative leaderboard
    const userTotals = new Map();
    for (const doc of res.documents) {
      if (!doc.username) continue;
      const current = userTotals.get(doc.username) || { score: 0, username: doc.username, gameId: doc.gameId, createdAt: doc.createdAt };
      current.score += doc.score;
      userTotals.set(doc.username, current);
    }

    const result = Array.from(userTotals.values()).sort((a, b) => b.score - a.score);
    console.log(`🏆 Returning ${result.length} unique players on leaderboard`);
    return result;
  } catch (error) {
    console.error("❌ Error fetching all-time leaderboard:", error);
    return [];
  }
}

// Today's leaderboard
async function getTodayLeaderboard() {
  try {
    const res = await databases.listDocuments(DATABASE_ID, COLLECTION_ID, [
      Query.limit(10000)
    ]);

    const today = new Date().toDateString();

    // Filter today's games and group by username for cumulative scores
    const todayDocs = res.documents.filter(p => new Date(p.createdAt).toDateString() === today);
    const userTotals = new Map();

    for (const doc of todayDocs) {
      if (!doc.username) continue;
      const current = userTotals.get(doc.username) || { score: 0, username: doc.username, gameId: doc.gameId, createdAt: doc.createdAt };
      current.score += doc.score;
      userTotals.set(doc.username, current);
    }

    return Array.from(userTotals.values()).sort((a, b) => b.score - a.score);
  } catch (error) {
    console.error("❌ Error fetching today's leaderboard:", error);
    return [];
  }
}

// Unified leaderboard function (backward compatible)
async function getFullLeaderboard(period) {
  if (period === "daily") {
    return getTodayLeaderboard();
  }
  return getAllTimeLeaderboard();
}

// Backward compatible alias
async function getLeaderboard() {
  return getAllTimeLeaderboard();
}

// Reset seeding flag (for debugging/testing)
function resetLeaderboardSeeding() {
  localStorage.removeItem("leaderboard_seeded_version");
  console.log("🔄 Leaderboard seeding flag reset - will reseed on next leaderboard load");
}

export {
  client,
  databases,
  ID,
  saveScore,
  getLeaderboard,
  getFullLeaderboard,
  getAllTimeLeaderboard,
  getTodayLeaderboard,
  seedLeaderboard,
  resetLeaderboardSeeding,
  getMedal,
  DATABASE_ID,
  COLLECTION_ID
};
