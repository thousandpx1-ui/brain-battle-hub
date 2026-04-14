import { useEffect, useState, useCallback } from "react";
import { RefreshCw } from "lucide-react";

export function UpdateChecker() {
  const [showUpdate, setShowUpdate] = useState(false);
  const [waitingWorker, setWaitingWorker] = useState<ServiceWorker | null>(null);

  const onServiceWorkerUpdate = useCallback((registration: ServiceWorkerRegistration) => {
    const waitingWorker = registration.waiting;
    if (waitingWorker) {
      setWaitingWorker(waitingWorker);
      setShowUpdate(true);
    }
  }, []);

  useEffect(() => {
    if ("serviceWorker" in navigator) {
      // Check for updates periodically
      const checkForUpdates = async () => {
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
        } catch (error) {
          console.log("Service worker update check failed:", error);
        }
      };

      // Initial check
      checkForUpdates();

      // Check every 60 seconds
      const interval = setInterval(checkForUpdates, 60000);

      return () => clearInterval(interval);
    }
  }, []);

  const handleUpdate = useCallback(() => {
    if (waitingWorker) {
      // Tell the waiting service worker to activate
      waitingWorker.postMessage({ type: "SKIP_WAITING" });
    }
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
