import { useEffect, useState } from "react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { Layout } from "@/components/layout";
import { GAMES } from "@/lib/games";
import { useAppState } from "@/hooks/useAppState";
import { Flame, Play, Sparkles } from "lucide-react";
import { UsernameModal } from "@/components/username-modal";

export default function Home() {
  const { username, streak, updateStreak } = useAppState();
  const [showUsername, setShowUsername] = useState(false);

  useEffect(() => {
    updateStreak();
    if (!username) {
      setShowUsername(true);
    }
  }, [updateStreak, username]);

  return (
    <Layout>
      <div className="flex-1 p-6 flex flex-col gap-6 pt-10">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-black text-gray-900 tracking-tight flex items-center gap-2">
              Brain Battle
              <Sparkles className="w-6 h-6 text-yellow-400 fill-yellow-400" />
            </h1>
            {username && <p className="text-gray-500 font-medium mt-1">Ready, {username}?</p>}
          </div>
          
          <div className="bg-orange-50 px-3 py-1.5 rounded-full flex items-center gap-1 border border-orange-100">
            <Flame className="w-4 h-4 text-orange-500 fill-orange-500" />
            <span className="font-bold text-orange-600 text-sm">{streak}</span>
          </div>
        </div>

        <div className="flex flex-col gap-4 mt-4">
          {GAMES.map((game, i) => (
            <motion.div
              key={game.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
            >
              <Link href={`/game/${game.id}`}>
                <div className={`${game.gradient} p-5 rounded-[24px] shadow-lg shadow-gray-200 text-white relative overflow-hidden group cursor-pointer`}>
                  <div className="absolute top-0 right-0 p-4 opacity-20 transform translate-x-4 -translate-y-4">
                    <game.icon className="w-24 h-24" />
                  </div>
                  
                  <div className="relative z-10">
                    <div className="bg-white/20 w-10 h-10 rounded-xl flex items-center justify-center mb-3 backdrop-blur-sm">
                      <game.icon className="w-5 h-5 text-white" />
                    </div>
                    <h3 className="text-xl font-bold mb-1">{game.name}</h3>
                    <p className="text-white/80 text-sm mb-4 leading-tight max-w-[85%]">{game.description}</p>
                    
                    <div className="bg-white/20 backdrop-blur-sm py-2 px-4 rounded-full inline-flex items-center gap-2 text-sm font-bold">
                      <Play className="w-4 h-4 fill-white" />
                      PLAY NOW
                    </div>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>

      <UsernameModal open={showUsername} onOpenChange={setShowUsername} />
    </Layout>
  );
}
