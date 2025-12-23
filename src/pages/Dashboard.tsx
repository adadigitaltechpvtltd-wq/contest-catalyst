import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useRealtimeNotifications } from '@/hooks/useRealtimeNotifications';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import EmailVerificationBanner from '@/components/EmailVerificationBanner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Camera, 
  Trophy, 
  Image as ImageIcon, 
  Wallet, 
  Bell, 
  Clock,
  ArrowRight,
  TrendingUp
} from 'lucide-react';

interface DashboardStats {
  totalSubmissions: number;
  approvedSubmissions: number;
  pendingSubmissions: number;
  winCount: number;
  walletBalance: number;
}

interface ActiveContest {
  id: string;
  title: string;
  prize_amount: number;
  end_date: string;
  hasSubmitted: boolean;
}

const Dashboard = () => {
  const { user, profile, isAdmin } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    totalSubmissions: 0,
    approvedSubmissions: 0,
    pendingSubmissions: 0,
    winCount: 0,
    walletBalance: 0,
  });
  const [activeContests, setActiveContests] = useState<ActiveContest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { unreadCount: notifications } = useRealtimeNotifications();

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!user) return;

      // Fetch submissions stats
      const { data: submissions } = await supabase
        .from('submissions')
        .select('status')
        .eq('user_id', user.id);

      if (submissions) {
        setStats((prev) => ({
          ...prev,
          totalSubmissions: submissions.length,
          approvedSubmissions: submissions.filter((s) => s.status === 'approved' || s.status === 'winner').length,
          pendingSubmissions: submissions.filter((s) => s.status === 'pending').length,
          winCount: submissions.filter((s) => s.status === 'winner').length,
        }));
      }

      // Fetch wallet balance
      const { data: balance } = await supabase.rpc('get_wallet_balance', {
        _user_id: user.id,
      });

      if (balance !== null) {
        setStats((prev) => ({ ...prev, walletBalance: balance }));
      }

      // Fetch active contests
      const { data: contests } = await supabase
        .from('contests')
        .select('id, title, prize_amount, end_date')
        .eq('status', 'active')
        .order('end_date', { ascending: true })
        .limit(5);

      if (contests) {
        // Check which contests user has already submitted to
        const { data: userSubmissions } = await supabase
          .from('submissions')
          .select('contest_id')
          .eq('user_id', user.id);

        const submittedContestIds = new Set(userSubmissions?.map((s) => s.contest_id) || []);

        setActiveContests(
          contests.map((c) => ({
            ...c,
            hasSubmitted: submittedContestIds.has(c.id),
          }))
        );
      }

      setIsLoading(false);
    };

    fetchDashboardData();
  }, [user]);

  const formatTimeLeft = (endDate: string) => {
    const end = new Date(endDate);
    const now = new Date();
    const diff = end.getTime() - now.getTime();

    if (diff <= 0) return 'Ended';

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

    if (days > 0) return `${days}d ${hours}h left`;
    return `${hours}h left`;
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-8 pt-24">
        {/* Email Verification Status */}
        <div className="mb-6">
          <EmailVerificationBanner />
        </div>

        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-display font-bold">
              Welcome back, {profile?.full_name || 'Photographer'}!
            </h1>
            <p className="text-muted-foreground mt-1">
              Here's what's happening with your contests
            </p>
          </div>
          <div className="flex gap-3">
            {isAdmin && (
              <Button asChild variant="outline">
                <Link to="/admin">Admin Panel</Link>
              </Button>
            )}
            <Button asChild className="gradient-primary">
              <Link to="/contests">
                <Camera className="h-4 w-4 mr-2" />
                Enter Contest
              </Link>
            </Button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card className="glass-card">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-full bg-primary/10">
                  <ImageIcon className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.totalSubmissions}</p>
                  <p className="text-sm text-muted-foreground">Total Submissions</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-full bg-success/10">
                  <TrendingUp className="h-6 w-6 text-success" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.approvedSubmissions}</p>
                  <p className="text-sm text-muted-foreground">Approved</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-full bg-accent/10">
                  <Trophy className="h-6 w-6 text-accent" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.winCount}</p>
                  <p className="text-sm text-muted-foreground">Wins</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-full bg-warm-pink/10">
                  <Wallet className="h-6 w-6 text-warm-pink" />
                </div>
                <div>
                  <p className="text-2xl font-bold">₹{stats.walletBalance}</p>
                  <p className="text-sm text-muted-foreground">Wallet Balance</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Active Contests */}
          <div className="lg:col-span-2">
            <Card className="glass-card h-full">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Camera className="h-5 w-5" />
                  Active Contests
                </CardTitle>
                <CardDescription>
                  Participate in these ongoing contests
                </CardDescription>
              </CardHeader>
              <CardContent>
                {activeContests.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">
                    No active contests at the moment. Check back soon!
                  </p>
                ) : (
                  <div className="space-y-4">
                    {activeContests.map((contest) => (
                      <div
                        key={contest.id}
                        className="flex items-center justify-between p-4 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors"
                      >
                        <div className="flex-1">
                          <h3 className="font-semibold">{contest.title}</h3>
                          <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Trophy className="h-4 w-4" />
                              ₹{contest.prize_amount}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="h-4 w-4" />
                              {formatTimeLeft(contest.end_date)}
                            </span>
                          </div>
                        </div>
                        {contest.hasSubmitted ? (
                          <Badge variant="secondary">Submitted</Badge>
                        ) : (
                          <Button asChild size="sm">
                            <Link to={`/submit/${contest.id}`}>
                              Enter
                              <ArrowRight className="h-4 w-4 ml-1" />
                            </Link>
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
                <Button asChild variant="outline" className="w-full mt-4">
                  <Link to="/contests">View All Contests</Link>
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions & Notifications */}
          <div className="space-y-6">
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5" />
                  Notifications
                  {notifications > 0 && (
                    <Badge variant="destructive" className="ml-auto">
                      {notifications}
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Button asChild variant="outline" className="w-full">
                  <Link to="/notifications">
                    View All Notifications
                  </Link>
                </Button>
              </CardContent>
            </Card>

            <Card className="glass-card">
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button asChild variant="outline" className="w-full justify-start">
                  <Link to="/submissions">
                    <ImageIcon className="h-4 w-4 mr-2" />
                    My Submissions
                  </Link>
                </Button>
                <Button asChild variant="outline" className="w-full justify-start">
                  <Link to="/wallet">
                    <Wallet className="h-4 w-4 mr-2" />
                    Wallet & Rewards
                  </Link>
                </Button>
                <Button asChild variant="outline" className="w-full justify-start">
                  <Link to="/profile">
                    <Camera className="h-4 w-4 mr-2" />
                    Edit Profile
                  </Link>
                </Button>
                <Button asChild variant="outline" className="w-full justify-start">
                  <Link to="/leaderboard">
                    <Trophy className="h-4 w-4 mr-2" />
                    Leaderboard
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Dashboard;
