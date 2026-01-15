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
  totalCampaigns: number;
  campaignsWithSEO: number;
  totalPhotos: number;
  indexablePhotos: number;
  noindexPhotos: number;
}

interface CampaignSEOStatus {
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
    totalCampaigns: 0,
    campaignsWithSEO: 0,
    totalPhotos: 0,
    indexablePhotos: 0,
    noindexPhotos: 0,
  });
  const [campaigns, setCampaigns] = useState<CampaignSEOStatus[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSEOData = async () => {
      setLoading(true);

      // Fetch campaigns with SEO field status
      const { data: campaignsData } = await (supabase as any)
        .from('campaigns')
        .select('id, title, slug, status, seo_title, meta_description, keywords')
        .in('status', ['active', 'voting', 'completed']);

      // Fetch all submissions with status
      const { data: submissionsData } = await supabase
        .from('submissions')
        .select('id, status, campaign_id');

      if (campaignsData && submissionsData) {
        // Calculate campaign SEO status
        const campaignsWithStatus: CampaignSEOStatus[] = campaignsData.map((campaign: any) => {
          const campaignSubmissions = submissionsData.filter((s: any) => s.campaign_id === campaign.id);
          const indexable = campaignSubmissions.filter((s: any) => 
            s.status === 'approved' || s.status === 'winner'
          );

          return {
            id: campaign.id,
            title: campaign.title,
            slug: campaign.slug,
            status: campaign.status,
            hasSeoTitle: !!campaign.seo_title && campaign.seo_title.trim() !== '',
            hasMetaDescription: !!campaign.meta_description && campaign.meta_description.trim() !== '',
            hasKeywords: !!campaign.keywords && campaign.keywords.length > 0,
            photoCount: campaignSubmissions.length,
            indexablePhotoCount: indexable.length,
          };
        });

        // Calculate overall stats
        const campaignsWithFullSEO = campaignsWithStatus.filter(
          c => c.hasSeoTitle && c.hasMetaDescription
        ).length;

        const totalPhotos = submissionsData.length;
        const indexablePhotos = submissionsData.filter(
          (s: any) => s.status === 'approved' || s.status === 'winner'
        ).length;

        setStats({
          totalCampaigns: campaignsData.length,
          campaignsWithSEO: campaignsWithFullSEO,
          totalPhotos,
          indexablePhotos,
          noindexPhotos: totalPhotos - indexablePhotos,
        });

        setCampaigns(campaignsWithStatus);
      }

      setLoading(false);
    };

    fetchSEOData();
  }, []);

  const seoCompletionPercent = stats.totalCampaigns > 0 
    ? Math.round((stats.campaignsWithSEO / stats.totalCampaigns) * 100) 
    : 0;

  const indexablePercent = stats.totalPhotos > 0 
    ? Math.round((stats.indexablePhotos / stats.totalPhotos) * 100) 
    : 0;

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-display font-bold">SEO Health Dashboard</h1>
          <p className="text-muted-foreground">Monitor search engine optimization across campaigns and photos</p>
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
            <p className="text-2xl font-bold">{stats.campaignsWithSEO} / {stats.totalCampaigns}</p>
            <p className="text-sm text-muted-foreground">Campaigns with SEO</p>
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
            <p className="text-2xl font-bold">{stats.totalCampaigns + stats.indexablePhotos}</p>
            <p className="text-sm text-muted-foreground">Sitemap URLs</p>
            <p className="text-xs text-muted-foreground mt-2">Campaigns + approved photos</p>
          </CardContent>
        </Card>
      </div>

      {/* Contest SEO Status Table */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ImageIcon className="h-5 w-5" />
            Campaign SEO Status
          </CardTitle>
          <CardDescription>
            SEO field completion status for each campaign
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Loading...</div>
          ) : campaigns.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No active campaigns found
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Campaign</TableHead>
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
                {campaigns.map((campaign) => {
                  const isComplete = campaign.hasSeoTitle && campaign.hasMetaDescription;
                  return (
                    <TableRow key={campaign.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {!isComplete && (
                            <AlertTriangle className="h-4 w-4 text-amber-500 flex-shrink-0" />
                          )}
                          <div>
                            <p className="font-medium">{campaign.title}</p>
                            {campaign.slug && (
                              <p className="text-xs text-muted-foreground">/campaign/{campaign.slug}</p>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={
                          campaign.status === 'active' ? 'default' : 
                          campaign.status === 'voting' ? 'secondary' : 
                          'outline'
                        }>
                          {campaign.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        {campaign.hasSeoTitle ? (
                          <CheckCircle2 className="h-5 w-5 text-success mx-auto" />
                        ) : (
                          <XCircle className="h-5 w-5 text-destructive mx-auto" />
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        {campaign.hasMetaDescription ? (
                          <CheckCircle2 className="h-5 w-5 text-success mx-auto" />
                        ) : (
                          <XCircle className="h-5 w-5 text-destructive mx-auto" />
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        {campaign.hasKeywords ? (
                          <CheckCircle2 className="h-5 w-5 text-success mx-auto" />
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        {campaign.photoCount}
                      </TableCell>
                      <TableCell className="text-center">
                        <span className={campaign.indexablePhotoCount > 0 ? 'text-success font-medium' : 'text-muted-foreground'}>
                          {campaign.indexablePhotoCount}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Button asChild variant="ghost" size="sm">
                          <Link to={`/admin/campaigns/${campaign.id}/edit`}>
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
