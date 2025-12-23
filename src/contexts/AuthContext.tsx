import React, { createContext, useContext, useEffect, useState } from 'react';
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
  signUp: (email: string, password: string, fullName: string, dateOfBirth: Date) => Promise<{ error: Error | null }>;
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
    const { data, error } = await supabase
      .from('profiles')
      .select('id, email, full_name, avatar_url, bio, date_of_birth, is_adult, phone, kyc_verified')
      .eq('id', userId)
      .maybeSingle();

    if (error) {
      console.error('Error fetching profile:', error);
      return null;
    }
    return data as Profile | null;
  };

  const fetchPaymentDetails = async (userId: string) => {
    const { data, error } = await supabase
      .from('payment_details')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) {
      console.error('Error fetching payment details:', error);
      return null;
    }
    return data as PaymentDetails | null;
  };

  const fetchRoles = async (userId: string) => {
    const { data, error } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId);

    if (error) {
      console.error('Error fetching roles:', error);
      return [];
    }
    return data.map((r) => r.role as AppRole);
  };

  const refreshProfile = async () => {
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
  };

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        Promise.all([
          fetchProfile(session.user.id),
          fetchPaymentDetails(session.user.id),
          fetchRoles(session.user.id),
        ]).then(([profileData, paymentData, rolesData]) => {
          setProfile(profileData);
          setPaymentDetails(paymentData);
          setRoles(rolesData);
          setIsLoading(false);
        });
      } else {
        setIsLoading(false);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          const [profileData, paymentData, rolesData] = await Promise.all([
            fetchProfile(session.user.id),
            fetchPaymentDetails(session.user.id),
            fetchRoles(session.user.id),
          ]);
          setProfile(profileData);
          setPaymentDetails(paymentData);
          setRoles(rolesData);
        } else {
          setProfile(null);
          setPaymentDetails(null);
          setRoles([]);
        }
        setIsLoading(false);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signUp = async (
    email: string,
    password: string,
    fullName: string,
    dateOfBirth: Date
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
        },
      },
    });

    if (error) return { error };

    // Update profile with additional data
    const { data: { user: newUser } } = await supabase.auth.getUser();
    if (newUser) {
      await supabase.from('profiles').update({
        full_name: fullName,
        date_of_birth: dateOfBirth.toISOString().split('T')[0],
        is_adult: isAdult,
      }).eq('id', newUser.id);
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
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setProfile(null);
    setPaymentDetails(null);
    setRoles([]);
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
