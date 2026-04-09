import { Client, Databases, ID } from "appwrite";

function log(msg) {
  const div = document.createElement("div");
  div.innerText = msg;
  div.style.color = "red";
  document.body.appendChild(div);
}

const client = new Client();

client
  .setEndpoint(import.meta.env.VITE_APPWRITE_ENDPOINT || "https://cloud.appwrite.io/v1")
  .setProject(import.meta.env.VITE_APPWRITE_PROJECT_ID || "69d5081d003dd1e2fe0a");

const DATABASE_ID = "leaderboardDB";
const COLLECTION_ID = "scores";

const databases = new Databases(client);

async function saveScore(score, game = "unknown") {
  log("Saving score: " + score);

  try {
    // Check if user already has scores
    const res = await databases.listDocuments(DATABASE_ID, COLLECTION_ID);
    const existing = res.documents.find(d => d.userId === "guest");

    if (!existing) {
      // First time - create new document
      const res = await databases.createDocument(
        DATABASE_ID,
        COLLECTION_ID,
        ID.unique(),
        {
          score: score,
          userId: "guest",
          game: game
        }
      );
      log("Saved successfully: " + JSON.stringify(res));
    } else if (score > existing.score) {
      // Update only if new score is higher
      await databases.updateDocument(
        DATABASE_ID,
        COLLECTION_ID,
        existing.$id,
        { score: score }
      );
      log("Score updated (higher): " + score);
    } else {
      log("Score not saved (lower or equal): " + score + " vs best: " + existing.score);
    }
  } catch (error) {
    log("SAVE ERROR: " + error.message);
  }
}

async function getFullLeaderboard(period) {
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
  return getFullLeaderboard('global');
}

export { client, databases, ID, saveScore, getLeaderboard, getFullLeaderboard, DATABASE_ID, COLLECTION_ID };
