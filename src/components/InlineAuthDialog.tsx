import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, AlertCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface InlineAuthDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  title?: string;
  description?: string;
}

const InlineAuthDialog = ({ 
  open, 
  onOpenChange, 
  onSuccess,
  title = "Sign in to continue",
  description = "You need to be logged in to perform this action."
}: InlineAuthDialogProps) => {
  const { signIn, signUp } = useAuth();
  const [activeTab, setActiveTab] = useState<'login' | 'signup'>('login');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Login state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  // Signup state
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupConfirmPassword, setSignupConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [signupError, setSignupError] = useState('');

  const resetForm = () => {
    setLoginEmail('');
    setLoginPassword('');
    setLoginError('');
    setSignupEmail('');
    setSignupPassword('');
    setSignupConfirmPassword('');
    setFullName('');
    setSignupError('');
    setActiveTab('login');
  };

  const handleClose = (open: boolean) => {
    if (!open) {
      resetForm();
    }
    onOpenChange(open);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setIsSubmitting(true);

    const { error } = await signIn(loginEmail, loginPassword);

    if (error) {
      setLoginError(error.message);
    } else {
      toast.success('Welcome back!');
      resetForm();
      onOpenChange(false);
      onSuccess?.();
    }

    setIsSubmitting(false);
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setSignupError('');

    if (!fullName.trim()) {
      setSignupError('Full name is required');
      return;
    }

    if (signupPassword !== signupConfirmPassword) {
      setSignupError('Passwords do not match');
      return;
    }

    if (signupPassword.length < 8) {
      setSignupError('Password must be at least 8 characters');
      return;
    }

    setIsSubmitting(true);

    // Use default values for date of birth (18 years ago) and phone for inline signup
    // User can update these later in profile
    const defaultDob = new Date();
    defaultDob.setFullYear(defaultDob.getFullYear() - 18);
    
    const { error } = await signUp(signupEmail, signupPassword, fullName, defaultDob, '');

    if (error) {
      const msg = (error.message ?? '').toLowerCase();
      if (msg.includes('already registered') || msg.includes('duplicate')) {
        setSignupError('This email is already registered. Please log in instead.');
      } else {
        setSignupError(error.message);
      }
    } else {
      toast.success('Account created! Please check your email to verify.');
      resetForm();
      onOpenChange(false);
    }

    setIsSubmitting(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display text-xl">{title}</DialogTitle>
          <p className="text-sm text-muted-foreground">{description}</p>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'login' | 'signup')}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="login">Log In</TabsTrigger>
            <TabsTrigger value="signup">Sign Up</TabsTrigger>
          </TabsList>

          <TabsContent value="login" className="mt-4">
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="login-email">Email</Label>
                <Input
                  id="login-email"
                  type="email"
                  placeholder="your@email.com"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="login-password">Password</Label>
                <Input
                  id="login-password"
                  type="password"
                  placeholder="••••••••"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  required
                />
              </div>

              {loginError && (
                <div className="flex items-center gap-2 text-sm text-destructive">
                  <AlertCircle className="h-4 w-4" />
                  {loginError}
                </div>
              )}

              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Logging in...
                  </>
                ) : (
                  'Log In'
                )}
              </Button>
            </form>
          </TabsContent>

          <TabsContent value="signup" className="mt-4">
            <form onSubmit={handleSignup} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="signup-name">Full Name</Label>
                <Input
                  id="signup-name"
                  type="text"
                  placeholder="Your Name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="signup-email">Email</Label>
                <Input
                  id="signup-email"
                  type="email"
                  placeholder="your@email.com"
                  value={signupEmail}
                  onChange={(e) => setSignupEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="signup-password">Password</Label>
                <Input
                  id="signup-password"
                  type="password"
                  placeholder="••••••••"
                  value={signupPassword}
                  onChange={(e) => setSignupPassword(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="signup-confirm">Confirm Password</Label>
                <Input
                  id="signup-confirm"
                  type="password"
                  placeholder="••••••••"
                  value={signupConfirmPassword}
                  onChange={(e) => setSignupConfirmPassword(e.target.value)}
                  required
                />
              </div>

              {signupError && (
                <div className="flex items-center gap-2 text-sm text-destructive">
                  <AlertCircle className="h-4 w-4" />
                  {signupError}
                </div>
              )}

              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating account...
                  </>
                ) : (
                  'Create Account'
                )}
              </Button>
            </form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default InlineAuthDialog;
