import { useState, useEffect } from "react";
import { Button } from "./ui/button";

export function RewardAd({ open, onReward, onCancel }: { open: boolean; onReward: () => void; onCancel: () => void }) {
  const [timeLeft, setTimeLeft] = useState(3);

  useEffect(() => {
    if (open) {
      setTimeLeft(3);
      const timer = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            onReward();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [open, onReward]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-black/90 flex flex-col items-center justify-center p-4 max-w-[430px] mx-auto">
      <div className="w-full max-w-sm bg-white rounded-3xl p-6 text-center">
        <h2 className="text-xl font-bold mb-2">Watching Ad...</h2>
        <p className="text-gray-500 mb-6">Please wait to receive your reward.</p>
        
        <div className="w-24 h-24 rounded-full border-4 border-primary border-t-transparent animate-spin mx-auto mb-6" />
        
        <div className="text-3xl font-bold text-primary mb-6">{timeLeft}</div>
        
        <Button variant="ghost" onClick={onCancel} className="text-gray-400">Cancel</Button>
      </div>
    </div>
  );
}
