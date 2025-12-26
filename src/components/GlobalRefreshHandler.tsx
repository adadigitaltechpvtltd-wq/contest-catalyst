import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";

// Global event name for refresh
export const GLOBAL_REFRESH_EVENT = "gaal:global-refresh";

/**
 * Dispatch a global refresh event that all components can listen to
 */
export const dispatchGlobalRefresh = () => {
  window.dispatchEvent(new CustomEvent(GLOBAL_REFRESH_EVENT));
};

/**
 * Global component that handles tab visibility and network reconnection.
 * Invalidates all React Query caches and dispatches a custom event when:
 * - Tab becomes visible after being hidden for 10+ seconds
 * - Network comes back online
 * 
 * This ensures all API data is fresh across the entire application.
 */
const GlobalRefreshHandler = () => {
  const queryClient = useQueryClient();
  const lastHiddenTime = useRef<number | null>(null);
  const isRefreshing = useRef(false);

  useEffect(() => {
    const triggerGlobalRefresh = () => {
      if (isRefreshing.current) return;
      isRefreshing.current = true;

      console.log("[GlobalRefresh] Triggering global refresh...");
      
      // 1. Invalidate all React Query caches
      queryClient.invalidateQueries();
      
      // 2. Dispatch custom event for non-React Query components
      dispatchGlobalRefresh();
      
      // Reset flag after a delay to prevent rapid re-triggers
      setTimeout(() => {
        isRefreshing.current = false;
      }, 2000);
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Tab is now hidden, record the time
        lastHiddenTime.current = Date.now();
      } else {
        // Tab is now visible again
        const hiddenDuration = lastHiddenTime.current 
          ? Date.now() - lastHiddenTime.current 
          : 0;
        
        // If hidden for more than 10 seconds, trigger global refresh
        if (hiddenDuration > 10000) {
          triggerGlobalRefresh();
        }
        
        lastHiddenTime.current = null;
      }
    };

    const handleOnline = () => {
      console.log("[GlobalRefresh] Network online");
      triggerGlobalRefresh();
    };

    const handleFocus = () => {
      // Also handle window focus (e.g., switching between browser windows)
      const hiddenDuration = lastHiddenTime.current 
        ? Date.now() - lastHiddenTime.current 
        : 0;
      
      if (hiddenDuration > 10000) {
        triggerGlobalRefresh();
      }
    };

    // Add event listeners
    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("online", handleOnline);
    window.addEventListener("focus", handleFocus);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("focus", handleFocus);
    };
  }, [queryClient]);

  return null; // This component doesn't render anything
};

export default GlobalRefreshHandler;
