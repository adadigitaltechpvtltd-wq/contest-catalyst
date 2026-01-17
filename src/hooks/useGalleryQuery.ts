import { useQuery, useInfiniteQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface GalleryPhoto {
  id: string;
  title: string;
  image_url: string;
  video_url: string | null;
  video_duration_seconds: number | null;
  video_thumbnail_url: string | null;
  slug: string;
  view_count: number;
  like_count: number;
  status: string;
  created_at: string;
  user_id: string;
  seo_approved: boolean;
  seo_page_url: string | null;
  campaign: {
    id: string;
    title: string;
    slug: string;
    category: string | null;
    campaign_type: 'photo' | 'video';
  } | null;
  profile: {
    id: string;
    full_name: string | null;
    avatar_url: string | null;
  } | null;
}

export interface CampaignOption {
  id: string;
  title: string;
  slug: string;
}

export interface PhotographerOption {
  id: string;
  full_name: string | null;
}

export type SortOption = 'newest' | 'oldest' | 'most_liked' | 'most_viewed';

export interface GalleryFilters {
  searchQuery: string;
  selectedCampaign: string;
  selectedPhotographer: string;
  sortBy: SortOption;
  dateFrom: string | null;
  dateTo: string | null;
}

const ITEMS_PER_PAGE = 24;

// Fetch filter options (campaigns and photographers)
export const useGalleryFilterOptions = () => {
  const campaignsQuery = useQuery({
    queryKey: ['gallery-campaigns'],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('campaigns')
        .select('id, title, slug')
        .in('status', ['active', 'voting', 'completed'])
        .order('title');
      
      if (error) throw error;
      return (data || []) as CampaignOption[];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const photographersQuery = useQuery({
    queryKey: ['gallery-photographers'],
    queryFn: async () => {
      // Fetch photographers who have approved submissions
      const { data: submissionsWithUsers, error: subError } = await supabase
        .from('submissions')
        .select('user_id')
        .in('status', ['approved', 'winner']);

      if (subError) throw subError;

      if (!submissionsWithUsers || submissionsWithUsers.length === 0) {
        return [] as PhotographerOption[];
      }

      const uniqueUserIds = [...new Set(submissionsWithUsers.map(s => s.user_id))];
      const { data: profilesData, error: profError } = await supabase
        .from('profiles')
        .select('id, full_name')
        .in('id', uniqueUserIds)
        .order('full_name');
      
      if (profError) throw profError;
      return (profilesData || []) as PhotographerOption[];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  return {
    campaigns: campaignsQuery.data || [],
    /** @deprecated Use campaigns instead */
    contests: campaignsQuery.data || [],
    photographers: photographersQuery.data || [],
    isLoading: campaignsQuery.isLoading || photographersQuery.isLoading,
  };
};

// Fetch photos with infinite scroll
export const useGalleryPhotos = (filters: GalleryFilters) => {
  return useInfiniteQuery({
    queryKey: ['gallery-photos', filters],
    queryFn: async ({ pageParam = 0 }) => {
      // Determine sort column and direction
      let orderColumn: 'created_at' | 'like_count' | 'view_count' = 'created_at';
      let ascending = false;
      
      switch (filters.sortBy) {
        case 'oldest':
          orderColumn = 'created_at';
          ascending = true;
          break;
        case 'most_liked':
          orderColumn = 'like_count';
          ascending = false;
          break;
        case 'most_viewed':
          orderColumn = 'view_count';
          ascending = false;
          break;
        case 'newest':
        default:
          orderColumn = 'created_at';
          ascending = false;
      }

      let query = supabase
        .from('submissions')
        .select(`
          id,
          title,
          image_url,
          video_url,
          video_duration_seconds,
          video_thumbnail_url,
          slug,
          view_count,
          like_count,
          status,
          created_at,
          campaign_id,
          user_id,
          seo_approved,
          seo_page_url
        `)
        .in('status', ['approved', 'winner'])
        .order(orderColumn, { ascending });

      // Apply search filter
      if (filters.searchQuery) {
        query = query.ilike('title', `%${filters.searchQuery}%`);
      }

      // Apply campaign filter
      if (filters.selectedCampaign && filters.selectedCampaign !== 'all') {
        query = query.eq('campaign_id', filters.selectedCampaign);
      }

      // Apply photographer filter
      if (filters.selectedPhotographer && filters.selectedPhotographer !== 'all') {
        query = query.eq('user_id', filters.selectedPhotographer);
      }

      // Apply date range filter
      if (filters.dateFrom) {
        query = query.gte('created_at', new Date(filters.dateFrom).toISOString());
      }
      if (filters.dateTo) {
        const endDate = new Date(filters.dateTo);
        endDate.setHours(23, 59, 59, 999);
        query = query.lte('created_at', endDate.toISOString());
      }

      // Pagination
      query = query.range(pageParam * ITEMS_PER_PAGE, (pageParam + 1) * ITEMS_PER_PAGE - 1);

      const { data: submissions, error } = await query;

      if (error) throw error;

      if (!submissions || submissions.length === 0) {
        return { photos: [], nextPage: undefined };
      }

      // Fetch campaign info (include category and campaign_type for SEO URLs)
      const campaignIds = [...new Set(submissions.map(s => s.campaign_id))];
      const { data: campaignsData } = await (supabase as any)
        .from('campaigns')
        .select('id, title, slug, category, campaign_type')
        .in('id', campaignIds);

      const campaignMap = new Map(campaignsData?.map((c: any) => [c.id, c]) || []);

      // Fetch profile info
      const userIds = [...new Set(submissions.map(s => s.user_id))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url')
        .in('id', userIds);

      const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);

      const photos: GalleryPhoto[] = submissions
        .filter(s => campaignMap.has(s.campaign_id))
        .map(s => ({
          id: s.id,
          title: s.title,
          image_url: s.image_url,
          video_url: s.video_url || null,
          video_duration_seconds: s.video_duration_seconds || null,
          video_thumbnail_url: s.video_thumbnail_url || null,
          slug: s.slug || '',
          view_count: s.view_count,
          like_count: s.like_count,
          status: s.status,
          created_at: s.created_at,
          user_id: s.user_id,
          seo_approved: s.seo_approved || false,
          seo_page_url: s.seo_page_url || null,
          campaign: campaignMap.get(s.campaign_id) as GalleryPhoto['campaign'],
          profile: profileMap.get(s.user_id) || null,
        }));

      const hasMore = submissions.length === ITEMS_PER_PAGE;
      
      return {
        photos,
        nextPage: hasMore ? pageParam + 1 : undefined,
      };
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage) => lastPage.nextPage,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};
