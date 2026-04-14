import { Brain, Eye, Gamepad2 } from "lucide-react";

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
    name: "Simon Says",
    description: "Watch the color sequence and repeat it from memory.",
    gradient: "game-gradient-4",
    icon: Gamepad2,
  },
];

export const getGameById = (id: string) => GAMES.find(g => g.id === id);
