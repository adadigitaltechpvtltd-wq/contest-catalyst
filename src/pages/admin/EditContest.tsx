import { useEffect, useState, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Loader2, Plus, X, Upload, ImageIcon, Instagram, Twitter, Linkedin, Youtube, ExternalLink, Crop } from 'lucide-react';
import { TimePicker } from '@/components/ui/time-picker';
import { format, startOfDay } from 'date-fns';
import { cn } from '@/lib/utils';
import ImageCropper from '@/components/ImageCropper';

type ContestStatus = 'draft' | 'active' | 'voting' | 'completed' | 'cancelled';

const EditContest = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [theme, setTheme] = useState('');
  const [category, setCategory] = useState('');
  const [customCategory, setCustomCategory] = useState('');
  const [originalCategory, setOriginalCategory] = useState('');
  const [prizeAmount, setPrizeAmount] = useState('500');
  const [minParticipants, setMinParticipants] = useState('100');
  const [maxParticipants, setMaxParticipants] = useState('');
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('23:59');
  const [status, setStatus] = useState<ContestStatus>('draft');
  const [featuredInHero, setFeaturedInHero] = useState(false);
  const [rules, setRules] = useState<string[]>(['']);
  const [judgingCriteria, setJudgingCriteria] = useState<string[]>(['']);
  const [coverImageUrl, setCoverImageUrl] = useState('');
  const [rawImageFile, setRawImageFile] = useState<File | null>(null);
  const [showCropper, setShowCropper] = useState(false);

  // Predefined categories
  const CATEGORIES = [
    { value: 'street-photography', label: 'Street Photography' },
    { value: 'wildlife', label: 'Wildlife' },
    { value: 'portraits', label: 'Portraits' },
    { value: 'food', label: 'Food' },
    { value: 'travel', label: 'Travel' },
    { value: 'nature', label: 'Nature' },
    { value: 'sports', label: 'Sports' },
    { value: 'architecture', label: 'Architecture' },
    { value: 'fashion', label: 'Fashion' },
    { value: 'pets', label: 'Pets' },
    { value: 'custom', label: '+ Add Custom Category' },
  ];

  // Check if category is editable (only before contest goes live)
  const isCategoryEditable = status === 'draft';
  
  // SEO fields
  const [seoTitle, setSeoTitle] = useState('');
  const [metaDescription, setMetaDescription] = useState('');
  const [keywords, setKeywords] = useState('');

  // Brand fields
  const [brandName, setBrandName] = useState('');
  const [brandDescription, setBrandDescription] = useState('');
  const [brandWebsiteUrl, setBrandWebsiteUrl] = useState('');
  const [brandInstagramUrl, setBrandInstagramUrl] = useState('');
  const [brandTwitterUrl, setBrandTwitterUrl] = useState('');
  const [brandLinkedinUrl, setBrandLinkedinUrl] = useState('');
  const [brandYoutubeUrl, setBrandYoutubeUrl] = useState('');
  const [brandCtaLabel, setBrandCtaLabel] = useState('');
  const [brandCtaUrl, setBrandCtaUrl] = useState('');

  useEffect(() => {
    const fetchContest = async () => {
      if (!id) return;

      const { data, error } = await supabase
        .from('contests')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (error || !data) {
        toast({
          title: 'Contest not found',
          description: error?.message ?? 'Unable to load contest',
          variant: 'destructive',
        });
        navigate('/admin/contests');
        return;
      }

      setTitle(data.title);
      setDescription(data.description ?? '');
      setTheme(data.theme ?? '');
      setPrizeAmount(data.prize_amount?.toString() ?? '500');
      setMinParticipants(data.min_participants?.toString() ?? '100');
      setMaxParticipants(data.max_participants?.toString() ?? '');
      const startDateTime = new Date(data.start_date);
      const endDateTime = new Date(data.end_date);
      setStartDate(startDateTime);
      setEndDate(endDateTime);
      setStartTime(format(startDateTime, 'HH:mm'));
      setEndTime(format(endDateTime, 'HH:mm'));
      setStatus(data.status);
      setFeaturedInHero(data.featured_in_hero ?? false);
      setRules(data.rules?.length ? data.rules : ['']);
      setJudgingCriteria(data.judging_criteria?.length ? data.judging_criteria : ['']);
      // Load category
      const existingCategory = data.category || '';
      setOriginalCategory(existingCategory);
      // Check if it's a predefined category
      const isPredefined = CATEGORIES.some(c => c.value === existingCategory && c.value !== 'custom');
      if (isPredefined) {
        setCategory(existingCategory);
      } else if (existingCategory) {
        setCategory('custom');
        setCustomCategory(existingCategory);
      }
      // Load SEO fields
      setSeoTitle(data.seo_title ?? '');
      setMetaDescription(data.meta_description ?? '');
      setKeywords(data.keywords?.join(', ') ?? '');
      // Load cover image and brand fields
      setCoverImageUrl(data.cover_image_url ?? '');
      setBrandName(data.brand_name ?? '');
      setBrandDescription(data.brand_description ?? '');
      setBrandWebsiteUrl(data.brand_website_url ?? '');
      setBrandInstagramUrl(data.brand_instagram_url ?? '');
      setBrandTwitterUrl(data.brand_twitter_url ?? '');
      setBrandLinkedinUrl(data.brand_linkedin_url ?? '');
      setBrandYoutubeUrl(data.brand_youtube_url ?? '');
      setBrandCtaLabel(data.brand_cta_label ?? '');
      setBrandCtaUrl(data.brand_cta_url ?? '');
      setIsLoading(false);
    };

    fetchContest();
  }, [id, navigate, toast]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      toast({ title: 'Invalid file type', description: 'Please upload JPEG, PNG, or WebP', variant: 'destructive' });
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast({ title: 'File too large', description: 'Max 10MB allowed', variant: 'destructive' });
      return;
    }

    setRawImageFile(file);
    setShowCropper(true);
    e.target.value = '';
  }, [toast]);

  const handleCropComplete = useCallback(async (croppedFile: File) => {
    setShowCropper(false);
    setRawImageFile(null);
    setIsUploadingImage(true);

    const fileExt = croppedFile.name.split('.').pop() || 'jpg';
    const fileName = `contest-${id}-${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from('submissions')
      .upload(`contests/${fileName}`, croppedFile, { upsert: true });

    if (uploadError) {
      toast({ title: 'Upload failed', description: uploadError.message, variant: 'destructive' });
      setIsUploadingImage(false);
      return;
    }

    const { data: { publicUrl } } = supabase.storage
      .from('submissions')
      .getPublicUrl(`contests/${fileName}`);

    setCoverImageUrl(publicUrl);
    setIsUploadingImage(false);
    toast({ title: 'Image uploaded', description: `Optimized: ${(croppedFile.size / 1024 / 1024).toFixed(2)} MB` });
  }, [id, toast]);

  const handleCropCancel = useCallback(() => {
    setShowCropper(false);
    setRawImageFile(null);
  }, []);

  const addRule = () => setRules([...rules, '']);
  const removeRule = (index: number) => setRules(rules.filter((_, i) => i !== index));
  const updateRule = (index: number, value: string) => {
    const updated = [...rules];
    updated[index] = value;
    setRules(updated);
  };

  const addCriteria = () => setJudgingCriteria([...judgingCriteria, '']);
  const removeCriteria = (index: number) => setJudgingCriteria(judgingCriteria.filter((_, i) => i !== index));
  const updateCriteria = (index: number, value: string) => {
    const updated = [...judgingCriteria];
    updated[index] = value;
    setJudgingCriteria(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!startDate || !endDate) {
      toast({
        title: 'Missing dates',
        description: 'Please select start and end dates.',
        variant: 'destructive',
      });
      return;
    }

    // Combine date and time
    const [startHours, startMinutes] = startTime.split(':').map(Number);
    const [endHours, endMinutes] = endTime.split(':').map(Number);
    
    const combinedStartDate = new Date(startDate);
    combinedStartDate.setHours(startHours, startMinutes, 0, 0);
    
    const combinedEndDate = new Date(endDate);
    combinedEndDate.setHours(endHours, endMinutes, 0, 0);

    if (combinedEndDate <= combinedStartDate) {
      toast({
        title: 'Invalid dates',
        description: 'End date/time must be after start date/time.',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);

    // Parse keywords
    const keywordsArray = keywords
      .split(',')
      .map(k => k.trim())
      .filter(k => k.length > 0);

    // Determine final category
    const finalCategory = category === 'custom' ? customCategory : category;
    const categorySlug = finalCategory
      ? finalCategory
          .toLowerCase()
          .replace(/[^a-z0-9\s-]/g, '')
          .replace(/\s+/g, '-')
          .replace(/-+/g, '-')
          .trim()
      : originalCategory;

    const { error } = await supabase
      .from('contests')
      .update({
        title,
        category: categorySlug || null,
        description,
        theme: theme || null,
        prize_amount: parseFloat(prizeAmount),
        min_participants: parseInt(minParticipants),
        max_participants: maxParticipants ? parseInt(maxParticipants) : null,
        start_date: combinedStartDate.toISOString(),
        end_date: combinedEndDate.toISOString(),
        status,
        featured_in_hero: featuredInHero,
        rules: rules.filter((r) => r.trim() !== ''),
        judging_criteria: judgingCriteria.filter((c) => c.trim() !== ''),
        seo_title: seoTitle || null,
        meta_description: metaDescription || null,
        keywords: keywordsArray.length > 0 ? keywordsArray : null,
        cover_image_url: coverImageUrl || null,
        brand_name: brandName || null,
        brand_description: brandDescription || null,
        brand_website_url: brandWebsiteUrl || null,
        brand_instagram_url: brandInstagramUrl || null,
        brand_twitter_url: brandTwitterUrl || null,
        brand_linkedin_url: brandLinkedinUrl || null,
        brand_youtube_url: brandYoutubeUrl || null,
        brand_cta_label: brandCtaLabel || null,
        brand_cta_url: brandCtaUrl || null,
      })
      .eq('id', id);

    if (error) {
      toast({
        title: 'Failed to update contest',
        description: error.message,
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Contest updated!',
        description: 'Changes saved successfully.',
      });
      navigate('/admin/contests');
    }

    setIsSubmitting(false);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl">
      <div className="mb-8">
        <h1 className="text-3xl font-display font-bold">Edit Contest</h1>
        <p className="text-muted-foreground">Update contest details</p>
      </div>

      <form onSubmit={handleSubmit}>
        <Card className="glass-card mb-6">
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
            <CardDescription>Contest title, description, and theme</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Contest Title *</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Urban Street Photography Challenge"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="category">
                Category *
                {!isCategoryEditable && (
                  <span className="text-xs text-muted-foreground ml-2">(Cannot be changed after contest goes live)</span>
                )}
              </Label>
              <Select value={category} onValueChange={setCategory} disabled={!isCategoryEditable}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((cat) => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {category === 'custom' && (
                <Input
                  value={customCategory}
                  onChange={(e) => setCustomCategory(e.target.value)}
                  placeholder="Enter custom category (e.g., macro-photography)"
                  className="mt-2"
                  disabled={!isCategoryEditable}
                />
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="theme">Theme (Optional)</Label>
              <Input
                id="theme"
                value={theme}
                onChange={(e) => setTheme(e.target.value)}
                placeholder="e.g., Street Life, Nature, Portraits"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe the contest, what you are looking for, and any inspiration..."
                rows={4}
              />
            </div>
          </CardContent>
        </Card>

        {/* Cover Image Card */}
        <Card className="glass-card mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ImageIcon className="h-5 w-5" />
              Contest Cover Image
            </CardTitle>
            <CardDescription>Single image used across listings and contest page</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {coverImageUrl ? (
              <div className="relative">
                <img
                  src={coverImageUrl}
                  alt="Contest cover"
                  className="w-full max-w-md h-48 object-contain rounded-lg border border-border bg-muted"
                />
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  className="absolute top-2 right-2"
                  onClick={() => setCoverImageUrl('')}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center w-full max-w-md h-48 border-2 border-dashed border-border rounded-lg cursor-pointer hover:border-primary/50 transition-colors bg-muted/50">
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  {isUploadingImage ? (
                    <Loader2 className="h-10 w-10 text-muted-foreground animate-spin" />
                  ) : (
                    <>
                      <Crop className="h-10 w-10 text-muted-foreground mb-3" />
                      <p className="text-sm text-muted-foreground">Click to upload & crop</p>
                      <p className="text-xs text-muted-foreground mt-1">Max 10MB • Will be optimized</p>
                    </>
                  )}
                </div>
                <input
                  type="file"
                  className="hidden"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleFileSelect}
                  disabled={isUploadingImage}
                />
              </label>
            )}
          </CardContent>
        </Card>

        {/* Image Cropper Modal */}
        {rawImageFile && (
          <ImageCropper
            file={rawImageFile}
            isOpen={showCropper}
            onClose={handleCropCancel}
            onCropComplete={handleCropComplete}
            maxWidth={1920}
            maxHeight={1080}
            quality={0.85}
          />
        )}

        {/* SEO Settings Card */}
        <Card className="glass-card mb-6">
          <CardHeader>
            <CardTitle>SEO Settings</CardTitle>
            <CardDescription>Optimize this contest for search engines. These fields also serve as templates for photo page SEO.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="seoTitle">SEO Title (optional, uses contest title if empty)</Label>
              <Input
                id="seoTitle"
                value={seoTitle}
                onChange={(e) => setSeoTitle(e.target.value)}
                placeholder="e.g., Urban Street Photography Contest 2025 | Win $500"
                maxLength={60}
              />
              <p className="text-xs text-muted-foreground">
                {seoTitle.length}/60 characters
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="metaDescription">Meta Description (max 160 characters)</Label>
              <Textarea
                id="metaDescription"
                value={metaDescription}
                onChange={(e) => setMetaDescription(e.target.value)}
                placeholder="A compelling description that appears in search results..."
                maxLength={160}
                rows={2}
              />
              <p className="text-xs text-muted-foreground">
                {metaDescription.length}/160 characters
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="keywords">Keywords (comma-separated)</Label>
              <Input
                id="keywords"
                value={keywords}
                onChange={(e) => setKeywords(e.target.value)}
                placeholder="street photography, urban, contest, photography competition"
              />
              <p className="text-xs text-muted-foreground">
                Used for SEO and categorization
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card mb-6">
          <CardHeader>
            <CardTitle>Prize & Participation</CardTitle>
            <CardDescription>Set the prize amount and participant limits</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="prize">Prize Amount ($) *</Label>
                <Input
                  id="prize"
                  type="number"
                  min="0"
                  value={prizeAmount}
                  onChange={(e) => setPrizeAmount(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="minParticipants">Min Participants *</Label>
                <Input
                  id="minParticipants"
                  type="number"
                  min="1"
                  value={minParticipants}
                  onChange={(e) => setMinParticipants(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="maxParticipants">Max Participants</Label>
                <Input
                  id="maxParticipants"
                  type="number"
                  value={maxParticipants}
                  onChange={(e) => setMaxParticipants(e.target.value)}
                  placeholder="Unlimited"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card mb-6">
          <CardHeader>
            <CardTitle>Schedule</CardTitle>
            <CardDescription>Contest duration - set date and time for start and end</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Start Date *</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        'w-full justify-start text-left font-normal',
                        !startDate && 'text-muted-foreground'
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {startDate ? format(startDate, 'PPP') : 'Pick start date'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 pointer-events-auto">
                    <Calendar
                      mode="single"
                      selected={startDate}
                      onSelect={setStartDate}
                      initialFocus
                      className="pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="space-y-2">
                <Label>Start Time *</Label>
                <TimePicker
                  value={startTime}
                  onChange={setStartTime}
                />
              </div>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>End Date *</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        'w-full justify-start text-left font-normal',
                        !endDate && 'text-muted-foreground'
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {endDate ? format(endDate, 'PPP') : 'Pick end date'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 pointer-events-auto">
                    <Calendar
                      mode="single"
                      selected={endDate}
                      onSelect={setEndDate}
                      disabled={(date) => startDate ? date < startOfDay(startDate) : false}
                      initialFocus
                      className="pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="space-y-2">
                <Label>End Time *</Label>
                <TimePicker
                  value={endTime}
                  onChange={setEndTime}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card mb-6">
          <CardHeader>
            <CardTitle>Rules</CardTitle>
            <CardDescription>Specific rules for this contest</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {rules.map((rule, index) => (
              <div key={index} className="flex gap-2">
                <Input
                  value={rule}
                  onChange={(e) => updateRule(index, e.target.value)}
                  placeholder={`Rule ${index + 1}`}
                />
                {rules.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeRule(index)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
            <Button type="button" variant="outline" size="sm" onClick={addRule}>
              <Plus className="h-4 w-4 mr-1" />
              Add Rule
            </Button>
          </CardContent>
        </Card>

        <Card className="glass-card mb-6">
          <CardHeader>
            <CardTitle>Judging Criteria</CardTitle>
            <CardDescription>What will submissions be judged on?</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {judgingCriteria.map((criteria, index) => (
              <div key={index} className="flex gap-2">
                <Input
                  value={criteria}
                  onChange={(e) => updateCriteria(index, e.target.value)}
                  placeholder={`Criteria ${index + 1} (e.g., Composition, Creativity)`}
                />
                {judgingCriteria.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeCriteria(index)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
            <Button type="button" variant="outline" size="sm" onClick={addCriteria}>
              <Plus className="h-4 w-4 mr-1" />
              Add Criteria
            </Button>
          </CardContent>
        </Card>

        {/* Brand / Partner Details */}
        <Card className="glass-card mb-6">
          <CardHeader>
            <CardTitle>Brand / Partner Details (Optional)</CardTitle>
            <CardDescription>Add optional brand or sponsor information for this contest</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="brandName">Brand Name</Label>
                <Input
                  id="brandName"
                  value={brandName}
                  onChange={(e) => setBrandName(e.target.value)}
                  placeholder="e.g., Powered by Acme Co"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="brandWebsiteUrl">Brand Website URL</Label>
                <Input
                  id="brandWebsiteUrl"
                  type="url"
                  value={brandWebsiteUrl}
                  onChange={(e) => setBrandWebsiteUrl(e.target.value)}
                  placeholder="https://example.com"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="brandDescription">Brand Description (max 300 characters)</Label>
              <Textarea
                id="brandDescription"
                value={brandDescription}
                onChange={(e) => setBrandDescription(e.target.value)}
                placeholder="Short description about the brand or partner..."
                maxLength={300}
                rows={2}
              />
              <p className="text-xs text-muted-foreground">
                {brandDescription.length}/300 characters
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="brandInstagramUrl" className="flex items-center gap-2">
                  <Instagram className="h-4 w-4" /> Instagram URL
                </Label>
                <Input
                  id="brandInstagramUrl"
                  type="url"
                  value={brandInstagramUrl}
                  onChange={(e) => setBrandInstagramUrl(e.target.value)}
                  placeholder="https://instagram.com/brand"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="brandTwitterUrl" className="flex items-center gap-2">
                  <Twitter className="h-4 w-4" /> Twitter / X URL
                </Label>
                <Input
                  id="brandTwitterUrl"
                  type="url"
                  value={brandTwitterUrl}
                  onChange={(e) => setBrandTwitterUrl(e.target.value)}
                  placeholder="https://twitter.com/brand"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="brandLinkedinUrl" className="flex items-center gap-2">
                  <Linkedin className="h-4 w-4" /> LinkedIn URL
                </Label>
                <Input
                  id="brandLinkedinUrl"
                  type="url"
                  value={brandLinkedinUrl}
                  onChange={(e) => setBrandLinkedinUrl(e.target.value)}
                  placeholder="https://linkedin.com/company/brand"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="brandYoutubeUrl" className="flex items-center gap-2">
                  <Youtube className="h-4 w-4" /> YouTube URL
                </Label>
                <Input
                  id="brandYoutubeUrl"
                  type="url"
                  value={brandYoutubeUrl}
                  onChange={(e) => setBrandYoutubeUrl(e.target.value)}
                  placeholder="https://youtube.com/@brand"
                />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="brandCtaLabel" className="flex items-center gap-2">
                  <ExternalLink className="h-4 w-4" /> CTA Button Label
                </Label>
                <Input
                  id="brandCtaLabel"
                  value={brandCtaLabel}
                  onChange={(e) => setBrandCtaLabel(e.target.value)}
                  placeholder="e.g., Visit Brand"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="brandCtaUrl">CTA Button URL</Label>
                <Input
                  id="brandCtaUrl"
                  type="url"
                  value={brandCtaUrl}
                  onChange={(e) => setBrandCtaUrl(e.target.value)}
                  placeholder="https://example.com/promo"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card mb-6">
          <CardHeader>
            <CardTitle>Status & Visibility</CardTitle>
            <CardDescription>Change contest status</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Select value={status} onValueChange={(v) => setStatus(v as ContestStatus)}>
              <SelectTrigger className="w-full md:w-64">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="voting">Voting</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
            
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="featuredInHero" 
                checked={featuredInHero} 
                onCheckedChange={(checked) => setFeaturedInHero(checked === true)}
              />
              <Label htmlFor="featuredInHero" className="text-sm font-normal cursor-pointer">
                Feature this contest in the homepage hero section
              </Label>
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate('/admin/contests')}
          >
            Cancel
          </Button>
          <Button type="submit" className="gradient-primary" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Saving...
              </>
            ) : (
              'Save Changes'
            )}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default EditContest;
