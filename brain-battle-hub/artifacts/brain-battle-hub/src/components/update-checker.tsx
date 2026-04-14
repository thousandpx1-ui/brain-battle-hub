import { useEffect, useState, useCallback } from "react";
import { RefreshCw } from "lucide-react";

const STORAGE_KEY = "brain-battle-hub-last-deploy-version";

// Extract the version from the service worker file by fetching it
async function fetchDeployVersion(): Promise<string | null> {
  try {
    const response = await fetch("/sw.js", { cache: "no-store" });
    const text = await response.text();
    const match = text.match(/DEPLOY_VERSION\s*=\s*['"]([^'"]+)['"]/);
    return match ? match[1] : null;
  } catch {
    return null;
  }
}

export function UpdateChecker() {
  const [showUpdate, setShowUpdate] = useState(false);
  const [waitingWorker, setWaitingWorker] = useState<ServiceWorker | null>(null);

  const checkForVersionUpdate = useCallback(async () => {
    const currentVersion = await fetchDeployVersion();
    if (!currentVersion) return;

    const lastSeenVersion = localStorage.getItem(STORAGE_KEY);
    
    // If we have a version and it's different from what we last saw, show update
    if (lastSeenVersion && currentVersion !== lastSeenVersion) {
      setShowUpdate(true);
    }
    
    // Always update the stored version
    localStorage.setItem(STORAGE_KEY, currentVersion);
  }, []);

  const onServiceWorkerUpdate = useCallback((registration: ServiceWorkerRegistration) => {
    const waitingWorker = registration.waiting;
    if (waitingWorker) {
      setWaitingWorker(waitingWorker);
      setShowUpdate(true);
    }
  }, []);

  useEffect(() => {
    // Always check for version updates on load
    checkForVersionUpdate();

    if ("serviceWorker" in navigator) {
      const checkForSwUpdates = async () => {
        try {
          const registration = await navigator.serviceWorker.ready;

          // Listen for updates
          registration.addEventListener("updatefound", () => {
            const newWorker = registration.installing;
            if (newWorker) {
              newWorker.addEventListener("statechange", () => {
                if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
                  // New service worker is waiting to activate
                  setWaitingWorker(newWorker);
                  setShowUpdate(true);
                }
              });
            }
          });

          // Force a check by unregistering and re-registering
          // This ensures the browser compares the SW file on each load
          registration.update();
        } catch (error) {
          console.log("Service worker update check failed:", error);
        }
      };

      // Initial check
      checkForSwUpdates();

      // Check every 30 seconds
      const interval = setInterval(checkForSwUpdates, 30000);

      return () => clearInterval(interval);
    }
    return;
  }, [checkForVersionUpdate]);

  const handleUpdate = useCallback(() => {
    if (waitingWorker) {
      // Tell the waiting service worker to activate
      waitingWorker.postMessage({ type: "SKIP_WAITING" });
    }
    // Clear the version key so it shows again on next deploy
    localStorage.removeItem(STORAGE_KEY);
    // Reload the page to get the new version
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
