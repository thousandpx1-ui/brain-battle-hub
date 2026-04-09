import { useState } from "react";
import { Layout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useAppState } from "@/hooks/useAppState";
import { useLocalLeaderboard } from "@/lib/local-leaderboard";
import { Camera, User } from "lucide-react";

const frames = [
  { id: 'none', name: 'None', style: '' },
  { id: 'gold', name: 'Gold', style: 'border-4 border-yellow-400 rounded-full' },
  { id: 'silver', name: 'Silver', style: 'border-4 border-gray-400 rounded-full' },
  { id: 'bronze', name: 'Bronze', style: 'border-4 border-amber-600 rounded-full' },
  { id: 'blue', name: 'Blue', style: 'border-4 border-blue-500 rounded-full' },
  { id: 'red', name: 'Red', style: 'border-4 border-red-500 rounded-full' },
  { id: 'green', name: 'Green', style: 'border-4 border-green-500 rounded-full' },
  { id: 'purple', name: 'Purple', style: 'border-4 border-purple-500 rounded-full' },
  { id: 'rainbow', name: 'Rainbow', style: 'bg-gradient-to-r from-red-500 via-yellow-500 via-green-500 via-blue-500 to-purple-500 rounded-full p-1' },
  { id: 'black', name: 'Black', style: 'border-4 border-black rounded-full' },
];

function formatScore(score: number): string {
  const num = Math.floor(score);

  if (num >= 1000000000) {
    return (num / 1000000000).toFixed(1).replace(/\.0$/, '') + 'B';
  }
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'k';
  }

  return num.toString();
}

export default function Profile() {
  const { username, setUsername, profileImage, setProfileImage, profileFrame, setProfileFrame } = useAppState();
  const { scores, updateUsername } = useLocalLeaderboard();
  const [editingName, setEditingName] = useState(false);
  const [tempName, setTempName] = useState(username || "");

  const handleNameSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (tempName.trim().length > 2 && username) {
      const oldName = username;
      const newName = tempName.trim();
      setUsername(newName);
      updateUsername(oldName, newName);
      setEditingName(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setProfileImage(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setProfileImage(null);
  };

  // Calculate stats
  const userScores = scores.filter(score => score.username === username);
  const totalGamesPlayed = userScores.length;
  const totalScore = userScores.reduce((sum, score) => sum + score.score, 0);

  return (
    <Layout>
      <div className="flex-1 bg-gray-50 flex flex-col">
        <div className="bg-white px-6 pt-10 pb-6 rounded-b-[32px] shadow-sm z-10 relative">
          <h1 className="text-3xl font-black text-gray-900 mb-6">Profile</h1>
        </div>

        <div className="flex-1 p-6">
          <div className="bg-white rounded-2xl p-6 shadow-sm space-y-6">
            {/* Avatar Section */}
            <div className="flex flex-col items-center space-y-4">
              <div className="relative">
                <div className={`${frames.find(f => f.id === profileFrame)?.style || ''}`}>
                  {profileFrame === 'rainbow' ? (
                    <div className="bg-white rounded-full p-1">
                      <Avatar className="w-22 h-22">
                        <AvatarImage src={profileImage || undefined} alt={username || "User"} />
                        <AvatarFallback className="text-xl">
                          <User className="w-7 h-7" />
                        </AvatarFallback>
                      </Avatar>
                    </div>
                  ) : (
                    <Avatar className="w-24 h-24">
                      <AvatarImage src={profileImage || undefined} alt={username || "User"} />
                      <AvatarFallback className="text-2xl">
                        <User className="w-8 h-8" />
                      </AvatarFallback>
                    </Avatar>
                  )}
                </div>
                <label className="absolute bottom-0 right-0 bg-primary text-white rounded-full p-2 cursor-pointer hover:bg-primary/90 transition-colors">
                  <Camera className="w-4 h-4" />
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                </label>
              </div>
              {profileImage && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={removeImage}
                  className="text-red-600 border-red-200 hover:bg-red-50"
                >
                  Remove Photo
                </Button>
              )}
            </div>

            {/* Profile Frame Section */}
            <div className="space-y-3">
              <label className="text-sm font-medium text-gray-700">Profile Frame</label>
              <div className="grid grid-cols-5 gap-2">
                {frames.map((frame) => (
                  <button
                    key={frame.id}
                    onClick={() => setProfileFrame(frame.id === 'none' ? null : frame.id)}
                    className={`p-2 rounded-lg border-2 ${
                      (profileFrame === frame.id || (frame.id === 'none' && !profileFrame))
                        ? 'border-primary bg-primary/10'
                        : 'border-gray-200 hover:border-gray-300'
                    } transition-colors`}
                  >
                    <div className={`w-8 h-8 mx-auto ${frame.style}`}>
                      {frame.id === 'rainbow' ? (
                        <div className="bg-white rounded-full p-0.5">
                          <div className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center">
                            <User className="w-3 h-3" />
                          </div>
                        </div>
                      ) : (
                        <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                          <User className="w-4 h-4" />
                        </div>
                      )}
                    </div>
                    <div className="text-xs mt-1 text-center">{frame.name}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Username Section */}
            <div className="space-y-3">
              <label className="text-sm font-medium text-gray-700">Username</label>
              {editingName ? (
                <form onSubmit={handleNameSubmit} className="space-y-3">
                  <Input
                    value={tempName}
                    onChange={(e) => setTempName(e.target.value)}
                    placeholder="Enter username"
                    maxLength={15}
                    className="h-12"
                  />
                  <div className="flex gap-2">
                    <Button type="submit" disabled={tempName.trim().length < 3} className="flex-1">
                      Save
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setEditingName(false);
                        setTempName(username || "");
                      }}
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              ) : (
                <div className="flex items-center justify-between">
                  <span className="text-lg font-semibold">{username || "No username set"}</span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setEditingName(true)}
                  >
                    Edit
                  </Button>
                </div>
              )}
            </div>

            {/* Stats Section */}
            <div className="pt-4 border-t border-gray-100">
              <h3 className="text-lg font-semibold mb-3">Game Stats</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-primary">{totalGamesPlayed}</div>
                  <div className="text-sm text-gray-600">Games Played</div>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-primary">{formatScore(totalScore)}</div>
                  <div className="text-sm text-gray-600">Total Score</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}