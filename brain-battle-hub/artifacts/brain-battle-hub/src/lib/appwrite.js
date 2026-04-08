import { Client, Databases, ID, Query } from "appwrite";

const client = new Client();

client
  .setEndpoint(import.meta.env.VITE_APPWRITE_ENDPOINT || "https://sgp.cloud.appwrite.io/v1")
  .setProject(import.meta.env.VITE_APPWRITE_PROJECT_ID || "69d5081d003dd1e2fe0a");

const DATABASE_ID = "leaderboardDB";
const COLLECTION_ID = "scores";

const databases = new Databases(client);



// Seed the leaderboard - DISABLED (no fake players)
async function seedLeaderboard() {
  // Disabled: No longer seeding fake players
  console.log("🚫 Fake player seeding disabled - only real players will appear");
  return;
}

// Save score for real users
async function saveScore(score, username) {
  console.log("💾 saveScore called with:", { score, username });

  try {
    const docData = {
      userId: username || "guest_" + Date.now(),
      username: username || "guest_" + Date.now(),
      score: score,
      gameId: 'unknown', // Add gameId field
      createdAt: new Date().toISOString()
    };

    console.log("📄 Creating document with data:", docData);

    const result = await databases.createDocument(
      DATABASE_ID,
      COLLECTION_ID,
      ID.unique(),
      docData
    );

    console.log("✅ Score saved successfully:", result.$id, "for", username, "with score", score);
  } catch (error) {
    console.error("❌ Error saving score:", error);
    console.error("❌ Error details:", error.message);
    throw error;
  }
}

// All-time leaderboard
async function getAllTimeLeaderboard() {
  try {
    console.log("🏆 Fetching all-time leaderboard...");
    const res = await databases.listDocuments(DATABASE_ID, COLLECTION_ID, [
      Query.limit(10000)
    ]);

    console.log(`📊 Found ${res.documents.length} total documents in database`);

    // Log some recent documents for debugging
    const recentDocs = res.documents.slice(0, 3);
    recentDocs.forEach((doc, i) => {
      console.log(`📄 Recent doc ${i+1}: ${doc.username} - ${doc.score} points (${doc.createdAt})`);
    });

    // Group by username and sum scores for cumulative leaderboard
    const userTotals = new Map();
    for (const doc of res.documents) {
      if (!doc.username) continue;
      const current = userTotals.get(doc.username) || { score: 0, username: doc.username, gameId: doc.gameId, createdAt: doc.createdAt };
      current.score += doc.score;
      userTotals.set(doc.username, current);
    }

    const result = Array.from(userTotals.values()).sort((a, b) => b.score - a.score);
    console.log(`🏆 All-time leaderboard: ${result.length} real players (fake players disabled)`);
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

    console.log(`📊 getTodayLeaderboard: Found ${res.documents.length} total documents`);

    const today = new Date().toDateString();
    console.log(`📅 Today's date string: ${today}`);

    // Filter today's games and group by username for cumulative scores
    const todayDocs = res.documents.filter(p => {
      const docDate = new Date(p.createdAt).toDateString();
      const isToday = docDate === today;
      if (isToday && p.username) {
        console.log(`📅 Today's doc: ${p.username} - ${p.score} points (${p.createdAt})`);
      }
      return isToday;
    });

    console.log(`📊 getTodayLeaderboard: Filtered to ${todayDocs.length} today's documents`);

    // Log today's documents for debugging
    todayDocs.slice(0, 3).forEach((doc, i) => {
      console.log(`📅 Today's doc ${i+1}: ${doc.username} - ${doc.score} points (${doc.createdAt})`);
    });

    const userTotals = new Map();

    for (const doc of todayDocs) {
      if (!doc.username) continue;
      const current = userTotals.get(doc.username) || { score: 0, username: doc.username, gameId: doc.gameId, createdAt: doc.createdAt };
      current.score += doc.score;
      userTotals.set(doc.username, current);
    }

    const result = Array.from(userTotals.values()).sort((a, b) => b.score - a.score);
    console.log(`🏆 getTodayLeaderboard: Returning ${result.length} real players with daily scores`);
    result.slice(0, 3).forEach((player, i) => {
      console.log(`🥇 Top ${i+1}: ${player.username} - ${player.score} points`);
    });
    return result;
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

// Reset seeding flag (for clearing any existing fake data)
function resetLeaderboardSeeding() {
  localStorage.removeItem("leaderboard_seeded_version");
  console.log("🔄 Leaderboard seeding flag cleared - fake players removed");
}

// Test Appwrite connection
async function testAppwriteConnection() {
  try {
    console.log("🧪 Testing Appwrite connection...");
    const result = await databases.listDocuments(DATABASE_ID, COLLECTION_ID, [Query.limit(1)]);
    console.log("✅ Appwrite connection successful, found", result.total, "documents");
    return true;
  } catch (error) {
    console.error("❌ Appwrite connection failed:", error);
    return false;
  }
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
  resetLeaderboardSeeding,
  testAppwriteConnection,
  getMedal,
  DATABASE_ID,
  COLLECTION_ID
};
