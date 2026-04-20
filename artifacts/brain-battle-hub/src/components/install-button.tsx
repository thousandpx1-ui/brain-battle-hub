import { useState, useEffect } from 'react';
import { Download, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

export function InstallButton() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showIOSPrompt, setShowIOSPrompt] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Check if app is already installed
    if (window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone) {
      setIsInstalled(true);
      return;
    }

    // Check if device is iOS
    const ua = window.navigator.userAgent;
    const isIOSDevice = /iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    
    // Check if device is mobile
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
                     ('ontouchstart' in window) ||
                     (navigator.maxTouchPoints > 0);

    if (!isMobile) {
      return;
    }

    if (isIOSDevice && !(window.navigator as any).standalone) {
      setIsIOS(true);
      setIsInstallable(true);
    }

    // Listen for the beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
    };

    // Listen for successful installation
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setIsInstallable(false);
      setShowIOSPrompt(false);
      toast({
        title: "App Installed!",
        description: "Brain Battle has been installed on your device.",
      });
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, [toast]);

  const handleInstallClick = async () => {
    if (isIOS) {
      setShowIOSPrompt(true);
      return;
    }

    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === 'accepted') {
      console.log('User accepted the install prompt');
    } else {
      console.log('User dismissed the install prompt');
    }

    setDeferredPrompt(null);
    setIsInstallable(false);
  };

  const handleDismiss = () => {
    setIsInstallable(false);
  };

  // Don't show if already installed or not installable
  if (isInstalled || !isInstallable) {
    return null;
  }

  return (
    <>
      <div className="w-full bg-blue-50 border-b border-blue-100 px-4 py-3 flex items-center justify-between z-40 sticky top-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shrink-0 shadow-sm">
            <Download className="w-5 h-5 text-white" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-bold text-gray-900 leading-none mb-1">Brain Battle</span>
            <span className="text-[11px] text-gray-600 font-medium">Add to Home Screen</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={handleInstallClick}
            className="bg-primary hover:bg-primary/90 text-white px-4 py-1.5 h-auto rounded-full text-xs font-bold shadow-sm"
          >
            GET
          </Button>
          <Button
            onClick={handleDismiss}
            variant="ghost"
            className="w-8 h-8 p-0 rounded-full text-gray-400 hover:text-gray-600 hover:bg-blue-100/50"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {showIOSPrompt && (
        <div 
          className="fixed inset-0 z-[60] flex items-end justify-center bg-black/50 p-4 pb-12 sm:pb-4 sm:items-center" 
          onClick={() => setShowIOSPrompt(false)}
        >
          <div 
            className="bg-white p-6 rounded-2xl shadow-xl w-full max-w-sm animate-in slide-in-from-bottom-4 duration-300" 
            onClick={e => e.stopPropagation()}
          >
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-lg font-bold">Install on iOS</h3>
              <Button variant="ghost" size="sm" onClick={() => setShowIOSPrompt(false)} className="w-8 h-8 p-0">
                <X className="w-4 h-4" />
              </Button>
            </div>
            <p className="text-gray-600 mb-6">
              To install this app on your device:
            </p>
            <ol className="space-y-4 text-sm font-medium">
              <li className="flex items-center gap-3">
                <span className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center font-bold shrink-0">1</span>
                <span>Tap the <strong className="text-blue-500">Share</strong> button in Safari's menu bar at the bottom or top.</span>
              </li>
              <li className="flex items-center gap-3">
                <span className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center font-bold shrink-0">2</span>
                <span>Scroll down and tap <strong className="text-black">Add to Home Screen</strong>.</span>
              </li>
              <li className="flex items-center gap-3">
                <span className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center font-bold shrink-0">3</span>
                <span>Tap <strong className="text-blue-500">Add</strong> in the top right corner.</span>
              </li>
            </ol>
            <Button className="w-full mt-6" onClick={() => setShowIOSPrompt(false)}>Got it</Button>
          </div>
        </div>
      )}
    </>
  );
}
