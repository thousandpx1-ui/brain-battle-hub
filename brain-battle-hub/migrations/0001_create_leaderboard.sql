-- Create leaderboard table
CREATE TABLE leaderboard (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,
    username TEXT NOT NULL,
    score INTEGER NOT NULL,
    game_id TEXT DEFAULT 'unknown',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Create index for faster queries
CREATE INDEX idx_username ON leaderboard(username);
CREATE INDEX idx_created_at ON leaderboard(created_at);
CREATE INDEX idx_score ON leaderboard(score DESC);