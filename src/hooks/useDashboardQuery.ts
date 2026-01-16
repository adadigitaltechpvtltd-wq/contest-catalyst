import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface DashboardStats {
  totalSubmissions: number;
  approvedSubmissions: number;
  pendingSubmissions: number;
  winCount: number;
  walletBalance: number;
}

export interface ActiveCampaign {
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

      try {
        // Fetch submissions stats
        const { data: submissions, error: submissionsError } = await supabase
          .from("submissions")
          .select("status")
          .eq("user_id", userId);

        if (submissionsError) {
          console.error('Error fetching submissions:', submissionsError);
          return {
            totalSubmissions: 0,
            approvedSubmissions: 0,
            pendingSubmissions: 0,
            winCount: 0,
            walletBalance: 0,
          };
        }

        const stats = {
          totalSubmissions: submissions?.length ?? 0,
          approvedSubmissions: submissions?.filter((s: any) => s.status === "approved" || s.status === "winner").length ?? 0,
          pendingSubmissions: submissions?.filter((s: any) => s.status === "pending").length ?? 0,
          winCount: submissions?.filter((s: any) => s.status === "winner").length ?? 0,
          walletBalance: 0,
        };

        return stats;
      } catch (err) {
        console.error('Error in dashboard stats query:', err);
        return {
          totalSubmissions: 0,
          approvedSubmissions: 0,
          pendingSubmissions: 0,
          winCount: 0,
          walletBalance: 0,
        };
      }
    },
    enabled: !!userId,
    retry: 1,
  });
};

export const useDashboardCampaignsQuery = (userId: string | undefined) => {
  return useQuery({
    queryKey: ["dashboard", "campaigns", userId],
    queryFn: async (): Promise<ActiveCampaign[]> => {
      if (!userId) throw new Error("User not authenticated");

      try {
        // Fetch active campaigns
        const { data: campaigns, error: campaignsError } = await (supabase as any)
          .from("campaigns")
          .select("id, slug, title, prize_amount, end_date")
          .eq("status", "active")
          .order("end_date", { ascending: true })
          .limit(5);

        if (campaignsError) {
          console.error('Error fetching campaigns:', campaignsError);
          return [];
        }
        if (!campaigns) return [];

        // Check which campaigns user has already submitted to
        const { data: userSubmissions } = await supabase
          .from("submissions")
          .select("campaign_id")
          .eq("user_id", userId);

        const submittedCampaignIds = new Set(userSubmissions?.map((s: any) => s.campaign_id) || []);

        return campaigns.map((c: any) => ({
          ...c,
          hasSubmitted: submittedCampaignIds.has(c.id),
        }));
      } catch (err) {
        console.error('Error in dashboard campaigns query:', err);
        return [];
      }
    },
    enabled: !!userId,
    retry: 1,
  });
};
