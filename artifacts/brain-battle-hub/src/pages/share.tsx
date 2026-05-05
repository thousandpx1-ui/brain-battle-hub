import { useParams, Link } from "wouter";
import { Layout } from "@/components/layout";
import { getGameById } from "@/lib/games";
import { Button } from "@/components/ui/button";
import { Play } from "lucide-react";

export default function Share() {
  const { gameId, score } = useParams();
  const game = getGameById(gameId || "");

  if (!game) {
    return (
      <Layout>
        <div className="flex-1 flex flex-col items-center justify-center text-center">
          <h1 className="text-4xl font-black text-red-500 mb-4">Game Not Found</h1>
          <p className="text-gray-500 mb-8">
            The game you are looking for does not exist.
          </p>
          <Link href="/">
            <Button>Go Home</Button>
          </Link>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="flex-1 flex flex-col items-center justify-center text-center p-6">
        <div className="bg-white p-8 rounded-[32px] shadow-xl shadow-gray-100 w-full max-w-sm mb-6 border border-gray-100">
          <p className="text-gray-400 font-bold uppercase tracking-widest text-sm mb-2">
            {game.name}
          </p>
          <h2 className="text-8xl font-black text-primary">{score}</h2>
        </div>

        <div className="flex flex-col gap-3 w-full max-w-sm">
          <Link href={`/game/${game.id}`}>
            <Button className="w-full h-14 rounded-2xl text-lg font-bold flex items-center gap-2">
              <Play className="w-5 h-5 fill-white" />
              Play {game.name}
            </Button>
          </Link>
          <Link href="/leaderboard">
            <Button variant="outline" className="w-full h-14 rounded-2xl text-lg font-bold">
              View Leaderboard
            </Button>
          </Link>
        </div>
      </div>
    </Layout>
  );
}