import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

type SubmissionStatus = 'pending' | 'approved' | 'rejected' | 'winner' | 'disqualified';

export interface SubmissionDetail {
  id: string;
  title: string;
  description: string | null;
  image_url: string;
  status: SubmissionStatus;
  admin_score: number | null;
  admin_notes: string | null;
  rejection_reason: string | null;
  created_at: string;
  updated_at: string;
  reviewed_at: string | null;
  campaign: {
    id: string;
    slug: string | null;
    title: string;
    prize_amount: number;
    prize_currency: string;
    status: string;
    end_date: string;
  };
}

async function fetchSubmissionDetail(id: string, userId: string): Promise<SubmissionDetail | null> {
  const { data, error } = await supabase
    .from('submissions')
    .select(`
      id,
      title,
      description,
      image_url,
      status,
      admin_score,
      admin_notes,
      rejection_reason,
      created_at,
      updated_at,
      reviewed_at,
      campaign:campaigns(id, slug, title, prize_amount, prize_currency, status, end_date)
    `)
    .eq('id', id)
    .eq('user_id', userId)
    .maybeSingle();

  if (error) throw error;

  return data as unknown as SubmissionDetail | null;
}

export function useSubmissionDetailQuery(id: string | undefined, userId: string | undefined) {
  return useQuery({
    queryKey: ['submission-detail', id],
    queryFn: () => fetchSubmissionDetail(id!, userId!),
    enabled: !!id && !!userId,
    staleTime: 30 * 1000,
    refetchOnWindowFocus: true,
  });
}
