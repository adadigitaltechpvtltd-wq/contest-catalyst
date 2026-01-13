import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface WinnerSubmission {
  id: string;
  title: string;
  image_url: string;
  combined_score: number | null;
  system_score: number | null;
  admin_score: number | null;
  status: string;
  created_at: string;
  profile: {
    id: string;
    full_name: string | null;
    avatar_url: string | null;
  };
}

export interface WinnerCampaign {
  id: string;
  title: string;
  theme: string | null;
  prize_amount: number;
  prize_currency: string;
  end_date: string;
  status: string;
  winner_id: string | null;
  winning_submission_id: string | null;
}

interface WinnerSelectionData {
  campaign: WinnerCampaign;
  submissions: WinnerSubmission[];
}

async function fetchWinnerSelectionData(campaignId: string): Promise<WinnerSelectionData> {
  // Fetch campaign
  const { data: campaignData, error: campaignError } = await (supabase as any)
    .from('campaigns')
    .select('*')
    .eq('id', campaignId)
    .single();

  if (campaignError) throw campaignError;

  // Fetch approved submissions ranked by combined_score
  const { data: submissionsData, error: submissionsError } = await supabase
    .from('submissions')
    .select(`
      id,
      title,
      image_url,
      combined_score,
      system_score,
      admin_score,
      status,
      created_at,
      profile:profiles!submissions_user_id_profiles_fkey(id, full_name, avatar_url)
    `)
    .eq('campaign_id', campaignId)
    .in('status', ['approved', 'winner'])
    .order('combined_score', { ascending: false, nullsFirst: false });

  if (submissionsError) throw submissionsError;

  return {
    campaign: campaignData as WinnerCampaign,
    submissions: (submissionsData as unknown as WinnerSubmission[]) ?? [],
  };
}

export function useWinnerSelectionQuery(campaignId: string | undefined) {
  return useQuery({
    queryKey: ['winner-selection', campaignId],
    queryFn: () => fetchWinnerSelectionData(campaignId!),
    enabled: !!campaignId,
    staleTime: 30 * 1000,
    refetchOnWindowFocus: true,
  });
}
