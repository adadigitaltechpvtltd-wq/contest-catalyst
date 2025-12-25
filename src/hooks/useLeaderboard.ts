import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface LeaderboardEntry {
  user_id: string;
  full_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  wins: number;
  total_submissions: number;
  contests_entered: number;
  total_points: number;
}

interface UseLeaderboardOptions {
  limit?: number;
}

export const useLeaderboard = (options: UseLeaderboardOptions = {}) => {
  const { limit = 50 } = options;

  return useQuery({
    queryKey: ["leaderboard", limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("leaderboard_stats")
        .select("user_id, full_name, avatar_url, bio, wins, total_submissions, contests_entered, total_points")
        .order("total_points", { ascending: false })
        .order("wins", { ascending: false })
        .limit(limit);

      if (error) {
        console.error("Error fetching leaderboard:", error);
        throw error;
      }

      return (data ?? []) as LeaderboardEntry[];
    },
  });
};
