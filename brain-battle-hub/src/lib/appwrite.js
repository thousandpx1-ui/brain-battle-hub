import { Client, Databases, ID } from "appwrite";

const client = new Client();

client
  .setEndpoint(import.meta.env.VITE_APPWRITE_ENDPOINT || "https://sgp.cloud.appwrite.io/v1")
  .setProject(import.meta.env.VITE_APPWRITE_PROJECT_ID || "69d5081d003dd1e2fe0a");

const DATABASE_ID = "leaderboardDB";
const COLLECTION_ID = "scores";

const databases = new Databases(client);

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

async function getLeaderboard() {
  const res = await databases.listDocuments(
    DATABASE_ID,
    COLLECTION_ID
  );

  const sorted = res.documents.sort((a, b) => b.score - a.score);

  console.log(sorted);
  return sorted;
}

export { client, databases, ID, saveScore, getLeaderboard, DATABASE_ID, COLLECTION_ID };
