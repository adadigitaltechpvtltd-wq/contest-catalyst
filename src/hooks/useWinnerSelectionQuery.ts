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

export interface WinnerContest {
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
  contest: WinnerContest;
  submissions: WinnerSubmission[];
}

async function fetchWinnerSelectionData(contestId: string): Promise<WinnerSelectionData> {
  // Fetch contest
  const { data: contestData, error: contestError } = await supabase
    .from('contests')
    .select('*')
    .eq('id', contestId)
    .single();

  if (contestError) throw contestError;

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
    .eq('contest_id', contestId)
    .in('status', ['approved', 'winner'])
    .order('combined_score', { ascending: false, nullsFirst: false });

  if (submissionsError) throw submissionsError;

  return {
    contest: contestData as WinnerContest,
    submissions: (submissionsData as unknown as WinnerSubmission[]) ?? [],
  };
}

export function useWinnerSelectionQuery(contestId: string | undefined) {
  return useQuery({
    queryKey: ['winner-selection', contestId],
    queryFn: () => fetchWinnerSelectionData(contestId!),
    enabled: !!contestId,
    staleTime: 30 * 1000,
    refetchOnWindowFocus: true,
  });
}
