import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface DashboardStats {
  totalSubmissions: number;
  approvedSubmissions: number;
  pendingSubmissions: number;
  winCount: number;
  walletBalance: number;
}

export interface ActiveContest {
  id: string;
  slug: string | null;
  title: string;
  prize_amount: number;
  end_date: string;
  hasSubmitted: boolean;
}

export const useDashboardStatsQuery = (userId: string | undefined) => {
  return useQuery({
    queryKey: ["dashboard", "stats", userId],
    queryFn: async (): Promise<DashboardStats> => {
      if (!userId) throw new Error("User not authenticated");

      // Fetch submissions stats
      const { data: submissions, error: submissionsError } = await supabase
        .from("submissions")
        .select("status")
        .eq("user_id", userId);

      if (submissionsError) throw submissionsError;

      const stats = {
        totalSubmissions: submissions?.length ?? 0,
        approvedSubmissions: submissions?.filter((s) => s.status === "approved" || s.status === "winner").length ?? 0,
        pendingSubmissions: submissions?.filter((s) => s.status === "pending").length ?? 0,
        winCount: submissions?.filter((s) => s.status === "winner").length ?? 0,
        walletBalance: 0,
      };

      // Fetch wallet balance
      const { data: totalEarned, error: totalEarnedError } = await supabase.rpc("get_total_earned", {
        _user_id: userId,
      });

      if (totalEarnedError) throw totalEarnedError;

      stats.walletBalance = totalEarned ?? 0;

      return stats;
    },
    enabled: !!userId,
  });
};

export const useDashboardContestsQuery = (userId: string | undefined) => {
  return useQuery({
    queryKey: ["dashboard", "contests", userId],
    queryFn: async (): Promise<ActiveContest[]> => {
      if (!userId) throw new Error("User not authenticated");

      // Fetch active contests
      const { data: contests, error: contestsError } = await supabase
        .from("contests")
        .select("id, slug, title, prize_amount, end_date")
        .eq("status", "active")
        .order("end_date", { ascending: true })
        .limit(5);

      if (contestsError) throw contestsError;
      if (!contests) return [];

      // Check which contests user has already submitted to
      const { data: userSubmissions } = await supabase
        .from("submissions")
        .select("contest_id")
        .eq("user_id", userId);

      const submittedContestIds = new Set(userSubmissions?.map((s) => s.contest_id) || []);

      return contests.map((c) => ({
        ...c,
        hasSubmitted: submittedContestIds.has(c.id),
      }));
    },
    enabled: !!userId,
  });
};
