import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type ContestStatus = "active" | "voting" | "completed" | "draft" | "cancelled";

export interface Contest {
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
  status: ContestStatus;
  featured_in_hero?: boolean;
}

export interface ContestWithCount extends Contest {
  participantCount: number;
}

// Fetch all contests with participant counts
export const useContestsQuery = () => {
  return useQuery({
    queryKey: ["contests", "list"],
    queryFn: async (): Promise<ContestWithCount[]> => {
      const { data, error } = await supabase
        .from("contests")
        .select("*")
        .in("status", ["active", "voting", "completed"])
        .order("start_date", { ascending: false });

      if (error) throw error;
      if (!data) return [];

      // Fetch participant counts
      const contestsWithCounts = await Promise.all(
        data.map(async (contest) => {
          const { count } = await supabase
            .from("submissions")
            .select("*", { count: "exact" })
            .eq("contest_id", contest.id).limit(0);
          return {
            ...contest,
            participantCount: count ?? 0,
          } as ContestWithCount;
        })
      );

      return contestsWithCounts;
    },
  });
};

// Fetch featured hero contest
export const useFeaturedContestQuery = () => {
  return useQuery({
    queryKey: ["contests", "featured"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("contests")
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
        .eq("contest_id", data.id).limit(0);

      return {
        ...data,
        participantCount: count ?? 0,
      };
    },
  });
};

// Fetch active contests for home page (non-featured)
export const useActiveContestsQuery = (limit = 4) => {
  return useQuery({
    queryKey: ["contests", "active", limit],
    queryFn: async (): Promise<ContestWithCount[]> => {
      const { data, error } = await supabase
        .from("contests")
        .select("id, slug, title, description, prize_amount, prize_currency, start_date, end_date, status, theme, cover_image_url")
        .in("status", ["active", "voting", "completed"])
        .eq("featured_in_hero", false)
        .order("start_date", { ascending: false })
        .limit(limit);

      if (error) throw error;
      if (!data) return [];

      // Fetch participant counts
      const contestsWithCounts = await Promise.all(
        data.map(async (contest) => {
          const { count } = await supabase
            .from("submissions")
            .select("*", { count: "exact" })
            .eq("contest_id", contest.id).limit(0);
          return {
            ...contest,
            participantCount: count ?? 0,
          } as ContestWithCount;
        })
      );

      return contestsWithCounts;
    },
  });
};
