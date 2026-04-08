/**
 * Seed Script for Leaderboard
 * Run this ONCE to populate the leaderboard with 52 fake players
 * 
 * Usage:
 * - Browser: Open browser console and paste this code
 * - Or import and call: import { seedLeaderboard } from "@/lib/appwrite.js"
 *   then run: await seedLeaderboard()
 */

import { seedLeaderboard } from "./appwrite.js";

// Auto-seed on import (for one-time manual execution)
(async function() {
  console.log("🌱 Starting leaderboard seeding...");
  try {
    await seedLeaderboard();
    console.log("✅ Seeding complete!");
  } catch (error) {
    console.error("❌ Seeding failed:", error);
  }
})();
