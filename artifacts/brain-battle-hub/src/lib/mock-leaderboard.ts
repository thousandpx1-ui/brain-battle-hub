export interface MockLeaderboardEntry {
  username: string;
  gameId: string;
  score: number;
  createdAt: string;
}

// Hardcoded deterministic mock data
const MOCK_ENTRIES: MockLeaderboardEntry[] = [
  { username: "AlexStorm", gameId: "memory", score: 495, createdAt: "2026-04-01T10:00:00Z" },
  { username: "BlazeFury", gameId: "blink", score: 482, createdAt: "2026-04-02T14:30:00Z" },
  { username: "DexNova", gameId: "memory", score: 458, createdAt: "2026-04-01T16:45:00Z" },
  { username: "EchoWave", gameId: "blink", score: 445, createdAt: "2026-04-04T11:20:00Z" },
  { username: "GlimmerX", gameId: "memory", score: 420, createdAt: "2026-04-05T13:10:00Z" },
  { username: "HexPulse", gameId: "blink", score: 408, createdAt: "2026-04-03T17:30:00Z" },
  { username: "JoltZap", gameId: "memory", score: 383, createdAt: "2026-04-06T15:45:00Z" },
  { username: "KiraFlash", gameId: "blink", score: 370, createdAt: "2026-04-04T10:30:00Z" },
  { username: "MysticAce", gameId: "memory", score: 345, createdAt: "2026-04-07T08:15:00Z" },
  { username: "NexaFlow", gameId: "blink", score: 333, createdAt: "2026-04-05T14:20:00Z" },
  { username: "PixelDrift", gameId: "memory", score: 308, createdAt: "2026-04-06T09:30:00Z" },
  { username: "QuinnBolt", gameId: "blink", score: 295, createdAt: "2026-04-04T16:00:00Z" },
  { username: "SkyPulse", gameId: "memory", score: 270, createdAt: "2026-04-07T10:45:00Z" },
  { username: "TurboFrost", gameId: "blink", score: 258, createdAt: "2026-04-05T17:30:00Z" },
  { username: "VexNova", gameId: "memory", score: 233, createdAt: "2026-04-06T14:15:00Z" },
  { username: "WolfByte", gameId: "blink", score: 220, createdAt: "2026-04-03T08:30:00Z" },
  { username: "YukiFlash", gameId: "memory", score: 195, createdAt: "2026-04-07T11:00:00Z" },
  { username: "ZephyrX", gameId: "blink", score: 183, createdAt: "2026-04-05T15:30:00Z" },
  { username: "BoltStrike", gameId: "memory", score: 158, createdAt: "2026-04-06T16:20:00Z" },
  { username: "CyberPunk", gameId: "blink", score: 145, createdAt: "2026-04-02T09:00:00Z" },
  { username: "EmberGlow", gameId: "memory", score: 120, createdAt: "2026-04-04T18:45:00Z" },
  { username: "FluxMaster", gameId: "blink", score: 108, createdAt: "2026-04-07T07:30:00Z" },
  { username: "HyperionX", gameId: "memory", score: 83, createdAt: "2026-04-06T10:00:00Z" },
  { username: "IonStorm", gameId: "blink", score: 70, createdAt: "2026-04-01T15:30:00Z" },
  { username: "KrakenEye", gameId: "memory", score: 45, createdAt: "2026-04-03T16:00:00Z" },
  { username: "LaserBeam", gameId: "blink", score: 33, createdAt: "2026-04-04T08:30:00Z" },
  { username: "NebulaDrift", gameId: "memory", score: 15, createdAt: "2026-04-05T09:15:00Z" },
  { username: "OmegaPulse", gameId: "blink", score: 12, createdAt: "2026-04-06T11:30:00Z" },
  { username: "QuantumLeap", gameId: "memory", score: 8, createdAt: "2026-04-02T14:45:00Z" },
  { username: "RapidFire", gameId: "blink", score: 6, createdAt: "2026-04-03T10:30:00Z" },
  { username: "ThunderBolt", gameId: "memory", score: 4, createdAt: "2026-04-07T08:45:00Z" },
  { username: "VortexX", gameId: "blink", score: 3, createdAt: "2026-04-05T16:30:00Z" },
  { username: "XtremeGamer", gameId: "memory", score: 1, createdAt: "2026-04-01T11:15:00Z" },
  { username: "ZenithPro", gameId: "blink", score: 1, createdAt: "2026-04-02T18:00:00Z" },
];

export function generateMockLeaderboard(_count: number = 50): MockLeaderboardEntry[] {
  return [...MOCK_ENTRIES];
}
