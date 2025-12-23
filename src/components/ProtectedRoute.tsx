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
      if (!user) {
        setVerifiedRole('unauthorized');
        return;
      }

      // If no special role required, authorize immediately
      if (!requireAdmin && !requireModerator) {
        setVerifiedRole('authorized');
        return;
      }

      // Verify role directly from database, not from client state
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

      if (requireAdmin && !hasAdminRole) {
        setVerifiedRole('unauthorized');
        return;
      }

      if (requireModerator && !hasModeratorRole && !hasAdminRole) {
        setVerifiedRole('unauthorized');
        return;
      }

      setVerifiedRole('authorized');
    };

    if (!isLoading) {
      verifyRole();
    }
  }, [user, isLoading, requireAdmin, requireModerator]);

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
