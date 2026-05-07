import { useState, useEffect } from "react";
import { Layout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useAppState } from "@/hooks/useAppState";
import { useCoins } from "@/hooks/useCoins";
import { useLocalLeaderboard } from "@/lib/local-leaderboard";
import { saveScoreRealtime, updateProfileRealtime, loadLeaderboardRealtime } from "@/lib/realtime-leaderboard";
import { User } from "lucide-react";

const customAvatars = [
  "https://api.dicebear.com/7.x/bottts/svg?seed=Felix",
  "https://api.dicebear.com/7.x/bottts/svg?seed=Aneka",
  "https://api.dicebear.com/7.x/bottts/svg?seed=Jude",
  "https://api.dicebear.com/7.x/bottts/svg?seed=Oliver",
  "https://api.dicebear.com/7.x/bottts/svg?seed=Sophie",
  "https://api.dicebear.com/7.x/bottts/svg?seed=Max",
  "https://api.dicebear.com/7.x/bottts/svg?seed=Bella",
  "https://api.dicebear.com/7.x/bottts/svg?seed=Luna",
  "https://api.dicebear.com/7.x/bottts/svg?seed=Charlie",
  "https://api.dicebear.com/7.x/bottts/svg?seed=Milo",
];

type Frame = { id: string; name: string; style: string; image?: string };

const frames: Frame[] = [
  { id: 'none', name: 'None', style: '' },
  { id: 'gold', name: 'Gold', style: 'border-4 border-yellow-400 rounded-full' },
  { id: 'silver', name: 'Silver', style: 'border-4 border-gray-400 rounded-full' },
  { id: 'bronze', name: 'Bronze', style: 'border-4 border-amber-600 rounded-full' },
  { id: 'blue', name: 'Blue', style: 'border-4 border-blue-500 rounded-full' },
  { id: 'red', name: 'Red', style: 'border-4 border-red-500 rounded-full' },
  { id: 'green', name: 'Green', style: 'border-4 border-green-500 rounded-full' },
  { id: 'purple', name: 'Purple', style: 'border-4 border-purple-500 rounded-full' },
  { id: 'rainbow', name: 'Prismatic', style: 'bg-gradient-to-r from-red-500 via-yellow-500 via-green-500 via-blue-500 to-purple-500 rounded-full p-1' },
  { id: 'black', name: 'Black', style: 'border-4 border-black rounded-full' },
];

const premiumFrames: Frame[] = [
  { id: 'premium-metallic', name: 'Metallic', style: '', image: '/frames/metallic-frame.png' },
];

const allFrames: Frame[] = [...frames, ...premiumFrames];

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
  const { username, setUsername, profileImage, setProfileImage, profileFrame, setProfileFrame, userId } = useAppState();
  const { scores, updateUsername } = useLocalLeaderboard();
  const { coins } = useCoins();
  const [editingName, setEditingName] = useState(false);
  const [tempName, setTempName] = useState(username || "");
  const [selectedFrame, setSelectedFrame] = useState(profileFrame);
  const [totalScore, setTotalScore] = useState(0);

  useEffect(() => {
    async function fetchScore() {
      if (!username) return;
      try {
        const players = await loadLeaderboardRealtime();
        const player = players.find(p => p.userId === username);
        if (player) {
          setTotalScore(player.score);
        } else {
          const userScores = scores.filter(score => score.username === username);
          setTotalScore(userScores.reduce((sum, score) => sum + score.score, 0));
        }
      } catch (err) {
        console.error(err);
        const userScores = scores.filter(score => score.username === username);
        setTotalScore(userScores.reduce((sum, score) => sum + score.score, 0));
      }
    }
    fetchScore();
  }, [username, scores]);

  const handleNameSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (tempName.trim().length > 2) {
      const newName = tempName.trim();
      setUsername(newName);
      if (username) {
        updateUsername(username, newName);
      }
      setEditingName(false);

      if (userId) {
        try {
          await updateProfileRealtime(userId, newName, selectedFrame, profileImage);
        } catch (err) {
          console.error("Failed to sync username to backend", err);
        }
      }
    }
  };

  const handleSaveAvatar = async (avatarUrl: string) => {
    setProfileImage(avatarUrl);

    if (username || userId) {
      const saveName = username || "player";
      try {
        await updateProfileRealtime(userId, saveName, selectedFrame, avatarUrl);
      } catch (err) {
        console.error("Failed to sync profile image to backend", err);
      }
    }
  };

  const handleSaveFrame = async () => {
    setProfileFrame(selectedFrame);

    if (username || userId) {
      const saveName = username || "player";
      try {
        await updateProfileRealtime(userId, saveName, selectedFrame, profileImage);
      } catch (err) {
        console.error("Failed to sync profile frame to backend", err);
      }
    }
  };

  // Calculate stats
  const userScores = scores.filter(score => score.username === username);
  // totalScore is now managed by state

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
              {(() => {
                const currentFrame = allFrames.find(f => f.id === selectedFrame);
                if (currentFrame && 'image' in currentFrame && currentFrame.image) {
                  return (
                    <div className="relative w-32 h-32 flex items-center justify-center">
                      <img src={currentFrame.image} alt="Frame" className="absolute inset-0 w-full h-full object-contain z-10 pointer-events-none scale-125" />
                      <Avatar className="w-24 h-24 relative z-0">
                        <AvatarImage src={profileImage || undefined} alt={username || "User"} />
                        <AvatarFallback className="text-2xl">
                          <User className="w-8 h-8" />
                        </AvatarFallback>
                      </Avatar>
                    </div>
                  );
                }
                return (
                  <div className={`${currentFrame?.style || ''} transition-all duration-300`}>
                    {selectedFrame === 'rainbow' ? (
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
                );
              })()}
            </div>

            {/* Custom Avatars Selection */}
            <div className="space-y-3">
              <label className="text-sm font-medium text-gray-700">Choose Avatar</label>
              <div className="grid grid-cols-5 gap-2">
                {customAvatars.map((avatar) => (
                  <button
                    key={avatar}
                    onClick={() => handleSaveAvatar(avatar)}
                    className={`p-1 rounded-lg border-2 flex items-center justify-center ${
                      profileImage === avatar
                        ? 'border-primary bg-primary/10'
                        : 'border-gray-200 hover:border-gray-300'
                    } transition-colors`}
                  >
                    <img src={avatar} alt="Avatar" className="w-10 h-10 rounded-full" />
                  </button>
                ))}
              </div>
            </div>

            {/* Profile Frames */}
            <div className="space-y-6">
              {/* Basic Frames */}
              <div className="space-y-3">
                <label className="text-sm font-medium text-gray-700">Basic Frames</label>
                <div className="grid grid-cols-5 gap-2">
                  {frames.map((frame) => (
                    <button
                      key={frame.id}
                      onClick={() => setSelectedFrame(frame.id === 'none' ? 'none' : frame.id)}
                      className={`h-16 p-1.5 rounded-lg border-2 flex flex-col items-center justify-center overflow-hidden ${
                        (selectedFrame === frame.id || (frame.id === 'none' && (!selectedFrame || selectedFrame === 'none')))
                          ? 'border-primary bg-primary/10'
                          : 'border-gray-200 hover:border-gray-300'
                      } transition-colors`}
                    >
                      <div className={`w-7 h-7 shrink-0 mx-auto ${frame.style}`}></div>
                      <div className="text-[10px] mt-1 text-center truncate w-full">{frame.name}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Premium Frames Section */}
              <div className="space-y-3">
                <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                  Premium Frames <span className="bg-purple-100 text-purple-700 text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">Pro</span>
                </label>
                <div className="grid grid-cols-5 gap-2">
                  {premiumFrames.map((frame) => (
                    <button
                      key={frame.id}
                      onClick={() => setSelectedFrame(frame.id)}
                      className={`h-16 p-1.5 rounded-lg border-2 flex flex-col items-center justify-center overflow-hidden ${
                        selectedFrame === frame.id
                          ? 'border-purple-500 bg-purple-50'
                          : 'border-gray-200 hover:border-gray-300'
                      } transition-colors`}
                    >
                      {'image' in frame && frame.image ? (
                        <div className="w-8 h-8 shrink-0 mx-auto relative flex items-center justify-center">
                          <img src={frame.image} alt="frame" className="absolute inset-0 w-full h-full object-contain pointer-events-none scale-125" />
                          <div className="w-5 h-5 bg-gray-200 rounded-full"></div>
                        </div>
                      ) : (
                        <div className={`w-7 h-7 shrink-0 mx-auto ${frame.style}`}></div>
                      )}
                      <div className="text-[10px] mt-1 text-center truncate w-full font-medium text-purple-800">{frame.name}</div>
                    </button>
                  ))}
                </div>
              </div>

              {selectedFrame !== profileFrame && (
                <Button onClick={handleSaveFrame} className="w-full">
                  Save Frame Changes
                </Button>
              )}
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
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-primary">{formatScore(totalScore)}</div>
                  <div className="text-sm text-gray-600">Total Score</div>
                </div>
                <div className="text-center p-4 bg-yellow-50 rounded-lg border border-yellow-100">
                  <div className="text-2xl font-bold text-yellow-700 flex items-center justify-center gap-1">
                    <span>🪙</span> {coins.toLocaleString()}
                  </div>
                  <div className="text-sm text-yellow-600 font-medium">Total Coins</div>

                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}