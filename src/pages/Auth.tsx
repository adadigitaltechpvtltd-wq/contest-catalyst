import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Camera, Loader2, Mail, CheckCircle, ArrowLeft } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import Navbar from '@/components/Navbar';
import PasswordStrengthIndicator from '@/components/PasswordStrengthIndicator';

const Auth = () => {
  const { user, isLoading, signIn, signUp } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState('login');
  const [showEmailConfirmation, setShowEmailConfirmation] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState('');
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState('');
  const [forgotPasswordSent, setForgotPasswordSent] = useState(false);

  // Login state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Signup state
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupConfirmPassword, setSignupConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState<Date>();
  const [phone, setPhone] = useState('');
  const [ageConfirmed, setAgeConfirmed] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const { error } = await signIn(loginEmail, loginPassword);

    if (error) {
      toast({
        title: 'Login failed',
        description: error.message,
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Welcome back!',
        description: 'You have successfully logged in.',
      });
      navigate('/dashboard');
    }

    setIsSubmitting(false);
  };

  const validatePasswordStrength = (password: string): boolean => {
    const hasMinLength = password.length >= 8;
    const hasUppercase = /[A-Z]/.test(password);
    const hasLowercase = /[a-z]/.test(password);
    const hasNumber = /\d/.test(password);
    
    return hasMinLength && hasUppercase && hasLowercase && hasNumber;
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();

    if (signupPassword !== signupConfirmPassword) {
      toast({
        title: 'Passwords do not match',
        description: 'Please make sure your passwords match.',
        variant: 'destructive',
      });
      return;
    }

    if (!validatePasswordStrength(signupPassword)) {
      toast({
        title: 'Password too weak',
        description: 'Please create a stronger password with at least 8 characters, uppercase, lowercase, and a number.',
        variant: 'destructive',
      });
      return;
    }

    if (!dateOfBirth) {
      toast({
        title: 'Date of birth required',
        description: 'Please select your date of birth.',
        variant: 'destructive',
      });
      return;
    }

    if (!ageConfirmed) {
      toast({
        title: 'Age confirmation required',
        description: 'Please confirm that you are at least 18 years old.',
        variant: 'destructive',
      });
      return;
    }

    if (!termsAccepted) {
      toast({
        title: 'Terms acceptance required',
        description: 'Please accept the terms and conditions.',
        variant: 'destructive',
      });
      return;
    }

    if (!phone.trim()) {
      toast({
        title: 'Phone number required',
        description: 'Please enter your phone number for payment purposes.',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);

    const { error } = await signUp(signupEmail, signupPassword, fullName, dateOfBirth, phone);

    if (error) {
      // Show user-friendly message for duplicate email
      const errorMessage = error.message.includes('Database error') 
        ? 'This email is already registered. Please use a different email or try logging in.'
        : error.message;
      
      toast({
        title: 'Signup failed',
        description: errorMessage,
        variant: 'destructive',
      });
    } else {
      setRegisteredEmail(signupEmail);
      setShowEmailConfirmation(true);
    }

    setIsSubmitting(false);
  };

  const handleBackToLogin = () => {
    setShowEmailConfirmation(false);
    setShowForgotPassword(false);
    setForgotPasswordSent(false);
    setActiveTab('login');
    // Clear signup form
    setSignupEmail('');
    setSignupPassword('');
    setSignupConfirmPassword('');
    setFullName('');
    setDateOfBirth(undefined);
    setPhone('');
    setAgeConfirmed(false);
    setTermsAccepted(false);
    setForgotPasswordEmail('');
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const { error } = await supabase.auth.resetPasswordForEmail(forgotPasswordEmail, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    if (error) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } else {
      setForgotPasswordSent(true);
    }

    setIsSubmitting(false);
  };

  // Forgot password sent confirmation
  if (forgotPasswordSent) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-12 pt-24">
          <div className="max-w-md mx-auto">
            <Card className="glass-card">
              <CardContent className="pt-8 pb-8">
                <div className="text-center space-y-6">
                  <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                    <Mail className="h-8 w-8 text-primary" />
                  </div>
                  
                  <div className="space-y-2">
                    <h2 className="text-2xl font-display font-bold">Check your email</h2>
                    <p className="text-muted-foreground">
                      We've sent a password reset link to
                    </p>
                    <p className="font-medium text-foreground">{forgotPasswordEmail}</p>
                  </div>

                  <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span>Click the link in the email to reset your password</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span>The link will expire in 1 hour</span>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Button
                      onClick={handleBackToLogin}
                      className="w-full gradient-primary"
                    >
                      Back to Login
                    </Button>
                    <p className="text-xs text-muted-foreground">
                      Didn't receive the email? Check your spam folder or try again.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  // Forgot password form
  if (showForgotPassword) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-12 pt-24">
          <div className="max-w-md mx-auto">
            <div className="text-center mb-8">
              <div className="flex items-center justify-center gap-2 mb-4">
                <Camera className="h-10 w-10 text-primary" />
                <span className="text-3xl font-display font-bold text-gradient">Contestify</span>
              </div>
              <p className="text-muted-foreground">
                Reset your password
              </p>
            </div>

            <Card className="glass-card">
              <CardContent className="pt-6">
                <form onSubmit={handleForgotPassword} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="forgot-email">Email</Label>
                    <Input
                      id="forgot-email"
                      type="email"
                      placeholder="you@example.com"
                      value={forgotPasswordEmail}
                      onChange={(e) => setForgotPasswordEmail(e.target.value)}
                      required
                    />
                    <p className="text-xs text-muted-foreground">
                      Enter the email address associated with your account and we'll send you a link to reset your password.
                    </p>
                  </div>
                  <Button
                    type="submit"
                    className="w-full gradient-primary"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : null}
                    Send Reset Link
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    className="w-full"
                    onClick={handleBackToLogin}
                  >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to Login
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  // Email confirmation view
  if (showEmailConfirmation) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-12 pt-24">
          <div className="max-w-md mx-auto">
            <Card className="glass-card">
              <CardContent className="pt-8 pb-8">
                <div className="text-center space-y-6">
                  <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                    <Mail className="h-8 w-8 text-primary" />
                  </div>
                  
                  <div className="space-y-2">
                    <h2 className="text-2xl font-display font-bold">Check your email</h2>
                    <p className="text-muted-foreground">
                      We've sent a verification link to
                    </p>
                    <p className="font-medium text-foreground">{registeredEmail}</p>
                  </div>

                  <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span>Click the link in the email to verify your account</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span>After verification, come back here to login</span>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Button
                      onClick={handleBackToLogin}
                      className="w-full gradient-primary"
                    >
                      Back to Login
                    </Button>
                    <p className="text-xs text-muted-foreground">
                      Didn't receive the email? Check your spam folder or try signing up again.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 py-12 pt-24">
        <div className="max-w-md mx-auto">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-2 mb-4">
              <Camera className="h-10 w-10 text-primary" />
              <span className="text-3xl font-display font-bold text-gradient">Contestify</span>
            </div>
            <p className="text-muted-foreground">
              Join the community of photographers and win amazing prizes!
            </p>
          </div>

          <Card className="glass-card">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <CardHeader>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="login">Login</TabsTrigger>
                  <TabsTrigger value="signup">Sign Up</TabsTrigger>
                </TabsList>
              </CardHeader>

              <CardContent>
                <TabsContent value="login">
                  <form onSubmit={handleLogin} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="login-email">Email</Label>
                      <Input
                        id="login-email"
                        type="email"
                        placeholder="you@example.com"
                        value={loginEmail}
                        onChange={(e) => setLoginEmail(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="login-password">Password</Label>
                        <button
                          type="button"
                          onClick={() => setShowForgotPassword(true)}
                          className="text-xs text-primary hover:underline"
                        >
                          Forgot password?
                        </button>
                      </div>
                      <Input
                        id="login-password"
                        type="password"
                        placeholder="••••••••"
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        required
                      />
                    </div>
                    <Button
                      type="submit"
                      className="w-full gradient-primary"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : null}
                      Login
                    </Button>
                  </form>
                </TabsContent>

                <TabsContent value="signup">
                  <form onSubmit={handleSignup} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="full-name">Full Name</Label>
                      <Input
                        id="full-name"
                        type="text"
                        placeholder="John Doe"
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
                        placeholder="you@example.com"
                        value={signupEmail}
                        onChange={(e) => setSignupEmail(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone Number</Label>
                      <Input
                        id="phone"
                        type="tel"
                        placeholder="+91 9876543210"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        required
                      />
                      <p className="text-xs text-muted-foreground">
                        Required for prize payment purposes
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Label>Date of Birth</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              'w-full justify-start text-left font-normal',
                              !dateOfBirth && 'text-muted-foreground'
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {dateOfBirth ? format(dateOfBirth, 'PPP') : 'Pick a date'}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={dateOfBirth}
                            onSelect={setDateOfBirth}
                            disabled={(date) =>
                              date > new Date() || date < new Date('1900-01-01')
                            }
                            initialFocus
                            captionLayout="dropdown-buttons"
                            fromYear={1900}
                            toYear={new Date().getFullYear()}
                          />
                        </PopoverContent>
                      </Popover>
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
                        minLength={8}
                      />
                      <PasswordStrengthIndicator password={signupPassword} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signup-confirm-password">Confirm Password</Label>
                      <Input
                        id="signup-confirm-password"
                        type="password"
                        placeholder="••••••••"
                        value={signupConfirmPassword}
                        onChange={(e) => setSignupConfirmPassword(e.target.value)}
                        required
                        minLength={8}
                      />
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="age-confirm"
                        checked={ageConfirmed}
                        onCheckedChange={(checked) => setAgeConfirmed(checked as boolean)}
                      />
                      <Label htmlFor="age-confirm" className="text-sm">
                        I confirm that I am at least 18 years old
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="terms"
                        checked={termsAccepted}
                        onCheckedChange={(checked) => setTermsAccepted(checked as boolean)}
                      />
                      <Label htmlFor="terms" className="text-sm">
                        I accept the{' '}
                        <a href="/terms" className="text-primary hover:underline">
                          Terms & Conditions
                        </a>{' '}
                        and{' '}
                        <a href="/privacy" className="text-primary hover:underline">
                          Privacy Policy
                        </a>
                      </Label>
                    </div>
                    <Button
                      type="submit"
                      className="w-full gradient-primary"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : null}
                      Create Account
                    </Button>
                  </form>
                </TabsContent>
              </CardContent>
            </Tabs>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Auth;
