import { Brain, Eye, Coins } from "lucide-react";

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
    id: "risk",
    name: "Risk or Safe",
    description: "Bank your points or risk it all for double.",
    gradient: "game-gradient-3",
    icon: Coins,
  },
];

export const getGameById = (id: string) => GAMES.find(g => g.id === id);
