import { useEffect, useRef, useCallback } from "react";
import { GLOBAL_REFRESH_EVENT } from "@/components/GlobalRefreshHandler";

/**
 * Hook that listens to the global refresh event and triggers a callback.
 * Use this for components that fetch data with useEffect instead of React Query.
 * 
 * The GlobalRefreshHandler component dispatches this event when:
 * - Tab becomes visible after being hidden
 * - Network comes back online
 */
export const useGlobalRefresh = (refreshFn: () => void) => {
  const isRefreshing = useRef(false);

  const handleRefresh = useCallback(() => {
    if (isRefreshing.current) return;
    isRefreshing.current = true;

    refreshFn();

    setTimeout(() => {
      isRefreshing.current = false;
    }, 1000);
  }, [refreshFn]);

  useEffect(() => {
    const listener = () => handleRefresh();
    window.addEventListener(GLOBAL_REFRESH_EVENT, listener);
    
    return () => {
      window.removeEventListener(GLOBAL_REFRESH_EVENT, listener);
    };
  }, [handleRefresh]);
};

// Keep the old export name for backward compatibility
export const useVisibilityRefresh = useGlobalRefresh;
