import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

type SubmissionStatus = 'pending' | 'approved' | 'rejected' | 'winner' | 'disqualified';

export interface AdminSubmission {
  id: string;
  title: string;
  description: string | null;
  image_url: string;
  slug: string | null;
  seo_title: string | null;
  meta_description: string | null;
  title_quality_flag: string | null;
  status: SubmissionStatus;
  originality_confirmed: boolean;
  exif_camera_make: string | null;
  exif_camera_model: string | null;
  exif_date_taken: string | null;
  exif_has_anomalies: boolean;
  exif_anomaly_reasons: string[] | null;
  visual_anomaly_score: number;
  duplicate_similarity_score: number;
  image_quality_score: number;
  risk_score: number;
  system_score: number;
  combined_score: number | null;
  report_count: number;
  admin_score: number | null;
  admin_notes: string | null;
  analysis_completed_at: string | null;
  created_at: string;
  seo_approved: boolean | null;
  contest: {
    id: string;
    title: string;
    status: string;
    prize_amount: number;
    prize_currency: string;
    category: string | null;
    slug: string | null;
  };
  profile: {
    id: string;
    full_name: string | null;
    email: string | null;
  };
}

async function fetchSubmissions(statusFilter: string): Promise<AdminSubmission[]> {
  let query = supabase
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
      status,
      originality_confirmed,
      exif_camera_make,
      exif_camera_model,
      exif_date_taken,
      exif_has_anomalies,
      exif_anomaly_reasons,
      visual_anomaly_score,
      duplicate_similarity_score,
      image_quality_score,
      risk_score,
      system_score,
      combined_score,
      report_count,
      admin_score,
      admin_notes,
      analysis_completed_at,
      created_at,
      seo_approved,
      contest:contests!submissions_contest_id_fkey(id, title, status, prize_amount, prize_currency, category, slug),
      profile:profiles!submissions_user_id_profiles_fkey(id, full_name, email)
    `)
    .order('risk_score', { ascending: false });

  if (
    statusFilter !== 'all' &&
    ['pending', 'approved', 'rejected', 'winner', 'disqualified'].includes(statusFilter)
  ) {
    query = query.eq('status', statusFilter as SubmissionStatus);
  }

  const { data, error } = await query;

  if (error) throw error;

  return (data as unknown as AdminSubmission[]) ?? [];
}

export function useAdminSubmissionsQuery(statusFilter: string) {
  return useQuery({
    queryKey: ['admin-submissions', statusFilter],
    queryFn: () => fetchSubmissions(statusFilter),
    staleTime: 30 * 1000,
    refetchOnWindowFocus: true,
  });
}
