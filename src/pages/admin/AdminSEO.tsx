import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  Search, 
  CheckCircle2, 
  XCircle, 
  FileText, 
  Image as ImageIcon,
  Globe,
  AlertTriangle,
  ExternalLink
} from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface SEOStats {
  totalContests: number;
  contestsWithSEO: number;
  totalPhotos: number;
  indexablePhotos: number;
  noindexPhotos: number;
}

interface ContestSEOStatus {
  id: string;
  title: string;
  slug: string | null;
  status: string;
  hasSeoTitle: boolean;
  hasMetaDescription: boolean;
  hasKeywords: boolean;
  photoCount: number;
  indexablePhotoCount: number;
}

const AdminSEO = () => {
  const [stats, setStats] = useState<SEOStats>({
    totalContests: 0,
    contestsWithSEO: 0,
    totalPhotos: 0,
    indexablePhotos: 0,
    noindexPhotos: 0,
  });
  const [contests, setContests] = useState<ContestSEOStatus[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSEOData = async () => {
      setLoading(true);

      // Fetch contests with SEO field status
      const { data: contestsData } = await supabase
        .from('contests')
        .select('id, title, slug, status, seo_title, meta_description, keywords')
        .in('status', ['active', 'voting', 'completed']);

      // Fetch all submissions with status
      const { data: submissionsData } = await supabase
        .from('submissions')
        .select('id, status, contest_id');

      if (contestsData && submissionsData) {
        // Calculate contest SEO status
        const contestsWithStatus: ContestSEOStatus[] = contestsData.map(contest => {
          const contestSubmissions = submissionsData.filter(s => s.contest_id === contest.id);
          const indexable = contestSubmissions.filter(s => 
            s.status === 'approved' || s.status === 'winner'
          );

          return {
            id: contest.id,
            title: contest.title,
            slug: contest.slug,
            status: contest.status,
            hasSeoTitle: !!contest.seo_title && contest.seo_title.trim() !== '',
            hasMetaDescription: !!contest.meta_description && contest.meta_description.trim() !== '',
            hasKeywords: !!contest.keywords && contest.keywords.length > 0,
            photoCount: contestSubmissions.length,
            indexablePhotoCount: indexable.length,
          };
        });

        // Calculate overall stats
        const contestsWithFullSEO = contestsWithStatus.filter(
          c => c.hasSeoTitle && c.hasMetaDescription
        ).length;

        const totalPhotos = submissionsData.length;
        const indexablePhotos = submissionsData.filter(
          s => s.status === 'approved' || s.status === 'winner'
        ).length;

        setStats({
          totalContests: contestsData.length,
          contestsWithSEO: contestsWithFullSEO,
          totalPhotos,
          indexablePhotos,
          noindexPhotos: totalPhotos - indexablePhotos,
        });

        setContests(contestsWithStatus);
      }

      setLoading(false);
    };

    fetchSEOData();
  }, []);

  const seoCompletionPercent = stats.totalContests > 0 
    ? Math.round((stats.contestsWithSEO / stats.totalContests) * 100) 
    : 0;

  const indexablePercent = stats.totalPhotos > 0 
    ? Math.round((stats.indexablePhotos / stats.totalPhotos) * 100) 
    : 0;

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-display font-bold">SEO Health Dashboard</h1>
          <p className="text-muted-foreground">Monitor search engine optimization across contests and photos</p>
        </div>
        <Button asChild variant="outline">
          <a 
            href={`https://xoompskrczzucsohfcyy.supabase.co/functions/v1/sitemap`} 
            target="_blank" 
            rel="noopener noreferrer"
          >
            <Globe className="h-4 w-4 mr-2" />
            View Sitemap
            <ExternalLink className="h-3 w-3 ml-2" />
          </a>
        </Button>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card className="glass-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <Search className="h-8 w-8 text-primary" />
              <Badge variant={seoCompletionPercent >= 80 ? 'default' : 'destructive'}>
                {seoCompletionPercent}%
              </Badge>
            </div>
            <p className="text-2xl font-bold">{stats.contestsWithSEO} / {stats.totalContests}</p>
            <p className="text-sm text-muted-foreground">Contests with SEO</p>
            <Progress value={seoCompletionPercent} className="mt-2" />
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <CheckCircle2 className="h-8 w-8 text-success" />
              <Badge variant="secondary">{indexablePercent}%</Badge>
            </div>
            <p className="text-2xl font-bold">{stats.indexablePhotos}</p>
            <p className="text-sm text-muted-foreground">Indexable Photos</p>
            <Progress value={indexablePercent} className="mt-2" />
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <XCircle className="h-8 w-8 text-amber-500" />
            </div>
            <p className="text-2xl font-bold">{stats.noindexPhotos}</p>
            <p className="text-sm text-muted-foreground">Noindex Photos</p>
            <p className="text-xs text-muted-foreground mt-2">Pending or rejected submissions</p>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <FileText className="h-8 w-8 text-blue-400" />
            </div>
            <p className="text-2xl font-bold">{stats.totalContests + stats.indexablePhotos}</p>
            <p className="text-sm text-muted-foreground">Sitemap URLs</p>
            <p className="text-xs text-muted-foreground mt-2">Contests + approved photos</p>
          </CardContent>
        </Card>
      </div>

      {/* Contest SEO Status Table */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ImageIcon className="h-5 w-5" />
            Contest SEO Status
          </CardTitle>
          <CardDescription>
            SEO field completion status for each contest
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Loading...</div>
          ) : contests.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No active contests found
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Contest</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-center">SEO Title</TableHead>
                  <TableHead className="text-center">Meta Desc</TableHead>
                  <TableHead className="text-center">Keywords</TableHead>
                  <TableHead className="text-center">Photos</TableHead>
                  <TableHead className="text-center">Indexed</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {contests.map((contest) => {
                  const isComplete = contest.hasSeoTitle && contest.hasMetaDescription;
                  return (
                    <TableRow key={contest.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {!isComplete && (
                            <AlertTriangle className="h-4 w-4 text-amber-500 flex-shrink-0" />
                          )}
                          <div>
                            <p className="font-medium">{contest.title}</p>
                            {contest.slug && (
                              <p className="text-xs text-muted-foreground">/contest/{contest.slug}</p>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={
                          contest.status === 'active' ? 'default' : 
                          contest.status === 'voting' ? 'secondary' : 
                          'outline'
                        }>
                          {contest.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        {contest.hasSeoTitle ? (
                          <CheckCircle2 className="h-5 w-5 text-success mx-auto" />
                        ) : (
                          <XCircle className="h-5 w-5 text-destructive mx-auto" />
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        {contest.hasMetaDescription ? (
                          <CheckCircle2 className="h-5 w-5 text-success mx-auto" />
                        ) : (
                          <XCircle className="h-5 w-5 text-destructive mx-auto" />
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        {contest.hasKeywords ? (
                          <CheckCircle2 className="h-5 w-5 text-success mx-auto" />
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        {contest.photoCount}
                      </TableCell>
                      <TableCell className="text-center">
                        <span className={contest.indexablePhotoCount > 0 ? 'text-success font-medium' : 'text-muted-foreground'}>
                          {contest.indexablePhotoCount}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Button asChild variant="ghost" size="sm">
                          <Link to={`/admin/contests/${contest.id}/edit`}>
                            Edit
                          </Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* SEO Tips */}
      <Card className="glass-card mt-6">
        <CardHeader>
          <CardTitle>SEO Best Practices</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>• <strong>SEO Title:</strong> 50-60 characters, include primary keyword</p>
          <p>• <strong>Meta Description:</strong> 150-160 characters, compelling call-to-action</p>
          <p>• <strong>Keywords:</strong> 3-5 relevant terms for each contest theme</p>
          <p>• <strong>Photo Indexing:</strong> Only approved photos are included in sitemap</p>
          <p>• <strong>Sitemap:</strong> Submit to Google Search Console for faster discovery</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminSEO;
