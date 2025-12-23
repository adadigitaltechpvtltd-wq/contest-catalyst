import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Plus, 
  Trophy, 
  Users, 
  Clock, 
  Edit, 
  Eye,
  Loader2
} from 'lucide-react';

type ContestStatus = 'draft' | 'active' | 'voting' | 'completed' | 'cancelled';

interface Contest {
  id: string;
  title: string;
  theme: string | null;
  prize_amount: number;
  min_participants: number;
  start_date: string;
  end_date: string;
  status: ContestStatus;
  created_at: string;
  submission_count: number;
}

const AdminContests = () => {
  const [contests, setContests] = useState<Contest[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchContests = async () => {
      const { data, error } = await supabase
        .from('contests')
        .select(`
          id,
          title,
          theme,
          prize_amount,
          min_participants,
          start_date,
          end_date,
          status,
          created_at
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching contests:', error);
      } else {
        // Fetch submission counts
        const contestsWithCounts = await Promise.all(
          (data || []).map(async (contest) => {
            const { count } = await supabase
              .from('submissions')
              .select('*', { count: 'exact', head: true })
              .eq('contest_id', contest.id);
            return { ...contest, submission_count: count || 0 };
          })
        );
        setContests(contestsWithCounts);
      }
      setIsLoading(false);
    };

    fetchContests();
  }, []);

  const getStatusBadge = (status: ContestStatus) => {
    const variants: Record<ContestStatus, { class: string; label: string }> = {
      draft: { class: 'bg-secondary', label: 'Draft' },
      active: { class: 'bg-success', label: 'Active' },
      voting: { class: 'bg-accent', label: 'Voting' },
      completed: { class: 'bg-blue-500', label: 'Completed' },
      cancelled: { class: 'bg-destructive', label: 'Cancelled' },
    };
    const v = variants[status];
    return <Badge className={v.class}>{v.label}</Badge>;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-display font-bold">Contests</h1>
          <p className="text-muted-foreground">Manage photography contests</p>
        </div>
        <Button asChild className="gradient-primary">
          <Link to="/admin/contests/new">
            <Plus className="h-4 w-4 mr-2" />
            Create Contest
          </Link>
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : contests.length === 0 ? (
        <Card className="glass-card">
          <CardContent className="p-12 text-center">
            <Trophy className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">No Contests Yet</h3>
            <p className="text-muted-foreground mb-6">
              Create your first photography contest to get started.
            </p>
            <Button asChild>
              <Link to="/admin/contests/new">Create Contest</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {contests.map((contest) => (
            <Card key={contest.id} className="glass-card">
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold">{contest.title}</h3>
                      {getStatusBadge(contest.status)}
                    </div>
                    {contest.theme && (
                      <p className="text-sm text-muted-foreground mb-2">
                        Theme: {contest.theme}
                      </p>
                    )}
                    <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Trophy className="h-4 w-4" />
                        ₹{contest.prize_amount}
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="h-4 w-4" />
                        {contest.submission_count} / {contest.min_participants} min
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        {formatDate(contest.start_date)} - {formatDate(contest.end_date)}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" asChild>
                      <Link to={`/contest/${contest.id}`}>
                        <Eye className="h-4 w-4 mr-1" />
                        View
                      </Link>
                    </Button>
                    <Button variant="outline" size="sm" asChild>
                      <Link to={`/admin/contests/${contest.id}/edit`}>
                        <Edit className="h-4 w-4 mr-1" />
                        Edit
                      </Link>
                    </Button>
                    <Button size="sm" asChild>
                      <Link to={`/admin/contests/${contest.id}/submissions`}>
                        Review ({contest.submission_count})
                      </Link>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminContests;
