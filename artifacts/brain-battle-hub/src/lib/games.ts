import { Brain, Eye, Gamepad2, Bomb, Grid3X3, Layers } from "lucide-react";

export const GAMES = [
  {
    id: "memory",
    name: "Memory Collapse",
    description: "Recall the sequence of numbered tiles before they vanish.",
    gradient: "game-gradient-1",
    icon: Brain,
  },
  {
    id: "matchpairs",
    name: "Match Pairs",
    description: "Find all matching pairs before time runs out!",
    gradient: "game-gradient-3",
    icon: Layers,
  },
  {
    id: "blink",
    name: "Don't Blink",
    description: "Stop the moving bar exactly in the perfect zone.",
    gradient: "game-gradient-2",
    icon: Eye,
  },
  {
    id: "simon",
    name: "Rapid Tiles",
    description: "Watch the color sequence and repeat it from memory.",
    gradient: "game-gradient-4",
    icon: Gamepad2,
  },
  {
    id: "colorblast",
    name: "Block Blast",
    description: "Tap connected neon blocks, blast groups of 3+, and race the timer.",
    gradient: "game-gradient-5",
    icon: Grid3X3,
  },
];

export const getGameById = (id: string) => GAMES.find(g => g.id === id);
