import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface Contest {
  id: string;
  title: string;
  description: string | null;
  theme: string | null;
  prize_amount: number;
  rules: string[] | null;
  end_date: string;
}

export interface PreviousSubmission {
  id: string;
  title: string;
  image_url: string;
  status: string;
  created_at: string;
  contest: {
    title: string;
  } | null;
}

interface SubmitPhotoData {
  contest: Contest | null;
  hasSubmitted: boolean;
}

async function fetchContestForSubmission(slug: string, userId: string): Promise<SubmitPhotoData> {
  // Support both slug and UUID for backward compatibility
  const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(slug);

  const { data, error } = await supabase
    .from('contests')
    .select('id, title, description, theme, prize_amount, rules, end_date')
    .eq(isUUID ? 'id' : 'slug', slug)
    .eq('status', 'active')
    .maybeSingle();

  if (error || !data) {
    return { contest: null, hasSubmitted: false };
  }

  // Check if user already submitted
  const { data: submission } = await supabase
    .from('submissions')
    .select('id')
    .eq('contest_id', data.id)
    .eq('user_id', userId)
    .maybeSingle();

  return {
    contest: data,
    hasSubmitted: !!submission,
  };
}

export function useSubmitPhotoQuery(slug: string | undefined, userId: string | undefined) {
  return useQuery({
    queryKey: ['submit-photo', slug, userId],
    queryFn: () => fetchContestForSubmission(slug!, userId!),
    enabled: !!slug && !!userId,
    staleTime: 30 * 1000,
  });
}

async function fetchPreviousSubmissions(userId: string): Promise<PreviousSubmission[]> {
  const { data, error } = await supabase
    .from('submissions')
    .select(`
      id,
      title,
      image_url,
      status,
      created_at,
      contest:contests(title)
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(12);

  if (error) throw error;

  return (data as PreviousSubmission[]) ?? [];
}

export function usePreviousSubmissionsQuery(userId: string | undefined) {
  return useQuery({
    queryKey: ['previous-submissions', userId],
    queryFn: () => fetchPreviousSubmissions(userId!),
    enabled: !!userId,
    staleTime: 60 * 1000,
  });
}
