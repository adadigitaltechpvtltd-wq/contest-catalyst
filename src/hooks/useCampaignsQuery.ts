import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type CampaignStatus = "active" | "voting" | "completed" | "draft" | "cancelled";

export interface Campaign {
  id: string;
  slug: string | null;
  title: string;
  description: string | null;
  theme: string | null;
  cover_image_url: string | null;
  prize_amount: number;
  prize_currency: string;
  min_participants: number;
  start_date: string;
  end_date: string;
  status: CampaignStatus;
  featured_in_hero?: boolean;
  brand_logo_url?: string | null;
  brand_image_url?: string | null;
  category?: string | null;
}

export interface CampaignWithCount extends Campaign {
  participantCount: number;
}

// Legacy type aliases for backwards compatibility
export type ContestStatus = CampaignStatus;
export type Contest = Campaign;
export type ContestWithCount = CampaignWithCount;

// Fetch all campaigns with participant counts
export const useCampaignsQuery = () => {
  return useQuery({
    queryKey: ["campaigns", "list"],
    queryFn: async (): Promise<CampaignWithCount[]> => {
      const { data, error } = await (supabase as any)
        .from("campaigns")
        .select("*")
        .in("status", ["active", "voting", "completed"])
        .order("start_date", { ascending: false });

      if (error) throw error;
      if (!data) return [];

      // Fetch participant counts
      const campaignsWithCounts = await Promise.all(
        data.map(async (campaign) => {
          const { count } = await supabase
            .from("submissions")
            .select("*", { count: "exact" })
            .eq("campaign_id", campaign.id).limit(0);
          return {
            ...campaign,
            participantCount: count ?? 0,
          } as CampaignWithCount;
        })
      );

      return campaignsWithCounts;
    },
  });
};

// Legacy alias
export const useContestsQuery = useCampaignsQuery;

// Fetch featured hero campaign
export const useFeaturedCampaignQuery = () => {
  return useQuery({
    queryKey: ["campaigns", "featured"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("campaigns")
        .select("id, slug, title, description, prize_amount, prize_currency, end_date, theme")
        .eq("featured_in_hero", true)
        .eq("status", "active")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      if (!data) return null;

      // Fetch participant count
      const { count } = await supabase
        .from("submissions")
        .select("*", { count: "exact" })
        .eq("campaign_id", data.id).limit(0);

      return {
        ...data,
        participantCount: count ?? 0,
      };
    },
  });
};

// Legacy alias
export const useFeaturedContestQuery = useFeaturedCampaignQuery;

// Fetch active campaigns for home page (non-featured)
export const useActiveCampaignsQuery = (limit = 4) => {
  return useQuery({
    queryKey: ["campaigns", "active", limit],
    queryFn: async (): Promise<CampaignWithCount[]> => {
      const { data, error } = await (supabase as any)
        .from("campaigns")
        .select("id, slug, title, description, prize_amount, prize_currency, start_date, end_date, status, theme, cover_image_url")
        .eq("status", "active")
        .eq("featured_in_hero", false)
        .order("start_date", { ascending: false })
        .limit(limit);

      if (error) throw error;
      if (!data) return [];

      // Fetch participant counts
      const campaignsWithCounts = await Promise.all(
        data.map(async (campaign) => {
          const { count } = await supabase
            .from("submissions")
            .select("*", { count: "exact" })
            .eq("campaign_id", campaign.id).limit(0);
          return {
            ...campaign,
            participantCount: count ?? 0,
          } as CampaignWithCount;
        })
      );

      return campaignsWithCounts;
    },
  });
};

// Legacy alias
export const useActiveContestsQuery = useActiveCampaignsQuery;
