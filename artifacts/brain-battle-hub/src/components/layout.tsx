import { Link, useLocation } from "wouter";
import { Home, Gamepad2, Trophy, User } from "lucide-react";
import { InstallButton } from "./install-button";

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();

  return (
    <div className="mx-auto w-full max-w-[430px] min-h-[100dvh] bg-white relative pb-32 shadow-2xl flex flex-col">
      <InstallButton />
      <main className="flex-1 flex flex-col relative w-full h-full overflow-x-hidden overflow-y-auto">
        {children}
      </main>
      
      <div className="fixed bottom-0 w-full max-w-[430px] z-50 bg-white border-t border-gray-100 pb-safe">
        <nav className="flex justify-around items-center h-16 px-4">
            <Link href="/" className={`flex flex-col items-center justify-center w-full h-full ${location === "/" ? "text-primary" : "text-gray-400"}`}>
              <Home className="w-6 h-6 mb-1" />
              <span className="text-[10px] font-medium">Home</span>
            </Link>
            <Link href="/games" className={`flex flex-col items-center justify-center w-full h-full ${location === "/games" ? "text-primary" : "text-gray-400"}`}>
              <Gamepad2 className="w-6 h-6 mb-1" />
              <span className="text-[10px] font-medium">Games</span>
            </Link>
            <Link href="/leaderboard" className={`flex flex-col items-center justify-center w-full h-full ${location === "/leaderboard" ? "text-primary" : "text-gray-400"}`}>
              <Trophy className="w-6 h-6 mb-1" />
              <span className="text-[10px] font-medium">Rank</span>
            </Link>
            <Link href="/profile" className={`flex flex-col items-center justify-center w-full h-full ${location === "/profile" ? "text-primary" : "text-gray-400"}`}>
              <User className="w-6 h-6 mb-1" />
              <span className="text-[10px] font-medium">Profile</span>
            </Link>
        </nav>
      </div>
    </div>
  );
}
