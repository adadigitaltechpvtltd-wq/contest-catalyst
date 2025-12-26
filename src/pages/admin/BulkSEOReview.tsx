import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { 
  Search, 
  Loader2, 
  CheckCircle, 
  AlertCircle,
  FileText,
  Save,
  RefreshCw,
  Image as ImageIcon,
  Sparkles,
  Eye
} from 'lucide-react';

interface SubmissionSEO {
  id: string;
  title: string;
  description: string | null;
  seo_title: string | null;
  meta_description: string | null;
  slug: string | null;
  image_url: string;
  contest: {
    id: string;
    title: string;
    slug: string | null;
  };
  profile: {
    full_name: string | null;
  };
  // Editable fields
  editedTitle: string;
  editedDescription: string;
  editedSeoTitle: string;
  editedMetaDescription: string;
  isModified: boolean;
  isSelected: boolean;
}

const BulkSEOReview = () => {
  const { toast } = useToast();
  const [submissions, setSubmissions] = useState<SubmissionSEO[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [filter, setFilter] = useState<'missing-seo' | 'missing-meta' | 'all'>('missing-seo');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectAll, setSelectAll] = useState(false);

  const fetchSubmissions = useCallback(async () => {
    setIsLoading(true);
    try {
      let query = supabase
        .from('submissions')
        .select(`
          id,
          title,
          description,
          seo_title,
          meta_description,
          slug,
          image_url,
          contest:contests!submissions_contest_id_fkey(id, title, slug),
          profile:profiles!submissions_user_id_profiles_fkey(full_name)
        `)
        .eq('status', 'approved')
        .order('created_at', { ascending: false });

      if (filter === 'missing-seo') {
        query = query.or('seo_title.is.null,meta_description.is.null');
      } else if (filter === 'missing-meta') {
        query = query.is('meta_description', null);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching submissions:', error);
        toast({
          title: 'Failed to load submissions',
          description: error.message,
          variant: 'destructive',
        });
        return;
      }

      const mapped: SubmissionSEO[] = (data || []).map((s: any) => ({
        id: s.id,
        title: s.title,
        description: s.description,
        seo_title: s.seo_title,
        meta_description: s.meta_description,
        slug: s.slug,
        image_url: s.image_url,
        contest: s.contest,
        profile: s.profile,
        editedTitle: s.title || '',
        editedDescription: s.description || '',
        editedSeoTitle: s.seo_title || '',
        editedMetaDescription: s.meta_description || '',
        isModified: false,
        isSelected: false,
      }));

      setSubmissions(mapped);
      setSelectAll(false);
    } catch (err: any) {
      console.error('Exception fetching submissions:', err);
      toast({
        title: 'Failed to load submissions',
        description: err?.message ?? 'Unexpected error',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [filter, toast]);

  useEffect(() => {
    fetchSubmissions();
  }, [fetchSubmissions]);

  const handleFieldChange = (id: string, field: keyof SubmissionSEO, value: string) => {
    setSubmissions(prev => prev.map(s => {
      if (s.id !== id) return s;
      const updated = { ...s, [field]: value };
      // Check if any field is modified from original
      updated.isModified = 
        updated.editedTitle !== s.title ||
        updated.editedDescription !== (s.description || '') ||
        updated.editedSeoTitle !== (s.seo_title || '') ||
        updated.editedMetaDescription !== (s.meta_description || '');
      return updated;
    }));
  };

  const handleSelectChange = (id: string, checked: boolean) => {
    setSubmissions(prev => prev.map(s => 
      s.id === id ? { ...s, isSelected: checked } : s
    ));
  };

  const handleSelectAll = (checked: boolean) => {
    setSelectAll(checked);
    setSubmissions(prev => prev.map(s => ({ ...s, isSelected: checked })));
  };

  const handleSaveSelected = async () => {
    const selected = submissions.filter(s => s.isSelected && s.isModified);
    if (selected.length === 0) {
      toast({
        title: 'No changes to save',
        description: 'Select items with changes to save.',
      });
      return;
    }

    setIsSaving(true);
    let successCount = 0;
    let errorCount = 0;

    for (const sub of selected) {
      const { error } = await supabase
        .from('submissions')
        .update({
          title: sub.editedTitle,
          description: sub.editedDescription || null,
          seo_title: sub.editedSeoTitle || null,
          meta_description: sub.editedMetaDescription || null,
        })
        .eq('id', sub.id);

      if (error) {
        console.error('Error updating submission:', sub.id, error);
        errorCount++;
      } else {
        successCount++;
      }
    }

    if (successCount > 0) {
      toast({
        title: 'SEO updates saved',
        description: `Successfully updated ${successCount} submission(s).`,
      });
    }
    if (errorCount > 0) {
      toast({
        title: 'Some updates failed',
        description: `${errorCount} submission(s) failed to update.`,
        variant: 'destructive',
      });
    }

    setIsSaving(false);
    fetchSubmissions();
  };

  const handleAutoGenerateSEO = (id: string) => {
    setSubmissions(prev => prev.map(s => {
      if (s.id !== id) return s;
      // Auto-generate SEO fields from title/description
      const seoTitle = s.editedTitle.slice(0, 60);
      const metaDesc = s.editedDescription 
        ? s.editedDescription.slice(0, 160)
        : `${s.editedTitle} - Photo submission in ${s.contest?.title || 'contest'} by ${s.profile?.full_name || 'photographer'}`;
      
      return {
        ...s,
        editedSeoTitle: seoTitle,
        editedMetaDescription: metaDesc.slice(0, 160),
        isModified: true,
      };
    }));
  };

  const filteredSubmissions = submissions.filter(s => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      s.title.toLowerCase().includes(search) ||
      s.profile?.full_name?.toLowerCase().includes(search) ||
      s.contest?.title?.toLowerCase().includes(search)
    );
  });

  const selectedCount = submissions.filter(s => s.isSelected).length;
  const modifiedCount = submissions.filter(s => s.isModified).length;
  const missingCount = submissions.filter(s => !s.seo_title || !s.meta_description).length;
  const completedCount = submissions.filter(s => s.seo_title && s.meta_description).length;

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-display font-bold">Bulk SEO Review</h1>
          <p className="text-muted-foreground">Quickly enhance SEO for approved photos</p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={fetchSubmissions}
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button
            onClick={handleSaveSelected}
            disabled={isSaving || selectedCount === 0}
            className="gap-2"
          >
            {isSaving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            Save Selected ({selectedCount})
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card className="bg-card/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                <ImageIcon className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Total</p>
                <p className="text-xl font-bold">{submissions.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-amber-500/20 flex items-center justify-center">
                <AlertCircle className="h-5 w-5 text-amber-500" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Missing SEO</p>
                <p className="text-xl font-bold">{missingCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-success/20 flex items-center justify-center">
                <CheckCircle className="h-5 w-5 text-success" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Complete</p>
                <p className="text-xl font-bold">{completedCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-accent/20 flex items-center justify-center">
                <FileText className="h-5 w-5 text-accent" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Modified</p>
                <p className="text-xl font-bold">{modifiedCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Completion Progress */}
      <Card className="mb-6 bg-card/50">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">SEO Completion</span>
            <span className="text-sm text-muted-foreground">
              {completedCount} / {submissions.length} photos
            </span>
          </div>
          <Progress 
            value={submissions.length > 0 ? (completedCount / submissions.length) * 100 : 0} 
            className="h-2"
          />
        </CardContent>
      </Card>

      {/* Filters & Search */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="flex gap-2">
          <Button
            variant={filter === 'missing-seo' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('missing-seo')}
          >
            Missing SEO
          </Button>
          <Button
            variant={filter === 'missing-meta' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('missing-meta')}
          >
            Missing Meta
          </Button>
          <Button
            variant={filter === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('all')}
          >
            All Approved
          </Button>
        </div>
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by title, photographer, or contest..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Select All */}
      {filteredSubmissions.length > 0 && (
        <div className="flex items-center gap-3 mb-4 p-3 bg-secondary/30 rounded-lg">
          <Checkbox
            checked={selectAll}
            onCheckedChange={(checked) => handleSelectAll(checked as boolean)}
          />
          <span className="text-sm">Select all ({filteredSubmissions.length} items)</span>
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : filteredSubmissions.length === 0 ? (
        <Card className="glass-card">
          <CardContent className="p-12 text-center">
            <CheckCircle className="h-16 w-16 mx-auto text-success mb-4" />
            <h3 className="text-xl font-semibold mb-2">All Caught Up!</h3>
            <p className="text-muted-foreground">
              {filter === 'missing-seo' 
                ? 'All approved photos have SEO fields filled in.'
                : 'No submissions match your current filter.'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredSubmissions.map((submission) => (
            <Card 
              key={submission.id} 
              className={`glass-card transition-all ${
                submission.isSelected ? 'ring-2 ring-primary' : ''
              } ${submission.isModified ? 'border-accent' : ''}`}
            >
              <CardContent className="p-4">
                <div className="flex gap-4">
                  {/* Checkbox & Image */}
                  <div className="flex items-start gap-3">
                    <Checkbox
                      checked={submission.isSelected}
                      onCheckedChange={(checked) => handleSelectChange(submission.id, checked as boolean)}
                      className="mt-1"
                    />
                    <div className="w-24 h-24 rounded-lg overflow-hidden flex-shrink-0">
                      <img
                        src={submission.image_url}
                        alt={submission.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </div>

                  {/* Content */}
                  <div className="flex-1 space-y-4">
                    {/* Header */}
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold">{submission.title}</h3>
                          {submission.isModified && (
                            <Badge variant="secondary" className="text-xs">Modified</Badge>
                          )}
                          {(!submission.seo_title || !submission.meta_description) && (
                            <Badge variant="outline" className="text-xs text-amber-500 border-amber-500">
                              Missing SEO
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {submission.profile?.full_name || 'Unknown'} • {submission.contest?.title}
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleAutoGenerateSEO(submission.id)}
                        className="gap-1"
                      >
                        <Sparkles className="h-3 w-3" />
                        Auto-fill
                      </Button>
                    </div>

                    {/* Editable Fields */}
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-xs font-medium flex items-center gap-2">
                          Enhanced Title
                          <span className="text-muted-foreground">
                            ({submission.editedTitle.length}/100)
                          </span>
                        </label>
                        <Input
                          value={submission.editedTitle}
                          onChange={(e) => handleFieldChange(submission.id, 'editedTitle', e.target.value)}
                          placeholder="SEO-friendly title..."
                          maxLength={100}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-medium flex items-center gap-2">
                          SEO Title
                          <span className="text-muted-foreground">
                            ({submission.editedSeoTitle.length}/60)
                          </span>
                        </label>
                        <Input
                          value={submission.editedSeoTitle}
                          onChange={(e) => handleFieldChange(submission.id, 'editedSeoTitle', e.target.value)}
                          placeholder="Title for search engines..."
                          maxLength={60}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-medium flex items-center gap-2">
                          Description
                          <span className="text-muted-foreground">
                            ({submission.editedDescription.length}/500)
                          </span>
                        </label>
                        <Textarea
                          value={submission.editedDescription}
                          onChange={(e) => handleFieldChange(submission.id, 'editedDescription', e.target.value)}
                          placeholder="Photo description..."
                          maxLength={500}
                          rows={2}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-medium flex items-center gap-2">
                          Meta Description
                          <span className="text-muted-foreground">
                            ({submission.editedMetaDescription.length}/160)
                          </span>
                        </label>
                        <Textarea
                          value={submission.editedMetaDescription}
                          onChange={(e) => handleFieldChange(submission.id, 'editedMetaDescription', e.target.value)}
                          placeholder="Description for search results..."
                          maxLength={160}
                          rows={2}
                        />
                      </div>
                    </div>

                    {/* SEO Preview */}
                    {(submission.editedSeoTitle || submission.editedTitle) && (
                      <div className="p-3 bg-background/50 rounded border border-border/50">
                        <div className="flex items-center gap-2 mb-2">
                          <Eye className="h-3 w-3 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">Search Preview</span>
                        </div>
                        <p className="text-sm font-medium text-primary truncate">
                          {submission.editedSeoTitle || submission.editedTitle} | GAAL
                        </p>
                        <p className="text-xs text-success truncate">
                          gaal.app/photo/{submission.contest?.slug || 'contest'}/{submission.slug || 'photo'}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                          {submission.editedMetaDescription || submission.editedDescription || 'No description'}
                        </p>
                      </div>
                    )}
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

export default BulkSEOReview;
