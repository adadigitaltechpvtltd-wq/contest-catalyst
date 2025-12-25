import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { Users, Image, Trophy, TrendingUp, Calendar } from "lucide-react";
import { format, subDays, startOfDay, eachDayOfInterval } from "date-fns";

const COLORS = ["hsl(var(--primary))", "hsl(var(--accent))", "#22c55e", "#f59e0b", "#ef4444"];

const AdminAnalytics = () => {
  // Fetch all data for analytics
  const { data: profiles } = useQuery({
    queryKey: ["analytics-profiles"],
    queryFn: async () => {
      const { data, error } = await supabase.from("profiles").select("id, created_at");
      if (error) throw error;
      return data;
    },
  });

  const { data: submissions } = useQuery({
    queryKey: ["analytics-submissions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("submissions")
        .select("id, created_at, status, contest_id");
      if (error) throw error;
      return data;
    },
  });

  const { data: contests } = useQuery({
    queryKey: ["analytics-contests"],
    queryFn: async () => {
      const { data, error } = await supabase.from("contests").select("id, status, created_at, prize_amount");
      if (error) throw error;
      return data;
    },
  });

  // Generate last 30 days for charts
  const last30Days = eachDayOfInterval({
    start: subDays(new Date(), 29),
    end: new Date(),
  });

  // User growth over time
  const userGrowthData = last30Days.map((day) => {
    const dayStart = startOfDay(day);
    const count = profiles?.filter((p) => new Date(p.created_at) <= dayStart).length || 0;
    return {
      date: format(day, "MMM d"),
      users: count,
    };
  });

  // Submissions over time
  const submissionsData = last30Days.map((day) => {
    const dayStr = format(day, "yyyy-MM-dd");
    const count =
      submissions?.filter((s) => format(new Date(s.created_at), "yyyy-MM-dd") === dayStr).length ||
      0;
    return {
      date: format(day, "MMM d"),
      submissions: count,
    };
  });

  // Submission status distribution
  const statusDistribution = [
    { name: "Pending", value: submissions?.filter((s) => s.status === "pending").length || 0 },
    { name: "Approved", value: submissions?.filter((s) => s.status === "approved").length || 0 },
    { name: "Rejected", value: submissions?.filter((s) => s.status === "rejected").length || 0 },
    { name: "Winner", value: submissions?.filter((s) => s.status === "winner").length || 0 },
  ].filter((s) => s.value > 0);

  // Contest status distribution
  const contestStatusData = [
    { name: "Draft", value: contests?.filter((c) => c.status === "draft").length || 0 },
    { name: "Active", value: contests?.filter((c) => c.status === "active").length || 0 },
    { name: "Voting", value: contests?.filter((c) => c.status === "voting").length || 0 },
    { name: "Completed", value: contests?.filter((c) => c.status === "completed").length || 0 },
  ].filter((s) => s.value > 0);

  // Contest participation (submissions per contest)
  const contestParticipation = contests
    ?.map((contest) => ({
      id: contest.id.slice(0, 8),
      submissions: submissions?.filter((s) => s.contest_id === contest.id).length || 0,
      prize: contest.prize_amount,
    }))
    .slice(0, 10);

  // Summary stats
  const totalUsers = profiles?.length || 0;
  const totalSubmissions = submissions?.length || 0;
  const totalContests = contests?.length || 0;
  const totalPrizes = contests?.reduce((acc, c) => acc + (c.prize_amount || 0), 0) || 0;

  const newUsersThisWeek =
    profiles?.filter((p) => new Date(p.created_at) >= subDays(new Date(), 7)).length || 0;
  const submissionsThisWeek =
    submissions?.filter((s) => new Date(s.created_at) >= subDays(new Date(), 7)).length || 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-display font-bold text-foreground">Analytics Dashboard</h1>
        <p className="text-muted-foreground mt-1">Platform performance and insights</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalUsers.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">+{newUsersThisWeek} this week</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Submissions</CardTitle>
            <Image className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalSubmissions.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">+{submissionsThisWeek} this week</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Contests</CardTitle>
            <Trophy className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalContests}</div>
            <p className="text-xs text-muted-foreground">
              {contests?.filter((c) => c.status === "active").length || 0} active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Prize Pool</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalPrizes.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Across all contests</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* User Growth */}
        <Card>
          <CardHeader>
            <CardTitle>User Growth</CardTitle>
            <CardDescription>Total registered users over time</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={userGrowthData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} className="text-muted-foreground" />
                  <YAxis tick={{ fontSize: 12 }} className="text-muted-foreground" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="users"
                    stroke="hsl(var(--primary))"
                    fill="hsl(var(--primary) / 0.2)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Submissions Over Time */}
        <Card>
          <CardHeader>
            <CardTitle>Daily Submissions</CardTitle>
            <CardDescription>New submissions per day</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={submissionsData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} className="text-muted-foreground" />
                  <YAxis tick={{ fontSize: 12 }} className="text-muted-foreground" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                  />
                  <Bar dataKey="submissions" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Submission Status */}
        <Card>
          <CardHeader>
            <CardTitle>Submission Status</CardTitle>
            <CardDescription>Distribution by review status</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {statusDistribution.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Contest Status */}
        <Card>
          <CardHeader>
            <CardTitle>Contest Status</CardTitle>
            <CardDescription>Distribution by contest phase</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={contestStatusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {contestStatusData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Contest Participation */}
        <Card>
          <CardHeader>
            <CardTitle>Contest Participation</CardTitle>
            <CardDescription>Submissions per contest</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={contestParticipation} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis type="number" tick={{ fontSize: 12 }} />
                  <YAxis dataKey="id" type="category" tick={{ fontSize: 10 }} width={60} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                  />
                  <Bar dataKey="submissions" fill="hsl(var(--accent))" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminAnalytics;
