import { useState } from "react";
import { Layout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useAppState } from "@/hooks/useAppState";
import { Camera, User } from "lucide-react";

export default function Profile() {
  const { username, setUsername, profileImage, setProfileImage } = useAppState();
  const [editingName, setEditingName] = useState(false);
  const [tempName, setTempName] = useState(username || "");

  const handleNameSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (tempName.trim().length > 2) {
      setUsername(tempName.trim());
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
                <Avatar className="w-24 h-24">
                  <AvatarImage src={profileImage || undefined} alt={username || "User"} />
                  <AvatarFallback className="text-2xl">
                    <User className="w-8 h-8" />
                  </AvatarFallback>
                </Avatar>
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
                  <div className="text-2xl font-bold text-primary">0</div>
                  <div className="text-sm text-gray-600">Games Played</div>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-primary">0</div>
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