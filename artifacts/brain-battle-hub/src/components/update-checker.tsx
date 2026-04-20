import { useEffect, useCallback, useState } from "react";
import { Button } from "@/components/ui/button";

const STORAGE_KEY = "brain-battle-hub-last-deploy-version";

// Fetch version from a dedicated JSON file (not cached by SW)
async function fetchDeployVersion(): Promise<string | null> {
  try {
    const response = await fetch(`/version.json?_=${Date.now()}`, {
      cache: "no-store",
    });
    if (!response.ok) return null;
    const data = await response.json();
    return data.version || null;
  } catch {
    return null;
  }
}

export function UpdateChecker() {
  const [updateAvailable, setUpdateAvailable] = useState(false);

  const checkForUpdate = useCallback(async () => {
    const currentVersion = await fetchDeployVersion();
    if (!currentVersion) return;

    const lastSeenVersion = localStorage.getItem(STORAGE_KEY);

    if (!lastSeenVersion) {
      // First visit - store version
      localStorage.setItem(STORAGE_KEY, currentVersion);
      return;
    }

    if (currentVersion !== lastSeenVersion) {
      // New deployment detected!
      setUpdateAvailable(true);
      
      if ("serviceWorker" in navigator) {
        navigator.serviceWorker.ready.then((registration) => {
          registration.update();
        });
      }
    }
  }, []);

  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    // Check for version update on load
    checkForUpdate();

    let refreshing = false;
    // Listen for controller change (when new SW takes over and claims clients)
    navigator.serviceWorker.addEventListener("controllerchange", () => {
      // Prevent multiple triggers
      if (refreshing) return;
      refreshing = true;
      // Show update UI instead of automatic reload
      setUpdateAvailable(true);
    });

    // Periodic check every 30 seconds for faster update detection
    const interval = setInterval(() => {
      checkForUpdate();
      // Also force the SW to check for updates
      navigator.serviceWorker.ready.then((registration) => {
        registration.update();
      });
    }, 30000);

    return () => {
      clearInterval(interval);
    };
  }, [checkForUpdate]);

  const handleUpdate = async () => {
    const currentVersion = await fetchDeployVersion();
    if (currentVersion) {
      localStorage.setItem(STORAGE_KEY, currentVersion);
    }
    window.location.reload();
  };

  if (!updateAvailable) return null;

  return (
    <div className="fixed bottom-4 right-4 z-[100] bg-background border border-border rounded-lg shadow-lg p-4 flex flex-col gap-3 max-w-[300px] animate-in slide-in-from-bottom-5 fade-in duration-300">
      <div>
        <h3 className="font-semibold text-foreground">Update Available</h3>
        <p className="text-sm text-muted-foreground mt-1">
          A new version of the app is available. Update now to see the latest features.
        </p>
      </div>
      <div className="flex gap-2 justify-end">
        <Button variant="outline" size="sm" onClick={() => setUpdateAvailable(false)}>
          Dismiss
        </Button>
        <Button size="sm" onClick={handleUpdate}>
          Update Now
        </Button>
      </div>
    </div>
  );
}
