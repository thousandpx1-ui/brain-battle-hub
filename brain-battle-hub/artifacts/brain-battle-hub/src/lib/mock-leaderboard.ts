import { GAMES } from "@/lib/games";

const RANDOM_NAMES = [
  "AlexStorm", "BlazeFury", "CocoByte", "DexNova", "EchoWave",
  "FrostBit", "GlimmerX", "HexPulse", "IrisNeo", "JoltZap",
  "KiraFlash", "LunaSpark", "MysticAce", "NexaFlow", "OrionBit",
  "PixelDrift", "QuinnBolt", "RavenX", "SkyPulse", "TurboFrost",
  "UltraVibe", "VexNova", "WolfByte", "XenoWave", "YukiFlash",
  "ZephyrX", "AeroBlitz", "BoltStrike", "CyberPunk", "DeltaForce",
  "EmberGlow", "FluxMaster", "GhostRider", "HyperionX", "IonStorm",
  "JetStream", "KrakenEye", "LaserBeam", "MeteorX", "NebulaDrift",
  "OmegaPulse", "PhantomX", "QuantumLeap", "RapidFire", "SolarFlare",
  "ThunderBolt", "VortexX", "WarriorX", "XtremeGamer", "ZenithPro",
  "AlphaStrike", "BetaWave", "CosmicRay"
];

export interface MockLeaderboardEntry {
  username: string;
  gameId: string;
  score: number;
  createdAt: string;
}

export function generateMockLeaderboard(count: number = 50): MockLeaderboardEntry[] {
  const gameIds = GAMES.map(g => g.id);
  const baseDate = new Date();
  
  return Array.from({ length: count }, (_, i) => {
    const baseScore = 500 - (i * 9.8);
    const randomVariation = Math.floor(Math.random() * 10) - 5;
    
    return {
      username: RANDOM_NAMES[i % RANDOM_NAMES.length],
      gameId: gameIds[Math.floor(Math.random() * gameIds.length)],
      score: Math.max(100, baseScore + randomVariation),
      createdAt: new Date(baseDate.getTime() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
    };
  });
}
