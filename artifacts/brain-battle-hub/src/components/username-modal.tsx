import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { useAppState } from "../hooks/useAppState";

export function UsernameModal({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const [name, setName] = useState("");
  const setUsername = useAppState((s) => s.setUsername);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim().length > 2) {
      setUsername(name.trim());
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[340px] rounded-[24px]">
        <DialogHeader>
          <DialogTitle className="text-2xl text-center">Choose Username</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 mt-2">
          <Input 
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Player123"
            className="h-14 text-lg text-center rounded-xl bg-gray-50 border-gray-200"
            maxLength={15}
          />
          <Button type="submit" disabled={name.trim().length < 3} className="h-14 rounded-xl text-lg font-bold">
            Start Playing
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
