import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { AlertTriangle, Loader2, Trash2, Clock } from 'lucide-react';
import { format, addDays } from 'date-fns';

const DeleteAccountDialog = () => {
  const { user, signOut, refreshProfile } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const deletionDate = format(addDays(new Date(), 30), 'MMMM d, yyyy');

  const handleDeleteAccount = async () => {
    if (!user || !isConfirmed) return;

    setIsDeleting(true);

    try {
      // Call the soft_delete_account function
      const { data, error } = await supabase.rpc('soft_delete_account', {
        _user_id: user.id,
      });

      if (error) {
        throw error;
      }

      const result = data as { success: boolean; error?: string; message?: string; deletion_date?: string };

      if (!result.success) {
        toast({
          title: 'Cannot delete account',
          description: result.error || 'An error occurred while scheduling your account deletion.',
          variant: 'destructive',
        });
        setIsDeleting(false);
        return;
      }

      toast({
        title: 'Account scheduled for deletion',
        description: `Your account will be permanently deleted on ${deletionDate}. You can cancel this from your profile settings.`,
      });

      // Refresh profile to get the scheduled_deletion_at
      await refreshProfile();
      setIsOpen(false);
      setIsConfirmed(false);
    } catch (error: any) {
      console.error('Error scheduling account deletion:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to schedule account deletion. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={(open) => {
      setIsOpen(open);
      if (!open) {
        setIsConfirmed(false);
      }
    }}>
      <AlertDialogTrigger asChild>
        <Button variant="destructive" className="gap-2">
          <Trash2 className="h-4 w-4" />
          Delete Account
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            Delete Account
          </AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-4">
              <div className="flex items-start gap-2 p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg">
                <Clock className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-amber-500">
                    30-Day Grace Period
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Your account will be scheduled for deletion on <strong>{deletionDate}</strong>. 
                    You can cancel anytime before this date.
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  After the grace period, deleting your account will:
                </p>
                <ul className="list-disc pl-5 text-sm text-muted-foreground space-y-1">
                  <li>Remove your personal information permanently</li>
                  <li>Anonymize your profile to "Deleted User"</li>
                  <li>Keep your submissions visible (for contest integrity)</li>
                  <li>Preserve leaderboard rankings</li>
                </ul>
              </div>

              <p className="text-sm text-foreground">
                During the grace period, you can log in and cancel the deletion from your profile settings.
              </p>

              <div className="flex items-center space-x-2 pt-2">
                <Checkbox
                  id="confirm-delete"
                  checked={isConfirmed}
                  onCheckedChange={(checked) => setIsConfirmed(checked === true)}
                />
                <Label
                  htmlFor="confirm-delete"
                  className="text-sm font-medium cursor-pointer"
                >
                  I understand and want to schedule account deletion
                </Label>
              </div>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="gap-2 sm:gap-0">
          <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
          <Button
            variant="destructive"
            onClick={handleDeleteAccount}
            disabled={!isConfirmed || isDeleting}
          >
            {isDeleting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Scheduling...
              </>
            ) : (
              'Schedule Deletion'
            )}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default DeleteAccountDialog;
