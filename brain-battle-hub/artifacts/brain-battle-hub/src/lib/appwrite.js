import { Client, Databases, ID, Query } from "appwrite";

const client = new Client();

client
  .setEndpoint(import.meta.env.VITE_APPWRITE_ENDPOINT || "https://sgp.cloud.appwrite.io/v1")
  .setProject(import.meta.env.VITE_APPWRITE_PROJECT_ID || "69d5081d003dd1e2fe0a");

const DATABASE_ID = "leaderboardDB";
const COLLECTION_ID = "scores";

const databases = new Databases(client);

// Test with random player names for debugging
const FAKE_PLAYER_NAMES = [
  "AlexGamer", "SarahPro", "MikeChamp", "EmmaWinner", "JakeMaster"
];

// Generate multiple score entries for fake players
function generateFakePlayers() {
  const allEntries = [];
  const gameIds = ["memory", "blink", "taptrap", "illusion", "risk"];

  console.log(`🎮 Generating fake data for ${FAKE_PLAYER_NAMES.length} players`);

  FAKE_PLAYER_NAMES.forEach((name, index) => {
    // Generate all-time total score (up to 10k)
    const totalScore = Math.floor(Math.random() * 9000) + 1000; // 1000-10000

    // Generate daily score (up to 2k)
    const dailyScore = Math.floor(Math.random() * 1800) + 200; // 200-2000

    // Create historical entries (total - daily)
    const historicalScore = totalScore - dailyScore;
    const numHistoricalGames = Math.floor(Math.random() * 3) + 1; // 1-3 games for testing

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
    const numTodayGames = Math.floor(Math.random() * 2) + 1; // 1-2 games today for testing
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

  console.log(`📊 Generated ${allEntries.length} total score entries across ${FAKE_PLAYER_NAMES.length} players`);
  return allEntries;
}

// Seed the leaderboard with 51 fake players (RUN ONLY ONCE)
async function seedLeaderboard() {
  // Check if already seeded with new format (version 2)
  const seededVersion = localStorage.getItem("leaderboard_seeded_version");
  if (seededVersion === "2") {
    console.log("⏭️ Leaderboard already seeded with latest format, skipping");
    return;
  }

  console.log("🔄 Starting leaderboard seeding with 51 players...");

  try {
    const scoreEntries = generateFakePlayers();
    console.log(`📊 Generated ${scoreEntries.length} score entries for ${FAKE_PLAYER_NAMES.length} players`);

    let successCount = 0;
    for (let i = 0; i < scoreEntries.length; i++) {
      const entry = scoreEntries[i];
      try {
        const result = await databases.createDocument(
          DATABASE_ID,
          COLLECTION_ID,
          ID.unique(),
          entry
        );
        successCount++;
        if (i < 5) { // Log first few successes
          console.log(`✅ Created document ${i + 1}:`, result.$id);
        }
      } catch (docError) {
        console.error(`❌ Failed to create document ${i}:`, docError);
        // Stop after first failure to avoid spam
        if (successCount === 0) break;
      }
    }

    localStorage.setItem("leaderboard_seeded_version", "2");
    console.log(`✅ Successfully created ${successCount}/${scoreEntries.length} score entries`);
  } catch (error) {
    console.error("❌ Error seeding leaderboard:", error);
    // Don't throw error to prevent app from crashing
    console.log("🔄 Continuing without seeding...");
  }
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
    console.log(`🏆 All-time leaderboard: ${result.length} unique players`);
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
    console.log(`🏆 getTodayLeaderboard: Returning ${result.length} players with daily scores`);
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

// Reset seeding flag (for debugging/testing)
function resetLeaderboardSeeding() {
  localStorage.removeItem("leaderboard_seeded_version");
  console.log("🔄 Leaderboard seeding flag reset - will reseed on next leaderboard load");
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
