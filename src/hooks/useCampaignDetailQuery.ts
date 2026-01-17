import { useQuery, useInfiniteQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface Campaign {
  id: string;
  slug: string | null;
  category: string | null;
  title: string;
  description: string | null;
  theme: string | null;
  prize_amount: number;
  prize_currency: string;
  start_date: string;
  end_date: string;
  voting_end_date: string | null;
  status: 'draft' | 'active' | 'voting' | 'completed' | 'cancelled';
  cover_image_url: string | null;
  rules: string[] | null;
  judging_criteria: string[] | null;
  min_participants: number;
  max_participants: number | null;
  brand_name: string | null;
  brand_description: string | null;
  brand_logo_url: string | null;
  brand_image_url: string | null;
  brand_website_url: string | null;
  brand_instagram_url: string | null;
  brand_twitter_url: string | null;
  brand_linkedin_url: string | null;
  brand_youtube_url: string | null;
  brand_cta_label: string | null;
  brand_cta_url: string | null;
  campaign_type: 'photo' | 'video';
  // SEO fields
  seo_title: string | null;
  meta_description: string | null;
  keywords: string[] | null;
}

export interface CampaignSubmission {
  id: string;
  title: string;
  image_url: string;
  user_id: string;
  status: 'pending' | 'approved' | 'rejected' | 'winner' | 'disqualified';
  created_at: string;
  view_count: number;
  download_count: number;
  like_count: number;
  profiles?: {
    full_name: string | null;
    avatar_url: string | null;
  };
}

const SUBMISSIONS_PER_PAGE = 12;

export const useCampaignDetailQuery = (slug: string | undefined) => {
  return useQuery({
    queryKey: ['campaign-detail', slug],
    queryFn: async () => {
      if (!slug) return null;

      // Support both slug and UUID for backward compatibility
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(slug);
      
      const { data, error } = await (supabase as any)
        .from('campaigns')
        .select('*')
        .eq(isUUID ? 'id' : 'slug', slug)
        .maybeSingle();

      if (error) throw error;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (data as any) as Campaign | null;
    },
    enabled: !!slug,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};

export const useCampaignParticipantCount = (campaignId: string | undefined) => {
  return useQuery({
    queryKey: ['campaign-participants', campaignId],
    queryFn: async () => {
      if (!campaignId) return 0;

      const { count, error } = await supabase
        .from('submissions')
        .select('*', { count: 'exact', head: true })
        .eq('campaign_id', campaignId);

      if (error) throw error;
      return count || 0;
    },
    enabled: !!campaignId,
    staleTime: 2 * 60 * 1000,
  });
};

export const useUserCampaignSubmission = (campaignId: string | undefined, userId: string | undefined) => {
  return useQuery({
    queryKey: ['user-campaign-submission', campaignId, userId],
    queryFn: async () => {
      if (!campaignId || !userId) return null;

      const { data, error } = await supabase
        .from('submissions')
        .select('id, title')
        .eq('campaign_id', campaignId)
        .eq('user_id', userId)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!campaignId && !!userId,
    staleTime: 2 * 60 * 1000,
  });
};

export const useCampaignApprovedCount = (campaignId: string | undefined) => {
  return useQuery({
    queryKey: ['campaign-approved-count', campaignId],
    queryFn: async () => {
      if (!campaignId) return 0;

      const { count, error } = await supabase
        .from('submissions')
        .select('*', { count: 'exact', head: true })
        .eq('campaign_id', campaignId)
        .in('status', ['approved', 'winner']);

      if (error) throw error;
      return count || 0;
    },
    enabled: !!campaignId,
    staleTime: 2 * 60 * 1000,
  });
};

export const useCampaignSubmissionsInfinite = (campaignId: string | undefined) => {
  return useInfiniteQuery({
    queryKey: ['campaign-submissions', campaignId],
    queryFn: async ({ pageParam = 0 }) => {
      if (!campaignId) return { submissions: [], nextPage: undefined };

      const { data, error } = await supabase
        .from('submissions')
        .select(`
          id,
          title,
          image_url,
          user_id,
          status,
          created_at,
          view_count,
          download_count,
          like_count,
          profiles:user_id (
            full_name,
            avatar_url
          )
        `)
        .eq('campaign_id', campaignId)
        .in('status', ['approved', 'winner'])
        .order('created_at', { ascending: false })
        .range(pageParam * SUBMISSIONS_PER_PAGE, (pageParam + 1) * SUBMISSIONS_PER_PAGE - 1);

      if (error) throw error;

      const submissions = (data || []) as unknown as CampaignSubmission[];
      const hasMore = submissions.length === SUBMISSIONS_PER_PAGE;

      return {
        submissions,
        nextPage: hasMore ? pageParam + 1 : undefined,
      };
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage) => lastPage.nextPage,
    enabled: !!campaignId,
    staleTime: 2 * 60 * 1000,
  });
};

export const useUserSubmissionLikes = (userId: string | undefined, submissionIds: string[]) => {
  return useQuery({
    queryKey: ['user-submission-likes', userId, submissionIds],
    queryFn: async () => {
      if (!userId || submissionIds.length === 0) return new Set<string>();

      const { data, error } = await supabase
        .from('submission_likes')
        .select('submission_id')
        .eq('user_id', userId)
        .in('submission_id', submissionIds);

      if (error) throw error;
      return new Set(data?.map(l => l.submission_id) || []);
    },
    enabled: !!userId && submissionIds.length > 0,
    staleTime: 60 * 1000, // 1 minute
  });
};