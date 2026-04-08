import { Client, Databases, ID } from "appwrite";

const client = new Client();

client
  .setEndpoint(import.meta.env.VITE_APPWRITE_ENDPOINT || "https://sgp.cloud.appwrite.io/v1")
  .setProject(import.meta.env.VITE_APPWRITE_PROJECT_ID || "69d5081d003dd1e2fe0a");

const DATABASE_ID = "leaderboardDB";
const COLLECTION_ID = "scores";

const databases = new Databases(client);

// 52 fake player names for seeding
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
  "LuckyShot", "ProGamer", "AcePlayer", "TopScorer", "LegendX",
  "MasterMind", "FinalBoss"
];

// Generate fake players with scores between 500-1000
function generateFakePlayers() {
  return FAKE_PLAYER_NAMES.map(name => ({
    userId: name,
    username: name,
    score: Math.floor(Math.random() * 500) + 500, // 500-1000
    createdAt: new Date().toISOString()
  }));
}

// Seed the leaderboard with 52 fake players (RUN ONLY ONCE)
async function seedLeaderboard() {
  // Check if already seeded
  if (localStorage.getItem("leaderboard_seeded") === "true") {
    console.log("⏭️ Leaderboard already seeded, skipping");
    return;
  }

  try {
    const players = generateFakePlayers();

    for (let player of players) {
      await databases.createDocument(
        DATABASE_ID,
        COLLECTION_ID,
        ID.unique(),
        player
      );
    }

    localStorage.setItem("leaderboard_seeded", "true");
    console.log("✅ 52 fake players added to leaderboard");
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
    const res = await databases.listDocuments(DATABASE_ID, COLLECTION_ID);
    
    return res.documents.sort((a, b) => b.score - a.score);
  } catch (error) {
    console.error("❌ Error fetching all-time leaderboard:", error);
    return [];
  }
}

// Today's leaderboard
async function getTodayLeaderboard() {
  try {
    const res = await databases.listDocuments(DATABASE_ID, COLLECTION_ID);
    
    const today = new Date().toDateString();
    
    return res.documents
      .filter(p => new Date(p.createdAt).toDateString() === today)
      .sort((a, b) => b.score - a.score);
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

// Medal helper
function getMedal(index) {
  if (index === 0) return "🥇";
  if (index === 1) return "🥈";
  if (index === 2) return "🥉";
  return "";
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
  getMedal,
  DATABASE_ID, 
  COLLECTION_ID 
};
