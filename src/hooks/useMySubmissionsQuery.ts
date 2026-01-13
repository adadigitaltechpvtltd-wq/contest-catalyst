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
  campaign_id: string;
  campaign: {
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
        .select('id, title, description, image_url, status, admin_score, rejection_reason, created_at, campaign_id')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const submissionRows = (subs ?? []) as unknown as Array<Omit<Submission, 'campaign'>>;

      const campaignIds = Array.from(
        new Set(submissionRows.map((s) => s.campaign_id).filter(Boolean))
      );

      let campaignsById = new Map<string, Submission['campaign']>();

      if (campaignIds.length > 0) {
        const { data: campaigns, error: campaignError } = await (supabase as any)
          .from('campaigns')
          .select('id, title, prize_amount, status')
          .in('id', campaignIds);

        if (!campaignError && campaigns) {
          campaigns.forEach((c: any) => {
            campaignsById.set(c.id, c as Submission['campaign']);
          });
        }
      }

      const merged: Submission[] = submissionRows.map((s) => ({
        ...s,
        campaign: campaignsById.get(s.campaign_id) ?? null,
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
