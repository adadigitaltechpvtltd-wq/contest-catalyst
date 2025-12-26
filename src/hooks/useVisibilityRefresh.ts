import { useEffect, useRef, useCallback } from "react";

/**
 * Hook to refresh data when the browser tab becomes visible again
 * or when the network comes back online.
 * This handles the case where API calls stop working after switching tabs.
 */
export const useVisibilityRefresh = (refreshFn: () => void, delay: number = 100) => {
  const lastHiddenTime = useRef<number | null>(null);
  const isRefreshing = useRef(false);

  const safeRefresh = useCallback(() => {
    if (isRefreshing.current) return;
    isRefreshing.current = true;
    
    setTimeout(() => {
      try {
        refreshFn();
      } finally {
        // Reset after a short delay to prevent rapid re-triggers
        setTimeout(() => {
          isRefreshing.current = false;
        }, 1000);
      }
    }, delay);
  }, [refreshFn, delay]);

  const handleVisibilityChange = useCallback(() => {
    if (document.hidden) {
      // Tab is now hidden, record the time
      lastHiddenTime.current = Date.now();
    } else {
      // Tab is now visible again
      // If it was hidden for more than 10 seconds, refresh the data
      const hiddenDuration = lastHiddenTime.current 
        ? Date.now() - lastHiddenTime.current 
        : 0;
      
      if (hiddenDuration > 10000 || lastHiddenTime.current === null) {
        safeRefresh();
      }
      lastHiddenTime.current = null;
    }
  }, [safeRefresh]);

  const handleOnline = useCallback(() => {
    // Network came back online, refresh data
    safeRefresh();
  }, [safeRefresh]);

  useEffect(() => {
    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("online", handleOnline);
    
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("online", handleOnline);
    };
  }, [handleVisibilityChange, handleOnline]);
};
