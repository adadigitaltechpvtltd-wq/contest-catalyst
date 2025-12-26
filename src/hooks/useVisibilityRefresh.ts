import { useEffect, useRef } from "react";
import { GLOBAL_REFRESH_EVENT } from "@/components/GlobalRefreshHandler";

/**
 * Hook that listens to the global refresh event and triggers a callback.
 * Use this for components that fetch data with useEffect instead of React Query.
 * 
 * The GlobalRefreshHandler component dispatches this event when:
 * - Tab becomes visible after being hidden for 5+ seconds
 * - Network comes back online
 * - Window regains focus after being away
 * 
 * IMPORTANT: The refreshFn should be a stable function (wrapped in useCallback)
 * or the component should handle its own de-duplication.
 */
export const useGlobalRefresh = (refreshFn: () => void) => {
  const refreshFnRef = useRef(refreshFn);
  const isRefreshing = useRef(false);

  // Keep the ref updated with latest function
  useEffect(() => {
    refreshFnRef.current = refreshFn;
  }, [refreshFn]);

  useEffect(() => {
    const handleRefresh = () => {
      if (isRefreshing.current) {
        console.log("[useGlobalRefresh] Already refreshing, skipping...");
        return;
      }
      
      isRefreshing.current = true;
      console.log("[useGlobalRefresh] Executing refresh function...");
      
      try {
        refreshFnRef.current();
      } catch (error) {
        console.error("[useGlobalRefresh] Error during refresh:", error);
      }

      setTimeout(() => {
        isRefreshing.current = false;
      }, 1000);
    };

    window.addEventListener(GLOBAL_REFRESH_EVENT, handleRefresh);
    
    return () => {
      window.removeEventListener(GLOBAL_REFRESH_EVENT, handleRefresh);
    };
  }, []); // Empty deps - we use ref to always have latest function
};

// Keep the old export name for backward compatibility
export const useVisibilityRefresh = useGlobalRefresh;
