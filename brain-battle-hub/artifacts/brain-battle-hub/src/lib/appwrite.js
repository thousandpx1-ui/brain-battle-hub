import { Client, Databases, ID } from "appwrite";

const client = new Client();

client
  .setEndpoint(import.meta.env.VITE_APPWRITE_ENDPOINT || "https://sgp.cloud.appwrite.io/v1")
  .setProject(import.meta.env.VITE_APPWRITE_PROJECT_ID || "69d5081d003dd1e2fe0a");

const DATABASE_ID = "leaderboardDB";
const COLLECTION_ID = "scores";

const databases = new Databases(client);

async function submitScoreFull(username: string, gameId: string, score: number, gameName: string = "unknown") {
  try {
    await databases.createDocument(
      DATABASE_ID,
      COLLECTION_ID,
      ID.unique(),
      {
        username,
        gameId,
        score,
        gameName,
        createdAt: new Date().toISOString(),
      }
    );
    console.log(`Full score submitted: ${username} ${gameId} ${score}`);
  } catch (error) {
    console.error("Error submitting score:", error);
  }
}

async function saveScore(score, game = "unknown") {
  try {
    // Check if user already has scores
    const res = await databases.listDocuments(DATABASE_ID, COLLECTION_ID);
    const existing = res.documents.find(d => d.userId === "guest");

    if (!existing) {
      // First time - create new document
      await databases.createDocument(
        DATABASE_ID,
        COLLECTION_ID,
        ID.unique(),
        {
          score: score,
          userId: "guest",
          game: game
        }
      );
      console.log("Score saved:", score);
    } else if (score > existing.score) {
      // Update only if new score is higher
      await databases.updateDocument(
        DATABASE_ID,
        COLLECTION_ID,
        existing.$id,
        { score: score }
      );
      console.log("Score updated (higher):", score);
    } else {
      console.log("Score not saved (lower or equal):", score, "vs best:", existing.score);
    }
  } catch (error) {
    console.error("Error saving score:", error);
  }
}

async function getFullLeaderboard(period: 'global' | 'daily' = 'global'): Promise<any[]> {
  try {
    const res = await databases.listDocuments(DATABASE_ID, COLLECTION_ID);
    let docs = res.documents;

    // Filter daily
    if (period === 'daily') {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      docs = docs.filter(doc => {
        if (!doc.createdAt) return false;
        const docDate = new Date(doc.createdAt);
        return docDate >= today;
      });
    }

    // Dedup: best score per username
    const bestMap = new Map();
    for (const doc of docs) {
      if (!doc.username) continue;
      const existing = bestMap.get(doc.username);
      if (!existing || doc.score > existing.score) {
        bestMap.set(doc.username, doc);
      }
    }

    const leaderboard = Array.from(bestMap.values()).sort((a, b) => b.score - a.score);
    console.log(`Leaderboard ${period}:`, leaderboard.length, 'entries');
    return leaderboard;
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    return [];
  }
}

async function getLeaderboard() {
  return getFullLeaderboard('global'); // Legacy
}

export { client, databases, ID, saveScore, submitScoreFull, getFullLeaderboard, getLeaderboard, DATABASE_ID, COLLECTION_ID };
