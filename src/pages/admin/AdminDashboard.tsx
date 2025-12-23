import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Trophy, 
  Image as ImageIcon, 
  Users, 
  CreditCard, 
  TrendingUp,
  Clock,
  AlertCircle,
  Plus
} from 'lucide-react';

interface DashboardStats {
  totalContests: number;
  activeContests: number;
  totalSubmissions: number;
  pendingSubmissions: number;
  totalUsers: number;
  pendingPayouts: number;
}

const AdminDashboard = () => {
  const [stats, setStats] = useState<DashboardStats>({
    totalContests: 0,
    activeContests: 0,
    totalSubmissions: 0,
    pendingSubmissions: 0,
    totalUsers: 0,
    pendingPayouts: 0,
  });
  const [recentSubmissions, setRecentSubmissions] = useState<any[]>([]);

  useEffect(() => {
    const fetchStats = async () => {
      // Fetch contests
      const { data: contests } = await supabase.from('contests').select('status');
      if (contests) {
        setStats((prev) => ({
          ...prev,
          totalContests: contests.length,
          activeContests: contests.filter((c) => c.status === 'active').length,
        }));
      }

      // Fetch submissions
      const { data: submissions } = await supabase.from('submissions').select('status');
      if (submissions) {
        setStats((prev) => ({
          ...prev,
          totalSubmissions: submissions.length,
          pendingSubmissions: submissions.filter((s) => s.status === 'pending').length,
        }));
      }

      // Fetch pending payouts
      const { data: payouts } = await supabase
        .from('wallet_transactions')
        .select('id')
        .eq('status', 'pending');
      if (payouts) {
        setStats((prev) => ({ ...prev, pendingPayouts: payouts.length }));
      }

      // Fetch recent submissions for review
      const { data: recent } = await supabase
        .from('submissions')
        .select(`
          id,
          title,
          image_url,
          status,
          risk_score,
          created_at,
          contest:contests(title),
          profile:profiles(full_name)
        `)
        .eq('status', 'pending')
        .order('risk_score', { ascending: false })
        .limit(5);

      if (recent) {
        setRecentSubmissions(recent);
      }
    };

    fetchStats();
  }, []);

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-display font-bold">Admin Dashboard</h1>
          <p className="text-muted-foreground">Overview of platform activity</p>
        </div>
        <Button asChild className="gradient-primary">
          <Link to="/admin/contests/new">
            <Plus className="h-4 w-4 mr-2" />
            Create Contest
          </Link>
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
        <Card className="glass-card">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Trophy className="h-8 w-8 text-accent" />
              <div>
                <p className="text-2xl font-bold">{stats.totalContests}</p>
                <p className="text-xs text-muted-foreground">Total Contests</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <TrendingUp className="h-8 w-8 text-success" />
              <div>
                <p className="text-2xl font-bold">{stats.activeContests}</p>
                <p className="text-xs text-muted-foreground">Active</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <ImageIcon className="h-8 w-8 text-primary" />
              <div>
                <p className="text-2xl font-bold">{stats.totalSubmissions}</p>
                <p className="text-xs text-muted-foreground">Submissions</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card border-amber-500/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Clock className="h-8 w-8 text-amber-500" />
              <div>
                <p className="text-2xl font-bold">{stats.pendingSubmissions}</p>
                <p className="text-xs text-muted-foreground">Pending Review</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Users className="h-8 w-8 text-blue-400" />
              <div>
                <p className="text-2xl font-bold">{stats.totalUsers}</p>
                <p className="text-xs text-muted-foreground">Users</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card border-destructive/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <CreditCard className="h-8 w-8 text-destructive" />
              <div>
                <p className="text-2xl font-bold">{stats.pendingPayouts}</p>
                <p className="text-xs text-muted-foreground">Pending Payouts</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid md:grid-cols-2 gap-6 mb-8">
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-amber-500" />
              High Priority Reviews
            </CardTitle>
            <CardDescription>
              Submissions flagged for potential issues (sorted by risk score)
            </CardDescription>
          </CardHeader>
          <CardContent>
            {recentSubmissions.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">
                No pending submissions to review
              </p>
            ) : (
              <div className="space-y-3">
                {recentSubmissions.map((sub) => (
                  <div
                    key={sub.id}
                    className="flex items-center gap-3 p-3 rounded-lg bg-secondary/30"
                  >
                    <img
                      src={sub.image_url}
                      alt={sub.title}
                      className="w-12 h-12 rounded object-cover"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{sub.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {sub.profile?.full_name} • {sub.contest?.title}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className={`text-sm font-semibold ${
                        sub.risk_score > 0.5 ? 'text-destructive' : 
                        sub.risk_score > 0.2 ? 'text-amber-500' : 'text-success'
                      }`}>
                        {(sub.risk_score * 100).toFixed(0)}% risk
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <Button asChild variant="outline" className="w-full mt-4">
              <Link to="/admin/submissions">Review All Submissions</Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common admin tasks</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button asChild variant="outline" className="w-full justify-start">
              <Link to="/admin/contests/new">
                <Plus className="h-4 w-4 mr-2" />
                Create New Contest
              </Link>
            </Button>
            <Button asChild variant="outline" className="w-full justify-start">
              <Link to="/admin/submissions?status=pending">
                <Clock className="h-4 w-4 mr-2" />
                Review Pending Submissions
              </Link>
            </Button>
            <Button asChild variant="outline" className="w-full justify-start">
              <Link to="/admin/payments?status=pending">
                <CreditCard className="h-4 w-4 mr-2" />
                Process Pending Payouts
              </Link>
            </Button>
            <Button asChild variant="outline" className="w-full justify-start">
              <Link to="/admin/reports">
                <AlertCircle className="h-4 w-4 mr-2" />
                View Abuse Reports
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminDashboard;
