import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { Button } from "./ui/button";

export function InterstitialAd({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const [timeLeft, setTimeLeft] = useState(5);

  useEffect(() => {
    if (open) {
      setTimeLeft(5);
      const timer = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
    return undefined;
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-black/90 flex flex-col max-w-[430px] mx-auto">
      <div className="flex justify-between items-center p-4">
        <span className="text-white text-sm">Advertisement</span>
        {timeLeft === 0 ? (
          <button onClick={() => onOpenChange(false)} className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white">
            <X className="w-5 h-5" />
          </button>
        ) : (
          <span className="text-white/70 text-sm">Skip in {timeLeft}</span>
        )}
      </div>
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center p-6 bg-white/10 rounded-2xl border border-white/20">
          <p className="text-white/50 mb-2 uppercase tracking-widest text-xs font-bold">Sponsor</p>
          <h2 className="text-2xl font-bold text-white mb-4">Awesome Mobile Game</h2>
          <div className="w-48 h-48 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl mb-6 mx-auto shadow-2xl flex items-center justify-center">
            <span className="text-white font-bold text-xl">AD</span>
          </div>
          <Button className="w-full h-12 text-lg rounded-full" disabled={timeLeft > 0}>
            Download Now
          </Button>
        </div>
      </div>
    </div>
  );
}
