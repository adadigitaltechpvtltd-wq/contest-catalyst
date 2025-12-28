import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

type AppRole = 'admin' | 'moderator' | 'user';

interface Profile {
  id: string;
  email: string | null;
  full_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  date_of_birth: string | null;
  is_adult: boolean;
  phone: string | null;
  kyc_verified: boolean;
  username: string | null;
  is_deleted: boolean | null;
  scheduled_deletion_at: string | null;
}

interface PaymentDetails {
  user_id: string;
  upi_id: string | null;
  bank_account_number: string | null;
  bank_ifsc: string | null;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  paymentDetails: PaymentDetails | null;
  roles: AppRole[];
  isLoading: boolean;
  isAdmin: boolean;
  isModerator: boolean;
  signUp: (email: string, password: string, fullName: string, dateOfBirth: Date, phone: string) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [paymentDetails, setPaymentDetails] = useState<PaymentDetails | null>(null);
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchProfile = async (userId: string) => {
    try {
      // Add timeout - increased to 3 seconds
      const timeoutId = setTimeout(() => {
        console.warn('Profile fetch timeout');
      }, 3000);

      const { data, error } = await supabase
        .from('profiles')
        .select('id, email, full_name, avatar_url, bio, date_of_birth, is_adult, phone, kyc_verified, username, is_deleted, scheduled_deletion_at')
        .eq('id', userId)
        .maybeSingle();

      clearTimeout(timeoutId);

      if (error) {
        console.error('Error fetching profile:', error);
        return null;
      }
      return data as Profile | null;
    } catch (err) {
      console.error('Error in fetchProfile:', err);
      return null;
    }
  };

  const fetchPaymentDetails = async (userId: string) => {
    try {
      // Add timeout - increased to 3 seconds
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);

      const { data, error } = await supabase
        .from('payment_details')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      clearTimeout(timeoutId);

      if (error) {
        console.error('Error fetching payment details:', error);
        return null;
      }
      return data as PaymentDetails | null;
    } catch (err) {
      console.error('Error in fetchPaymentDetails:', err);
      return null;
    }
  };

  const fetchRoles = async (userId: string) => {
    try {
      // Add timeout - increased to 3 seconds
      const timeoutId = setTimeout(() => {
        console.warn('Roles fetch timeout');
      }, 3000);

      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId);

      clearTimeout(timeoutId);

      if (error) {
        console.error('Error fetching roles:', error);
        return [];
      }
      return data.map((r) => r.role as AppRole);
    } catch (err) {
      console.error('Error in fetchRoles:', err);
      return [];
    }
  };

  const refreshProfile = useCallback(async () => {
    if (user) {
      const [profileData, paymentData, rolesData] = await Promise.all([
        fetchProfile(user.id),
        fetchPaymentDetails(user.id),
        fetchRoles(user.id),
      ]);
      setProfile(profileData);
      setPaymentDetails(paymentData);
      setRoles(rolesData);
    }
  }, [user]);


  useEffect(() => {
    const init = async () => {
      try {
        // Get initial session
        const {
          data: { session },
        } = await supabase.auth.getSession();

        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          // Set timeout for profile fetch
          const profilePromise = Promise.race([
            fetchProfile(session.user.id),
            new Promise((_, reject) => setTimeout(() => reject(new Error('Profile fetch timeout')), 3000))
          ]);

          const paymentPromise = Promise.race([
            fetchPaymentDetails(session.user.id),
            new Promise((_, reject) => setTimeout(() => reject(new Error('Payment details timeout')), 3000))
          ]);

          const rolesPromise = Promise.race([
            fetchRoles(session.user.id),
            new Promise((_, reject) => setTimeout(() => reject(new Error('Roles fetch timeout')), 3000))
          ]);

          const [profileRes, paymentRes, rolesRes] = await Promise.allSettled([
            profilePromise,
            paymentPromise,
            rolesPromise,
          ]);

          const profileData = profileRes.status === 'fulfilled' ? profileRes.value : null;
          
          // Check if account is deleted - sign them out
          if (profileData?.is_deleted) {
            console.log('Account is deleted, signing out');
            await supabase.auth.signOut();
            setSession(null);
            setUser(null);
            setProfile(null);
            setPaymentDetails(null);
            setRoles([]);
            return;
          }

          setProfile(profileData);
          setPaymentDetails(paymentRes.status === 'fulfilled' ? paymentRes.value : null);
          setRoles(rolesRes.status === 'fulfilled' ? rolesRes.value : []);
        } else {
          setProfile(null);
          setPaymentDetails(null);
          setRoles([]);
        }
      } catch (err) {
        console.error('Auth init failed:', err);
        setSession(null);
        setUser(null);
        setProfile(null);
        setPaymentDetails(null);
        setRoles([]);
      } finally {
        setIsLoading(false);
      }
    };

    init();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      try {
        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          // Add timeouts for each fetch
          const profilePromise = Promise.race([
            fetchProfile(session.user.id),
            new Promise((_, reject) => setTimeout(() => reject(new Error('Profile fetch timeout')), 3000))
          ]);

          const paymentPromise = Promise.race([
            fetchPaymentDetails(session.user.id),
            new Promise((_, reject) => setTimeout(() => reject(new Error('Payment details timeout')), 3000))
          ]);

          const rolesPromise = Promise.race([
            fetchRoles(session.user.id),
            new Promise((_, reject) => setTimeout(() => reject(new Error('Roles fetch timeout')), 3000))
          ]);

          const [profileData, paymentData, rolesData] = await Promise.allSettled([
            profilePromise,
            paymentPromise,
            rolesPromise,
          ]).then(results => [
            results[0].status === 'fulfilled' ? results[0].value : null,
            results[1].status === 'fulfilled' ? results[1].value : null,
            results[2].status === 'fulfilled' ? results[2].value : [],
          ]);
          
          // Check if account is deleted - sign them out
          if (profileData?.is_deleted) {
            console.log('Account is deleted, signing out');
            await supabase.auth.signOut();
            setSession(null);
            setUser(null);
            setProfile(null);
            setPaymentDetails(null);
            setRoles([]);
            return;
          }
          
          setProfile(profileData);
          setPaymentDetails(paymentData);
          setRoles(rolesData);
        } else {
          setProfile(null);
          setPaymentDetails(null);
          setRoles([]);
        }
      } catch (err) {
        console.error('Auth state change handler failed:', err);
      } finally {
        setIsLoading(false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signUp = async (
    email: string,
    password: string,
    fullName: string,
    dateOfBirth: Date,
    phone: string
  ): Promise<{ error: Error | null }> => {
    const isAdult = new Date().getFullYear() - dateOfBirth.getFullYear() >= 18;

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          date_of_birth: dateOfBirth.toISOString().split('T')[0],
          is_adult: isAdult,
          phone,
        },
      },
    });

    if (error) {
      const msg = (error.message ?? '').toLowerCase();
      const isDuplicateEmail =
        msg.includes('already registered') ||
        msg.includes('user already registered') ||
        msg.includes('users_email_key') ||
        msg.includes('duplicate key') ||
        msg.includes('email already') ||
        msg.includes('database error saving new user');

      if (isDuplicateEmail) {
        return {
          error: new Error(
            'This email is already registered. Please log in or reset your password.'
          ),
        };
      }

      return { error };
    }

    // Update profile with additional data
    const {
      data: { user: newUser },
    } = await supabase.auth.getUser();
    if (newUser) {
      await supabase
        .from('profiles')
        .update({
          full_name: fullName,
          date_of_birth: dateOfBirth.toISOString().split('T')[0],
          is_adult: isAdult,
          phone,
        })
        .eq('id', newUser.id);
    }

    return { error: null };
  };

  const signIn = async (
    email: string,
    password: string
  ): Promise<{ error: Error | null }> => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error: error as Error | null };
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.error('Sign out failed (clearing local session anyway):', err);
    } finally {
      setUser(null);
      setSession(null);
      setProfile(null);
      setPaymentDetails(null);
      setRoles([]);
    }
  };

  const isAdmin = roles.includes('admin');
  const isModerator = roles.includes('moderator');

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        paymentDetails,
        roles,
        isLoading,
        isAdmin,
        isModerator,
        signUp,
        signIn,
        signOut,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
