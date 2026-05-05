const db = require('better-sqlite3')(':memory:');
db.exec(`CREATE TABLE leaderboard (user_id TEXT, score INTEGER, profile_frame TEXT, profile_image TEXT, created_at TEXT)`);
db.exec(`INSERT INTO leaderboard VALUES ('bob', 10, 'old_frame', 'old_image', 'now')`);

const stmt = db.prepare(`UPDATE leaderboard SET 
  score = score + ?, 
  profile_frame = CASE WHEN ? = 'none' THEN NULL WHEN ? IS NOT NULL THEN ? ELSE profile_frame END, 
  profile_image = CASE WHEN ? = 'none' THEN NULL WHEN ? IS NOT NULL THEN ? ELSE profile_image END, 
  created_at = ? 
  WHERE user_id = ?`);

stmt.run(5, null, null, null, null, null, null, 'now', 'bob');
console.log(db.prepare('SELECT * FROM leaderboard').all());
