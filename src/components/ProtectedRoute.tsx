import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';
import { useState, useEffect } from 'react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
  requireModerator?: boolean;
}

const ProtectedRoute = ({
  children,
  requireAdmin = false,
  requireModerator = false,
}: ProtectedRouteProps) => {
  const { user, isLoading } = useAuth();
  const location = useLocation();
  const [verifiedRole, setVerifiedRole] = useState<'loading' | 'authorized' | 'unauthorized'>('loading');

  // Server-side role verification for admin/moderator routes
  useEffect(() => {
    const verifyRole = async () => {
      console.log('ProtectedRoute: Verifying role, user:', user?.id, 'isLoading:', isLoading);
      
      // Wait for auth to finish loading first
      if (isLoading) {
        console.log('ProtectedRoute: Still loading auth, waiting...');
        return;
      }
      
      if (!user) {
        console.log('ProtectedRoute: No user after auth loaded, setting unauthorized');
        setVerifiedRole('unauthorized');
        return;
      }

      // If no special role required, authorize immediately
      if (!requireAdmin && !requireModerator) {
        console.log('ProtectedRoute: No special role required, authorizing');
        setVerifiedRole('authorized');
        return;
      }

      // Verify role directly from database, not from client state
      try {
        const { data, error } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id);

        if (error) {
          console.error('Role verification failed:', error);
          setVerifiedRole('unauthorized');
          return;
        }

        const roles = data?.map(r => r.role) || [];
        const hasAdminRole = roles.includes('admin');
        const hasModeratorRole = roles.includes('moderator');

        console.log('ProtectedRoute: User roles:', roles);

        if (requireAdmin && !hasAdminRole) {
          setVerifiedRole('unauthorized');
          return;
        }

        if (requireModerator && !hasModeratorRole && !hasAdminRole) {
          setVerifiedRole('unauthorized');
          return;
        }

        setVerifiedRole('authorized');
      } catch (err) {
        console.error('Exception in role verification:', err);
        setVerifiedRole('unauthorized');
      }
    };

    verifyRole();
  }, [user, isLoading, requireAdmin, requireModerator]);

  // Add timeout to prevent infinite loading
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (verifiedRole === 'loading' && !isLoading) {
        console.warn('ProtectedRoute: Role verification timed out, defaulting to check user');
        if (!user) {
          setVerifiedRole('unauthorized');
        } else if (!requireAdmin && !requireModerator) {
          setVerifiedRole('authorized');
        } else {
          setVerifiedRole('unauthorized');
        }
      }
    }, 3000);

    return () => clearTimeout(timeout);
  }, [verifiedRole, isLoading, user, requireAdmin, requireModerator]);

  if (isLoading || verifiedRole === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (verifiedRole === 'unauthorized') {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
