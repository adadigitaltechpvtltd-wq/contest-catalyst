import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { getUserFriendlyError } from '@/lib/errorMapping';
import { AlertTriangle, Flag, Loader2, CheckCircle } from 'lucide-react';

const ReportAbuse = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  
  const [reportType, setReportType] = useState('');
  const [submissionUrl, setSubmissionUrl] = useState('');
  const [reason, setReason] = useState('');
  const [description, setDescription] = useState('');
  const [confirmAccuracy, setConfirmAccuracy] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!confirmAccuracy) {
      toast({
        title: 'Please confirm accuracy',
        description: 'You must confirm that your report is accurate and made in good faith.',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // For now, we will create a report without a specific submission_id
      // In a real implementation, you would extract the submission ID from the URL
      const { error } = await supabase.from('reports').insert({
        reporter_id: user?.id || null,
        reason: `${reportType}: ${reason}`,
        description: `URL: ${submissionUrl}\n\n${description}`,
      });

      if (error) throw error;

      setIsSubmitted(true);
      toast({
        title: 'Report submitted',
        description: 'Thank you for helping keep our community safe.',
      });
    } catch (error: unknown) {
      toast({
        title: 'Failed to submit report',
        description: getUserFriendlyError(error),
        variant: 'destructive',
      });
    }

    setIsSubmitting(false);
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Navbar />
        <main className="flex-1 container mx-auto px-4 py-8 pt-24 flex items-center justify-center">
          <Card className="glass-card max-w-md w-full text-center">
            <CardContent className="p-8">
              <CheckCircle className="h-16 w-16 text-success mx-auto mb-4" />
              <h2 className="text-2xl font-bold mb-2">Report Submitted</h2>
              <p className="text-muted-foreground mb-6">
                Thank you for your report. Our team will review it and take appropriate action.
                You may receive a follow-up if we need more information.
              </p>
              <Button asChild>
                <a href="/">Return Home</a>
              </Button>
            </CardContent>
          </Card>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-8 pt-24">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-2 mb-4">
              <Flag className="h-8 w-8 text-destructive" />
            </div>
            <h1 className="text-3xl font-display font-bold mb-2">Report Abuse</h1>
            <p className="text-muted-foreground">
              Help us maintain a safe and fair community by reporting violations
            </p>
          </div>

          <Card className="glass-card mb-6">
            <CardHeader>
              <CardTitle>Submit a Report</CardTitle>
              <CardDescription>
                Use this form to report content or behavior that violates our community guidelines
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="report-type">Type of Report</Label>
                  <Select value={reportType} onValueChange={setReportType} required>
                    <SelectTrigger>
                      <SelectValue placeholder="Select report type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ai-generated">AI-Generated Image</SelectItem>
                      <SelectItem value="copyright">Copyright Infringement</SelectItem>
                      <SelectItem value="stolen">Stolen/Copied Image</SelectItem>
                      <SelectItem value="inappropriate">Inappropriate Content</SelectItem>
                      <SelectItem value="spam">Spam or Fake Account</SelectItem>
                      <SelectItem value="harassment">Harassment or Abuse</SelectItem>
                      <SelectItem value="other">Other Violation</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="submission-url">Content URL (if applicable)</Label>
                  <Input
                    id="submission-url"
                    type="url"
                    placeholder="https://contestify.com/submission/..."
                    value={submissionUrl}
                    onChange={(e) => setSubmissionUrl(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Paste the link to the submission or profile you are reporting
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="reason">Reason for Report</Label>
                  <Input
                    id="reason"
                    placeholder="Brief summary of the violation"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    required
                    maxLength={200}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Detailed Description</Label>
                  <Textarea
                    id="description"
                    placeholder="Please provide as much detail as possible about the violation. Include any evidence or context that would help our review team."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={5}
                    required
                    maxLength={2000}
                  />
                </div>

                <div className="flex items-start gap-4 p-4 bg-amber-500/10 border border-amber-500/30 rounded-lg">
                  <AlertTriangle className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-muted-foreground">
                    <p className="font-semibold text-amber-500 mb-1">Important</p>
                    <p>
                      False or malicious reports may result in action against your account. 
                      Please only submit genuine concerns.
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <Checkbox
                    id="confirm-accuracy"
                    checked={confirmAccuracy}
                    onCheckedChange={(checked) => setConfirmAccuracy(checked as boolean)}
                  />
                  <Label htmlFor="confirm-accuracy" className="text-sm leading-relaxed">
                    I confirm that this report is accurate and made in good faith. I understand 
                    that submitting false reports may result in action against my account.
                  </Label>
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  disabled={isSubmitting || !reportType || !reason || !description}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Flag className="h-4 w-4 mr-2" />
                      Submit Report
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardHeader>
              <CardTitle>What Happens Next?</CardTitle>
            </CardHeader>
            <CardContent className="text-muted-foreground space-y-4">
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-semibold">
                  1
                </div>
                <div>
                  <h4 className="font-semibold text-foreground">Report Received</h4>
                  <p className="text-sm">Your report is logged and added to our review queue.</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-semibold">
                  2
                </div>
                <div>
                  <h4 className="font-semibold text-foreground">Investigation</h4>
                  <p className="text-sm">Our moderation team reviews the reported content and evidence.</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-semibold">
                  3
                </div>
                <div>
                  <h4 className="font-semibold text-foreground">Action Taken</h4>
                  <p className="text-sm">
                    If a violation is confirmed, appropriate action is taken (warning, content removal, 
                    disqualification, or account suspension).
                  </p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-semibold">
                  4
                </div>
                <div>
                  <h4 className="font-semibold text-foreground">Follow-up</h4>
                  <p className="text-sm">
                    You may receive a notification about the outcome of your report.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default ReportAbuse;
