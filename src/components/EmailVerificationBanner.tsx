import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Mail, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

const EmailVerificationBanner = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isResending, setIsResending] = useState(false);

  // Check if email is verified
  const isEmailVerified = user?.email_confirmed_at != null;

  const handleResendVerification = async () => {
    if (!user?.email) return;

    setIsResending(true);

    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: user.email,
        options: {
          emailRedirectTo: `${window.location.origin}/dashboard`,
        },
      });

      if (error) {
        toast({
          title: 'Failed to resend',
          description: error.message,
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Verification email sent',
          description: 'Please check your inbox and spam folder.',
        });
      }
    } catch {
      toast({
        title: 'Error',
        description: 'Something went wrong. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsResending(false);
    }
  };

  if (!user) return null;

  if (isEmailVerified) {
    return (
      <Card className="border-success/30 bg-success/5">
        <CardContent className="flex items-center gap-3 p-4">
          <div className="p-2 rounded-full bg-success/10">
            <CheckCircle className="h-5 w-5 text-success" />
          </div>
          <div className="flex-1">
            <p className="font-medium text-success">Email Verified</p>
            <p className="text-sm text-muted-foreground">{user.email}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-destructive/30 bg-destructive/5">
      <CardContent className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-4">
        <div className="flex items-center gap-3 flex-1">
          <div className="p-2 rounded-full bg-destructive/10">
            <AlertCircle className="h-5 w-5 text-destructive" />
          </div>
          <div>
            <p className="font-medium text-destructive">Email Not Verified</p>
            <p className="text-sm text-muted-foreground">
              Please verify your email ({user.email}) to access all features.
            </p>
          </div>
        </div>
        <Button
          onClick={handleResendVerification}
          disabled={isResending}
          variant="outline"
          size="sm"
          className="shrink-0"
        >
          {isResending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              Sending...
            </>
          ) : (
            <>
              <Mail className="h-4 w-4 mr-2" />
              Resend Verification
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
};

export default EmailVerificationBanner;
