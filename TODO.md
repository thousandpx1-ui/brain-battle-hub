# Fix Score Leaderboard Cap at 100 - Appwrite Integration (Continued)

## Progress
Completed: 4/8

**Step 1: appwrite.js updates** ✅
- [x] Add `createdAt` to save/submit
- [x] `getFullLeaderboard(global|daily)`: listDocuments → filter/sort desc score
- [x] `submitScoreFull`: createDocument per score (username)

**Step 2: leaderboard.tsx** ✅
- [x] Import getFullLeaderboard
- [x] useState remoteData, useEffect fetch on period/username change
- [x] Replace localScores with appwrite data + dedup/sort logic (server-side)
- [x] Player rank calc from remote (w/ local fallback)

**Step 3: home.tsx** ✅
- [x] Similar fetch top 5

**Step 4: game.tsx** ✅
- [x] Add submitScoreFull alongside saveScore for full list
- [x] Both normal + doubled

**Step 5: Test**
- [x] Submit score >100
- [x] Check leaderboard shows uncapped
- [x] Daily filter
- [x] Error fallback to local

**Step 6: Cleanup**
- [ ] Remove local-leaderboard if stable
- [ ] Polish loading states

**Step 7: attempt_completion**
