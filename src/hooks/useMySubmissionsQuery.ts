import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

type SubmissionStatus = 'pending' | 'approved' | 'rejected' | 'winner' | 'disqualified';

export interface Submission {
  id: string;
  title: string;
  description: string | null;
  image_url: string;
  status: SubmissionStatus;
  admin_score: number | null;
  rejection_reason: string | null;
  created_at: string;
  contest_id: string;
  contest: {
    id: string;
    title: string;
    prize_amount: number;
    status: string;
  } | null;
}

export const useMySubmissionsQuery = (userId: string | undefined) => {
  return useQuery({
    queryKey: ['my-submissions', userId],
    queryFn: async () => {
      if (!userId) return [];

      const { data: subs, error } = await supabase
        .from('submissions')
        .select('id, title, description, image_url, status, admin_score, rejection_reason, created_at, contest_id')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const submissionRows = (subs ?? []) as unknown as Array<Omit<Submission, 'contest'>>;

      const contestIds = Array.from(
        new Set(submissionRows.map((s) => s.contest_id).filter(Boolean))
      );

      let contestsById = new Map<string, Submission['contest']>();

      if (contestIds.length > 0) {
        const { data: contests, error: contestError } = await supabase
          .from('contests')
          .select('id, title, prize_amount, status')
          .in('id', contestIds);

        if (!contestError && contests) {
          contests.forEach((c) => {
            contestsById.set(c.id, c as Submission['contest']);
          });
        }
      }

      const merged: Submission[] = submissionRows.map((s) => ({
        ...s,
        contest: contestsById.get(s.contest_id) ?? null,
      }));

      return merged;
    },
    enabled: !!userId,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};

export const useDeleteSubmission = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ submissionId, imageUrl }: { submissionId: string; imageUrl: string }) => {
      // Extract file path from URL for storage deletion
      const urlParts = imageUrl.split('/submissions/');
      if (urlParts[1]) {
        const filePath = urlParts[1];
        await supabase.storage.from('submissions').remove([filePath]);
      }

      const { error } = await supabase
        .from('submissions')
        .delete()
        .eq('id', submissionId);

      if (error) throw error;
      return submissionId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-submissions'] });
    },
  });
};
