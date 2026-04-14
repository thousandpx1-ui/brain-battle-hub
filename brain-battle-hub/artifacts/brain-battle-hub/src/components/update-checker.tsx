import { useEffect, useState, useCallback } from "react";
import { RefreshCw } from "lucide-react";

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
  const [showUpdate, setShowUpdate] = useState(false);
  const [waitingWorker, setWaitingWorker] = useState<ServiceWorker | null>(null);

  const checkForUpdate = useCallback(async () => {
    const currentVersion = await fetchDeployVersion();
    if (!currentVersion) return;

    const lastSeenVersion = localStorage.getItem(STORAGE_KEY);

    if (!lastSeenVersion) {
      // First visit - store version but don't show banner
      localStorage.setItem(STORAGE_KEY, currentVersion);
      return;
    }

    if (currentVersion !== lastSeenVersion) {
      // New deployment detected!
      setShowUpdate(true);
      // Update stored version so we don't show banner again until next deploy
      localStorage.setItem(STORAGE_KEY, currentVersion);
    }
  }, []);

  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    // Check for version update on load
    checkForUpdate();

    // Listen for service worker updates
    navigator.serviceWorker.ready.then(async (registration) => {
      // Force check for SW updates
      await registration.update();

      registration.addEventListener("updatefound", () => {
        const installingWorker = registration.installing;
        if (installingWorker) {
          installingWorker.addEventListener("statechange", () => {
            if (installingWorker.state === "installed") {
              setWaitingWorker(installingWorker);
              setShowUpdate(true);
            }
          });
        }
      });
    });

    // Periodic check every 60 seconds
    const interval = setInterval(checkForUpdate, 60000);

    return () => {
      clearInterval(interval);
    };
  }, [checkForUpdate]);

  const handleUpdate = useCallback(() => {
    if (waitingWorker) {
      waitingWorker.postMessage({ type: "SKIP_WAITING" });
    }
    window.location.reload();
  }, [waitingWorker]);

  if (!showUpdate) return null;

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] bg-primary text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-3 animate-in fade-in slide-in-from-top-4 duration-300">
      <RefreshCw className="w-5 h-5 animate-spin" />
      <span className="text-sm font-medium">New update available!</span>
      <button
        onClick={handleUpdate}
        className="bg-white text-primary px-3 py-1 rounded-md text-sm font-semibold hover:bg-gray-100 transition-colors"
      >
        Update Now
      </button>
    </div>
  );
}
