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
import { AlertTriangle, Loader2, Trash2 } from 'lucide-react';

const DeleteAccountDialog = () => {
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

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

      const result = data as { success: boolean; error?: string; message?: string };

      if (!result.success) {
        toast({
          title: 'Cannot delete account',
          description: result.error || 'An error occurred while deleting your account.',
          variant: 'destructive',
        });
        setIsDeleting(false);
        return;
      }

      // Sign out and redirect
      toast({
        title: 'Account deleted',
        description: 'Your account has been deleted successfully. We\'re sorry to see you go.',
      });

      await signOut();
      navigate('/');
    } catch (error: any) {
      console.error('Error deleting account:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete account. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(false);
      setIsOpen(false);
      setIsConfirmed(false);
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
              <div className="flex items-start gap-2 p-3 bg-destructive/10 border border-destructive/30 rounded-lg">
                <AlertTriangle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
                <p className="text-sm font-medium text-destructive">
                  This action is permanent.
                </p>
              </div>

              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  Deleting your account will:
                </p>
                <ul className="list-disc pl-5 text-sm text-muted-foreground space-y-1">
                  <li>Remove your personal information</li>
                  <li>Anonymize your profile to "Deleted User"</li>
                  <li>Keep your submissions visible (for contest integrity)</li>
                  <li>Preserve leaderboard rankings</li>
                </ul>
              </div>

              <p className="text-sm font-medium text-foreground">
                You will not be able to recover your account after deletion.
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
                  I understand that this action cannot be undone
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
                Deleting...
              </>
            ) : (
              'Delete Account'
            )}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default DeleteAccountDialog;
