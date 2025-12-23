import { useState, useMemo, useEffect } from 'react';
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
import { CalendarIcon, Camera, Loader2, Mail, CheckCircle, ArrowLeft, AlertCircle } from 'lucide-react';
import { format, subYears } from 'date-fns';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import Navbar from '@/components/Navbar';
import PasswordStrengthIndicator from '@/components/PasswordStrengthIndicator';
import CountryCodeSelect, { detectCountryCode } from '@/components/CountryCodeSelect';
import PasswordInput from '@/components/PasswordInput';

// Validation helper component
const FieldError = ({ error }: { error?: string }) => {
  if (!error) return null;
  return (
    <p className="text-xs text-destructive flex items-center gap-1 mt-1">
      <AlertCircle className="h-3 w-3" />
      {error}
    </p>
  );
};

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
  const [countryCode, setCountryCode] = useState(() => detectCountryCode());
  const [phoneNumber, setPhoneNumber] = useState('');
  const [ageConfirmed, setAgeConfirmed] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);

  // Field touched state for showing validation
  const [touched, setTouched] = useState({
    fullName: false,
    signupEmail: false,
    phone: false,
    signupPassword: false,
    signupConfirmPassword: false,
  });

  // Date restrictions for 18+ (max date is 18 years ago from today)
  const maxDate = useMemo(() => subYears(new Date(), 18), []);
  const minDate = useMemo(() => new Date('1900-01-01'), []);

  // Real-time validation errors
  const fieldErrors = useMemo(() => {
    const errors: Record<string, string> = {};

    // Full name validation
    if (touched.fullName) {
      const trimmedName = fullName.trim();
      if (!trimmedName) {
        errors.fullName = 'Full name is required';
      } else if (trimmedName.length < 2) {
        errors.fullName = 'Name must be at least 2 characters';
      }
    }

    // Email validation
    if (touched.signupEmail) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!signupEmail.trim()) {
        errors.signupEmail = 'Email is required';
      } else if (!emailRegex.test(signupEmail.trim())) {
        errors.signupEmail = 'Please enter a valid email address';
      }
    }

    // Phone validation
    if (touched.phone) {
      const cleanedPhone = phoneNumber.replace(/[\s\-\(\)]/g, '');
      if (!cleanedPhone) {
        errors.phone = 'Phone number is required';
      } else if (cleanedPhone.length < 6 || cleanedPhone.length > 14) {
        errors.phone = 'Phone number must be 6-14 digits';
      } else if (!/^\d+$/.test(cleanedPhone)) {
        errors.phone = 'Phone number must contain only digits';
      }
    }

    // Confirm password validation
    if (touched.signupConfirmPassword && signupConfirmPassword) {
      if (signupPassword !== signupConfirmPassword) {
        errors.signupConfirmPassword = 'Passwords do not match';
      }
    }

    return errors;
  }, [fullName, signupEmail, phoneNumber, signupPassword, signupConfirmPassword, touched]);

  const handleBlur = (field: keyof typeof touched) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  };

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

  const calculateAge = (birthDate: Date): number => {
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate full name
    const trimmedName = fullName.trim();
    if (!trimmedName) {
      toast({
        title: 'Full name required',
        description: 'Please enter your full name.',
        variant: 'destructive',
      });
      return;
    }

    if (trimmedName.length < 2) {
      toast({
        title: 'Invalid name',
        description: 'Name must be at least 2 characters long.',
        variant: 'destructive',
      });
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(signupEmail.trim())) {
      toast({
        title: 'Invalid email',
        description: 'Please enter a valid email address.',
        variant: 'destructive',
      });
      return;
    }

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

    // Validate date is not in the future
    if (dateOfBirth > new Date()) {
      toast({
        title: 'Invalid date of birth',
        description: 'Date of birth cannot be in the future.',
        variant: 'destructive',
      });
      return;
    }

    // Calculate and validate age >= 18
    const age = calculateAge(dateOfBirth);
    if (age < 18) {
      toast({
        title: 'Age restriction',
        description: 'You must be at least 18 years old to create an account.',
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

    // Phone validation
    const cleanedPhone = phoneNumber.replace(/[\s\-\(\)]/g, '');
    
    if (!cleanedPhone) {
      toast({
        title: 'Phone number required',
        description: 'Please enter your phone number for payment purposes.',
        variant: 'destructive',
      });
      return;
    }

    if (cleanedPhone.length < 6 || cleanedPhone.length > 14 || !/^\d+$/.test(cleanedPhone)) {
      toast({
        title: 'Invalid phone number',
        description: 'Please enter a valid phone number (6-14 digits).',
        variant: 'destructive',
      });
      return;
    }

    const fullPhone = `${countryCode}${cleanedPhone}`;

    setIsSubmitting(true);

    const { error } = await signUp(signupEmail, signupPassword, fullName, dateOfBirth, fullPhone);

    if (error) {
      const msg = (error.message ?? '').toLowerCase();
      const isDuplicateEmail =
        msg.includes('already registered') ||
        msg.includes('user already registered') ||
        msg.includes('users_email_key') ||
        msg.includes('duplicate key') ||
        msg.includes('email already') ||
        msg.includes('database error saving new user');

      toast({
        title: isDuplicateEmail ? 'Email already registered' : 'Signup failed',
        description: isDuplicateEmail
          ? 'This email already has an account. Please log in or reset your password.'
          : error.message,
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
    setCountryCode('+91');
    setPhoneNumber('');
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
                        placeholder="Enter email address"
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
                      <PasswordInput
                        id="login-password"
                        placeholder="Enter password"
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
                        placeholder="Enter name"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        onBlur={() => handleBlur('fullName')}
                        className={cn(fieldErrors.fullName && 'border-destructive')}
                        required
                      />
                      <FieldError error={fieldErrors.fullName} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signup-email">Email</Label>
                      <Input
                        id="signup-email"
                        type="email"
                        placeholder="Enter email address"
                        value={signupEmail}
                        onChange={(e) => setSignupEmail(e.target.value)}
                        onBlur={() => handleBlur('signupEmail')}
                        className={cn(fieldErrors.signupEmail && 'border-destructive')}
                        required
                      />
                      <FieldError error={fieldErrors.signupEmail} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone Number</Label>
                      <div className="flex gap-2">
                        <CountryCodeSelect 
                          value={countryCode} 
                          onChange={setCountryCode} 
                        />
                        <Input
                          id="phone"
                          type="tel"
                          placeholder="Enter phone number"
                          value={phoneNumber}
                          onChange={(e) => setPhoneNumber(e.target.value)}
                          onBlur={() => handleBlur('phone')}
                          className={cn('flex-1', fieldErrors.phone && 'border-destructive')}
                          required
                        />
                      </div>
                      {fieldErrors.phone ? (
                        <FieldError error={fieldErrors.phone} />
                      ) : (
                        <p className="text-xs text-muted-foreground">
                          Required for prize payments
                        </p>
                      )}
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
                            disabled={(date) => date > maxDate || date < minDate}
                            defaultMonth={maxDate}
                            initialFocus
                            captionLayout="dropdown-buttons"
                            fromYear={1900}
                            toYear={maxDate.getFullYear()}
                            className="pointer-events-auto"
                          />
                        </PopoverContent>
                      </Popover>
                      <p className="text-xs text-muted-foreground">
                        You must be at least 18 years old to participate
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signup-password">Password</Label>
                      <PasswordInput
                        id="signup-password"
                        placeholder="Enter password"
                        value={signupPassword}
                        onChange={(e) => setSignupPassword(e.target.value)}
                        onBlur={() => handleBlur('signupPassword')}
                        required
                        minLength={8}
                      />
                      <PasswordStrengthIndicator password={signupPassword} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signup-confirm-password">Confirm Password</Label>
                      <PasswordInput
                        id="signup-confirm-password"
                        placeholder="Re-enter password"
                        value={signupConfirmPassword}
                        onChange={(e) => setSignupConfirmPassword(e.target.value)}
                        onBlur={() => handleBlur('signupConfirmPassword')}
                        className={cn(fieldErrors.signupConfirmPassword && 'border-destructive')}
                        required
                        minLength={8}
                      />
                      <FieldError error={fieldErrors.signupConfirmPassword} />
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
