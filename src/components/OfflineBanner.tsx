import { useState, useEffect } from "react";
import { WifiOff, X } from "lucide-react";
import { Button } from "@/components/ui/button";

const OfflineBanner = () => {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOffline(false);
      setIsDismissed(false);
    };
    
    const handleOffline = () => {
      setIsOffline(true);
      setIsDismissed(false);
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  if (!isOffline || isDismissed) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[100] bg-destructive text-destructive-foreground px-4 py-3 shadow-lg animate-in slide-in-from-top duration-300">
      <div className="container mx-auto flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <WifiOff className="h-5 w-5 shrink-0" />
          <p className="text-sm font-medium">
            You're offline. Some features may not work until you reconnect.
          </p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 shrink-0 hover:bg-destructive-foreground/10"
          onClick={() => setIsDismissed(true)}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

export default OfflineBanner;
