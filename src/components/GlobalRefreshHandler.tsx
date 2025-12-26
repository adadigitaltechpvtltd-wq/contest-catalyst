import { useEffect, useRef, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";

// Global event name for refresh
export const GLOBAL_REFRESH_EVENT = "gaal:global-refresh";

// Global flag to track refresh state across the app
let globalRefreshInProgress = false;

/**
 * Dispatch a global refresh event that all components can listen to
 */
export const dispatchGlobalRefresh = () => {
  if (globalRefreshInProgress) return;
  globalRefreshInProgress = true;
  
  console.log("[GlobalRefresh] Dispatching global refresh event...");
  window.dispatchEvent(new CustomEvent(GLOBAL_REFRESH_EVENT));
  
  // Reset flag after delay
  setTimeout(() => {
    globalRefreshInProgress = false;
  }, 2000);
};

/**
 * Global component that handles tab visibility and network reconnection.
 * Invalidates all React Query caches and dispatches a custom event when:
 * - Tab becomes visible after being hidden for 5+ seconds
 * - Network comes back online
 * - Window regains focus after being away
 * 
 * This ensures all API data is fresh across the entire application.
 */
const GlobalRefreshHandler = () => {
  const queryClient = useQueryClient();
  const lastHiddenTime = useRef<number | null>(null);
  const lastBlurTime = useRef<number | null>(null);

  const triggerGlobalRefresh = useCallback(() => {
    if (globalRefreshInProgress) return;

    console.log("[GlobalRefresh] Triggering global refresh...");
    
    // 1. Invalidate all React Query caches - this will refetch all active queries
    queryClient.invalidateQueries();
    
    // 2. Dispatch custom event for non-React Query components
    dispatchGlobalRefresh();
  }, [queryClient]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Tab is now hidden, record the time
        lastHiddenTime.current = Date.now();
        console.log("[GlobalRefresh] Tab hidden");
      } else {
        // Tab is now visible again
        const hiddenDuration = lastHiddenTime.current 
          ? Date.now() - lastHiddenTime.current 
          : 0;
        
        console.log(`[GlobalRefresh] Tab visible after ${hiddenDuration}ms`);
        
        // If hidden for more than 5 seconds, trigger global refresh
        if (hiddenDuration > 5000) {
          triggerGlobalRefresh();
        }
        
        lastHiddenTime.current = null;
      }
    };

    const handleOnline = () => {
      console.log("[GlobalRefresh] Network online - refreshing data");
      triggerGlobalRefresh();
    };

    const handleBlur = () => {
      lastBlurTime.current = Date.now();
    };

    const handleFocus = () => {
      // Check both visibility hidden time and blur time
      const hiddenDuration = lastHiddenTime.current 
        ? Date.now() - lastHiddenTime.current 
        : 0;
      const blurDuration = lastBlurTime.current
        ? Date.now() - lastBlurTime.current
        : 0;
      
      const awayDuration = Math.max(hiddenDuration, blurDuration);
      
      if (awayDuration > 5000) {
        console.log(`[GlobalRefresh] Window focused after ${awayDuration}ms away`);
        triggerGlobalRefresh();
      }
      
      lastBlurTime.current = null;
    };

    // Add event listeners
    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("online", handleOnline);
    window.addEventListener("blur", handleBlur);
    window.addEventListener("focus", handleFocus);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("blur", handleBlur);
      window.removeEventListener("focus", handleFocus);
    };
  }, [triggerGlobalRefresh]);

  return null; // This component doesn't render anything
};

export default GlobalRefreshHandler;
