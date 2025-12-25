import { useEffect, useState } from 'react';
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
import { CalendarIcon, Loader2, Plus, X } from 'lucide-react';
import { format, startOfDay } from 'date-fns';
import { cn } from '@/lib/utils';

type ContestStatus = 'draft' | 'active' | 'voting' | 'completed' | 'cancelled';

const EditContest = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [theme, setTheme] = useState('');
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
      setIsLoading(false);
    };

    fetchContest();
  }, [id, navigate, toast]);

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

    const { error } = await supabase
      .from('contests')
      .update({
        title,
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
                  min="10"
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
                <Input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-full"
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
                <Input
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="w-full"
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
