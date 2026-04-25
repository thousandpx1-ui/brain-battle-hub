import { Link, useLocation } from "wouter";
import { Home, Gamepad2, Trophy, User } from "lucide-react";
import { InstallButton } from "./install-button";
import { GlobalAdBanner } from "./global-ad-banner";
import { ThemeToggle } from "./theme-toggle";

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();

  return (
    <div className="mx-auto w-full max-w-[430px] min-h-[100dvh] bg-background relative pb-[140px] shadow-2xl flex flex-col">
      <div className="absolute top-4 right-4 z-50">
        <ThemeToggle />
      </div>
      <InstallButton />
      <main className="flex-1 flex flex-col relative w-full h-full overflow-x-hidden overflow-y-auto">
        {children}
      </main>
      
      <div className="fixed bottom-0 w-full max-w-[430px] z-50 pointer-events-none flex flex-col justify-end">
        <div className="pointer-events-auto w-full relative z-40">
          <GlobalAdBanner />
        </div>
        <div className="pointer-events-auto w-full bg-background border-t border-border pb-safe relative z-50 shadow-[0_-4px_20px_rgba(0,0,0,0.1)]">
          <nav className="flex justify-around items-center h-16 px-4">
            <Link href="/" className={`flex flex-col items-center justify-center w-full h-full ${location === "/" ? "text-primary" : "text-muted-foreground hover:text-foreground"}`}>
              <Home className="w-6 h-6 mb-1" />
              <span className="text-[10px] font-medium">Home</span>
            </Link>
            <Link href="/games" className={`flex flex-col items-center justify-center w-full h-full ${location === "/games" ? "text-primary" : "text-muted-foreground hover:text-foreground"}`}>
              <Gamepad2 className="w-6 h-6 mb-1" />
              <span className="text-[10px] font-medium">Games</span>
            </Link>
            <Link href="/leaderboard" className={`flex flex-col items-center justify-center w-full h-full ${location === "/leaderboard" ? "text-primary" : "text-muted-foreground hover:text-foreground"}`}>
              <Trophy className="w-6 h-6 mb-1" />
              <span className="text-[10px] font-medium">Rank</span>
            </Link>
            <Link href="/profile" className={`flex flex-col items-center justify-center w-full h-full ${location === "/profile" ? "text-primary" : "text-muted-foreground hover:text-foreground"}`}>
              <User className="w-6 h-6 mb-1" />
              <span className="text-[10px] font-medium">Profile</span>
            </Link>
        </nav>
      </div>
    </div>
    </div>
  );
}
