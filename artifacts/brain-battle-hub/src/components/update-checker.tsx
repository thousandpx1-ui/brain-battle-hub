import { useEffect, useCallback } from "react";

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
      // New deployment detected! Update stored version
      localStorage.setItem(STORAGE_KEY, currentVersion);
      
      if ("serviceWorker" in navigator) {
        navigator.serviceWorker.ready.then((registration) => {
          registration.update();
        });
      } else {
        window.location.reload();
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
      // Prevent multiple reloads
      if (refreshing) return;
      refreshing = true;
      // New service worker took control - reload to get fresh content
      window.location.reload();
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

  return null;
}
