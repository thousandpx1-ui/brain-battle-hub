import { Brain, Eye, Gamepad2, Bomb, Grid3X3, Layers, Activity, Sword } from "lucide-react";

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
  {
    id: "neonbounce",
    name: "Neon Bounce",
    description: "Keep the glowing ball bouncing! Move the paddle to prevent it from falling.",
    gradient: "game-gradient-1", // Reusing a gradient since we only have up to 5 probably, or just game-gradient-1
    icon: Activity,
  },
  {
    id: "fruitslice",
    name: "Fruit Slice",
    description: "Swipe to slice the flying fruits, but avoid the bombs!",
    gradient: "game-gradient-2",
    icon: Sword,
  },
];

export const getGameById = (id: string) => GAMES.find(g => g.id === id);
