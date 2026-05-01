const db = require('better-sqlite3')(':memory:');
db.exec(`CREATE TABLE leaderboard (user_id TEXT, username TEXT, score INTEGER)`);
db.exec(`INSERT INTO leaderboard VALUES ('user1', 'user1', 50)`);
db.exec(`INSERT INTO leaderboard VALUES ('user2', 'user2', 100)`);
// Now let's try the UPDATE
let stmt = db.prepare(`UPDATE leaderboard SET score = score + ? WHERE user_id = ?`);
stmt.run(20, 'user1');

console.log('Results:');
console.log(db.prepare('SELECT user_id, MAX(score) as score FROM leaderboard GROUP BY user_id ORDER BY score DESC').all());
