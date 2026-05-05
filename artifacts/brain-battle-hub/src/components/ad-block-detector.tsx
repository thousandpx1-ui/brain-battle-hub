import { useState, useEffect } from "react";
import { AlertTriangle, X } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "./ui/alert";
import { Button } from "./ui/button";

export function AdBlockDetector() {
  const [adBlockDetected, setAdBlockDetected] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Check if a fake ad element is hidden by ad blockers
    const checkAdBlocker = async () => {
      let isBlocked = false;

      // Create a fake ad element with common ad classes
      const fakeAd = document.createElement("div");
      fakeAd.className = "textads banner-ads banner_ads ad-unit ad-zone ad-space adsbox";
      fakeAd.style.height = "1px";
      fakeAd.style.width = "1px";
      fakeAd.style.position = "absolute";
      fakeAd.style.left = "-10000px";
      fakeAd.style.top = "-10000px";
      document.body.appendChild(fakeAd);

      // Wait a moment for adblocker to process and hide the element
      await new Promise((resolve) => setTimeout(resolve, 100));

      const styles = window.getComputedStyle(fakeAd);
      if (
        fakeAd.offsetHeight === 0 ||
        styles.display === "none" ||
        styles.visibility === "hidden"
      ) {
        isBlocked = true;
      }

      // Try fetching a known ad script URL
      if (!isBlocked) {
        try {
          await fetch("https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js", {
            method: "HEAD",
            mode: "no-cors",
            cache: "no-store",
          });
        } catch (error) {
          isBlocked = true;
        }
      }

      document.body.removeChild(fakeAd);
      setAdBlockDetected(isBlocked);
    };

    // Delay check slightly to let extensions initialize
    setTimeout(checkAdBlocker, 500);
  }, []);

  if (!adBlockDetected || dismissed) {
    return null;
  }

  return (
    <div className="fixed top-0 left-0 w-full z-[100] p-4 bg-background/80 backdrop-blur-sm">
      <Alert variant="destructive" className="relative border-red-500 bg-red-50 dark:bg-red-950/50 shadow-lg">
        <Button 
          variant="ghost" 
          size="icon" 
          className="absolute right-2 top-2 h-6 w-6 rounded-full opacity-70 hover:opacity-100 hover:bg-transparent"
          onClick={() => setDismissed(true)}
        >
          <X className="h-4 w-4" />
          <span className="sr-only">Dismiss</span>
        </Button>
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle className="pr-6">Ad Blocker Detected</AlertTitle>
        <AlertDescription className="text-sm leading-relaxed mt-2 text-foreground">
          We noticed you're using an ad blocker 🚫 Ads help us keep this app free and running. Please consider disabling your ad blocker to support us 📲 After that, press the “Get” button to install directly on your device. 🙏 Thank you for your support!
        </AlertDescription>
      </Alert>
    </div>
  );
}
