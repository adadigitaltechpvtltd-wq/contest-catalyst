import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Card, CardContent } from '@/components/ui/card';

const Terms = () => {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-8 pt-24">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-display font-bold mb-2">Terms & Conditions</h1>
          <p className="text-muted-foreground mb-8">Last updated: December 2024</p>

          <Card className="glass-card">
            <CardContent className="p-8 prose prose-invert max-w-none">
              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">1. Acceptance of Terms</h2>
                <p className="text-muted-foreground mb-4">
                  By accessing or using Gaal, you agree to be bound by these Terms and Conditions. 
                  If you do not agree to these terms, please do not use our platform.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">2. Nature of Service</h2>
                <p className="text-muted-foreground mb-4">
                  Gaal is a skill-based photography contest platform. Important clarifications:
                </p>
                <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                  <li>This is NOT gambling, lottery, or any form of chance-based gaming</li>
                  <li>All contests are FREE to enter - no purchase or payment is required to participate</li>
                  <li>Winners are selected based on skill and merit, judged by human reviewers</li>
                  <li>No random selection or luck-based winner determination is used</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">3. Eligibility</h2>
                <p className="text-muted-foreground mb-4">
                  To use Gaal, you must:
                </p>
                <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                  <li>Be at least 18 years of age</li>
                  <li>Have a valid email address</li>
                  <li>Provide accurate information during registration</li>
                  <li>Comply with all applicable laws in your jurisdiction</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">4. User Accounts</h2>
                <p className="text-muted-foreground mb-4">
                  You are responsible for:
                </p>
                <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                  <li>Maintaining the confidentiality of your account credentials</li>
                  <li>All activities that occur under your account</li>
                  <li>Notifying us immediately of any unauthorized access</li>
                  <li>Ensuring your account information remains accurate and up-to-date</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">5. Contest Participation</h2>
                <p className="text-muted-foreground mb-4">
                  When participating in contests, you agree to:
                </p>
                <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                  <li>Submit only original photographs that you personally captured</li>
                  <li>Not submit AI-generated, stock, or copied images</li>
                  <li>Follow all contest-specific rules and guidelines</li>
                  <li>Accept the decisions of contest judges as final</li>
                  <li>Not engage in any form of manipulation or cheating</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">6. Prizes and Payouts</h2>
                <p className="text-muted-foreground mb-4">
                  Regarding contest prizes:
                </p>
                <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                  <li>Prize amounts are fixed and clearly displayed for each contest</li>
                  <li>Payouts are subject to manual approval and verification</li>
                  <li>KYC verification may be required for prize disbursement</li>
                  <li>Tax responsibility lies with the winner as per local laws</li>
                  <li>Prizes are non-transferable</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">7. Prohibited Activities</h2>
                <p className="text-muted-foreground mb-4">
                  Users must not:
                </p>
                <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                  <li>Submit photographs they do not own or have rights to</li>
                  <li>Use AI-generated images or heavily manipulated content</li>
                  <li>Create multiple accounts to gain unfair advantage</li>
                  <li>Harass, abuse, or harm other users</li>
                  <li>Attempt to manipulate contest results</li>
                  <li>Submit inappropriate, offensive, or illegal content</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">8. Content Moderation</h2>
                <p className="text-muted-foreground mb-4">
                  We employ multiple layers of content moderation:
                </p>
                <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                  <li>Automated AI detection systems (best-effort, not 100% accurate)</li>
                  <li>EXIF metadata analysis</li>
                  <li>Community reporting mechanisms</li>
                  <li>Human review for final decisions</li>
                </ul>
                <p className="text-muted-foreground mt-4">
                  <strong>Disclaimer:</strong> Our AI detection is provided on a best-effort basis. 
                  Final authority rests with human reviewers.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">9. Account Termination</h2>
                <p className="text-muted-foreground mb-4">
                  We reserve the right to suspend or terminate accounts that:
                </p>
                <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                  <li>Violate these terms and conditions</li>
                  <li>Engage in fraudulent or deceptive practices</li>
                  <li>Submit prohibited content repeatedly</li>
                  <li>Abuse the platform or other users</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">10. Limitation of Liability</h2>
                <p className="text-muted-foreground mb-4">
                  Gaal is provided "as is" without warranties of any kind. We are not liable for:
                </p>
                <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                  <li>Technical issues or service interruptions</li>
                  <li>Loss of data or submissions</li>
                  <li>Decisions made by contest judges</li>
                  <li>Actions of third parties or other users</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">11. Changes to Terms</h2>
                <p className="text-muted-foreground mb-4">
                  We may update these terms from time to time. Continued use of the platform after 
                  changes constitutes acceptance of the new terms. We will notify users of significant 
                  changes via email or platform notification.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4">12. Contact Us</h2>
                <p className="text-muted-foreground">
                  If you have any questions about these Terms & Conditions, please contact us at{' '}
                  <a href="mailto:legal@gaal.com" className="text-primary hover:underline">
                    legal@gaal.com
                  </a>
                </p>
              </section>
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Terms;
