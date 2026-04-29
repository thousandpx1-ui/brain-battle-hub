import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { UpdateChecker } from "@/components/update-checker";
import { AdBlockDetector } from "@/components/ad-block-detector";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import Leaderboard from "@/pages/leaderboard";
import Profile from "@/pages/profile";
import Game from "@/pages/game";
import Games from "@/pages/games";

const queryClient = new QueryClient();

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/games" component={Games} />
      <Route path="/leaderboard" component={Leaderboard} />
      <Route path="/profile" component={Profile} />
      <Route path="/game/:gameId" component={Game} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="light" forcedTheme="light" attribute="class">
        <TooltipProvider>
          <WouterRouter base={(import.meta.env.BASE_URL || "/").replace(/\/$/, "")}>
            <Router />
          </WouterRouter>
          <Toaster />
          <UpdateChecker />
          <AdBlockDetector />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
