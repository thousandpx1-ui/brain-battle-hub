import { Brain, Eye, Gamepad2, Bomb, Grid3X3, Zap } from "lucide-react";

export const GAMES = [
  {
    id: "memory",
    name: "Memory Collapse",
    description: "Recall the sequence of numbered tiles before they vanish.",
    gradient: "game-gradient-1",
    icon: Brain,
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
    name: "Color Blast",
    description: "Match 3+ same-colored blocks to blast them and beat the timer!",
    gradient: "game-gradient-5",
    icon: Grid3X3,
  },
  {
    id: "blockblast",
    name: "Block Blast",
    description: "Tap 3+ connected neon blocks to blast! Fast-paced time pressure!",
    gradient: "game-gradient-6",
    icon: Zap,
  },
];

export const getGameById = (id: string) => GAMES.find(g => g.id === id);
