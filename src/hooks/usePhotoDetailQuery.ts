import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface PhotoData {
  id: string;
  title: string;
  description: string | null;
  image_url: string;
  slug: string;
  seo_title: string | null;
  meta_description: string | null;
  title_quality_flag: string | null;
  view_count: number;
  download_count: number;
  like_count: number;
  created_at: string;
  status: string;
  user_id: string;
  campaign: {
    id: string;
    title: string;
    slug: string;
    category: string | null;
    theme: string | null;
    prize_amount: number;
    prize_currency: string;
    seo_title: string | null;
    meta_description: string | null;
    keywords: string[] | null;
  };
  profile: {
    full_name: string | null;
    avatar_url: string | null;
    username: string | null;
  } | null;
}

export interface RelatedPhoto {
  id: string;
  title: string;
  image_url: string;
  slug: string;
}

interface PhotoDetailData {
  photo: PhotoData;
  relatedPhotos: RelatedPhoto[];
}

async function fetchPhotoDetail(campaignSlug: string, photoSlug: string): Promise<PhotoDetailData | null> {
  // First find the campaign by slug with SEO fields and category
  const { data: campaign, error: campaignError } = await (supabase as any)
    .from('campaigns')
    .select('id, title, slug, category, theme, prize_amount, prize_currency, seo_title, meta_description, keywords')
    .eq('slug', campaignSlug)
    .maybeSingle();

  if (campaignError || !campaign) {
    return null;
  }

  // Then find the submission by slug within that campaign
  const { data: submission, error: subError } = await supabase
    .from('submissions')
    .select(`
      id,
      title,
      description,
      image_url,
      slug,
      seo_title,
      meta_description,
      title_quality_flag,
      view_count,
      download_count,
      like_count,
      created_at,
      status,
      user_id
    `)
    .eq('campaign_id', campaign.id)
    .eq('slug', photoSlug)
    .maybeSingle();

  if (subError || !submission) {
    return null;
  }

  // Fetch photographer profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, avatar_url, username')
    .eq('id', submission.user_id)
    .maybeSingle();

  // Fetch related photos from same campaign
  const { data: related } = await supabase
    .from('submissions')
    .select('id, title, image_url, slug')
    .eq('campaign_id', campaign.id)
    .neq('id', submission.id)
    .in('status', ['approved', 'winner'])
    .limit(4);

  return {
    photo: {
      ...submission,
      campaign,
      profile: profile || null,
    } as unknown as PhotoData,
    relatedPhotos: (related || []) as unknown as RelatedPhoto[],
  };
}

export function usePhotoDetailQuery(campaignSlug: string | undefined, photoSlug: string | undefined) {
  return useQuery({
    queryKey: ['photo-detail', campaignSlug, photoSlug],
    queryFn: () => fetchPhotoDetail(campaignSlug!, photoSlug!),
    enabled: !!campaignSlug && !!photoSlug,
    staleTime: 60 * 1000,
    refetchOnWindowFocus: true,
  });
}
