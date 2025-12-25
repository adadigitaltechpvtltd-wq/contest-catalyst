import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle, Loader2, X } from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';

interface AccountDeletionBannerProps {
  scheduledDeletionAt: string;
  onCancelled?: () => void;
}

const AccountDeletionBanner = ({ scheduledDeletionAt, onCancelled }: AccountDeletionBannerProps) => {
  const { user, refreshProfile } = useAuth();
  const { toast } = useToast();
  const [isCancelling, setIsCancelling] = useState(false);

  const deletionDate = new Date(scheduledDeletionAt);
  const formattedDate = format(deletionDate, 'MMMM d, yyyy');
  const timeRemaining = formatDistanceToNow(deletionDate, { addSuffix: true });

  const handleCancelDeletion = async () => {
    if (!user) return;

    setIsCancelling(true);

    try {
      const { data, error } = await supabase.rpc('cancel_account_deletion', {
        _user_id: user.id,
      });

      if (error) throw error;

      const result = data as { success: boolean; error?: string; message?: string };

      if (!result.success) {
        toast({
          title: 'Error',
          description: result.error || 'Failed to cancel account deletion.',
          variant: 'destructive',
        });
        return;
      }

      toast({
        title: 'Deletion cancelled',
        description: 'Your account deletion has been cancelled. Welcome back!',
      });

      await refreshProfile();
      onCancelled?.();
    } catch (error: any) {
      console.error('Error cancelling deletion:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to cancel account deletion. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsCancelling(false);
    }
  };

  return (
    <Alert variant="destructive" className="mb-6 border-destructive/50 bg-destructive/10">
      <AlertTriangle className="h-5 w-5" />
      <AlertTitle className="ml-2">Account Scheduled for Deletion</AlertTitle>
      <AlertDescription className="ml-2 mt-2">
        <p className="text-sm">
          Your account is scheduled to be permanently deleted on{' '}
          <strong>{formattedDate}</strong> ({timeRemaining}).
        </p>
        <p className="text-sm mt-2 text-muted-foreground">
          All your personal data will be removed. Your submissions will remain visible under "Deleted User".
        </p>
        <div className="mt-4 flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={handleCancelDeletion}
            disabled={isCancelling}
            className="border-destructive/50 hover:bg-destructive/20"
          >
            {isCancelling ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Cancelling...
              </>
            ) : (
              <>
                <X className="h-4 w-4 mr-2" />
                Cancel Deletion
              </>
            )}
          </Button>
          <span className="text-xs text-muted-foreground">
            You can keep using your account normally until then
          </span>
        </div>
      </AlertDescription>
    </Alert>
  );
};

export default AccountDeletionBanner;
