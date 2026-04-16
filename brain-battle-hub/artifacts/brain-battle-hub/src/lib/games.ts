import { Brain, Eye, Gamepad2, Grid3X3, Bomb } from "lucide-react";

export const GAMES = [
  {
    id: "blockblast",
    name: "Block Blast",
    description: "Tap groups of 3+ matching blocks to blast them!",
    gradient: "game-gradient-3",
    icon: Grid3X3,
  },
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
];

export const getGameById = (id: string) => GAMES.find(g => g.id === id);
