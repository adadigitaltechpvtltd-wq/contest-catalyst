import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Card, CardContent } from '@/components/ui/card';

const Privacy = () => {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-8 pt-24">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-display font-bold mb-2">Privacy Policy</h1>
          <p className="text-muted-foreground mb-8">Last updated: December 2024</p>

          <Card className="glass-card">
            <CardContent className="p-8 prose prose-invert max-w-none">
              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">1. Introduction</h2>
                <p className="text-muted-foreground mb-4">
                  At Gaal, we take your privacy seriously. This Privacy Policy explains how we collect, 
                  use, disclose, and safeguard your information when you use our photography contest platform.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">2. Information We Collect</h2>
                
                <h3 className="text-xl font-semibold mb-3 mt-6">2.1 Personal Information</h3>
                <p className="text-muted-foreground mb-4">
                  When you register, we collect:
                </p>
                <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                  <li>Full name</li>
                  <li>Email address</li>
                  <li>Date of birth (for age verification)</li>
                  <li>Phone number (optional)</li>
                  <li>Payment information (UPI ID, bank details for prize payouts)</li>
                </ul>

                <h3 className="text-xl font-semibold mb-3 mt-6">2.2 Photo Submissions</h3>
                <p className="text-muted-foreground mb-4">
                  When you submit photos, we collect:
                </p>
                <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                  <li>The photograph itself</li>
                  <li>EXIF metadata (camera model, date taken, GPS coordinates if present)</li>
                  <li>Title and description you provide</li>
                </ul>

                <h3 className="text-xl font-semibold mb-3 mt-6">2.3 Automatically Collected Information</h3>
                <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                  <li>IP address</li>
                  <li>Browser type and version</li>
                  <li>Device information</li>
                  <li>Usage patterns and preferences</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">3. How We Use Your Information</h2>
                <p className="text-muted-foreground mb-4">
                  We use your information to:
                </p>
                <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                  <li>Create and manage your account</li>
                  <li>Process contest submissions and determine winners</li>
                  <li>Verify photo authenticity using EXIF metadata</li>
                  <li>Process prize payouts</li>
                  <li>Send notifications about contests and account activity</li>
                  <li>Improve our platform and user experience</li>
                  <li>Prevent fraud and ensure platform integrity</li>
                  <li>Comply with legal obligations</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">4. Photo Display and Rights</h2>
                <p className="text-muted-foreground mb-4">
                  Regarding your submitted photographs:
                </p>
                <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                  <li>You retain full ownership of your photographs</li>
                  <li>You grant Gaal display rights for contest and platform display purposes</li>
                  <li>Approved photos may be displayed on our platform, search results, and promotional materials</li>
                  <li>We do not sell user photographs. Licensing or brand usage, if introduced, will always be opt-in and clearly disclosed to creators</li>
                  <li>You can request removal of your photos by contacting us</li>
                  <li>You can choose whether your content is contest-only, brand-licensable, or SEO-visible only</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">5. Information Sharing</h2>
                <p className="text-muted-foreground mb-4">
                  We may share your information with:
                </p>
                <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                  <li><strong>Service Providers:</strong> Payment processors, cloud hosting providers</li>
                  <li><strong>Legal Requirements:</strong> When required by law or legal process</li>
                  <li><strong>Business Transfers:</strong> In case of merger, acquisition, or sale</li>
                </ul>
                <p className="text-muted-foreground mt-4">
                  We do NOT sell your personal information to third parties for marketing purposes.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">6. Data Security</h2>
                <p className="text-muted-foreground mb-4">
                  We implement appropriate security measures including:
                </p>
                <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                  <li>Encryption of data in transit and at rest</li>
                  <li>Secure authentication mechanisms</li>
                  <li>Regular security audits</li>
                  <li>Access controls for employee data access</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">7. Data Retention & Account Deletion</h2>
                <p className="text-muted-foreground mb-4">
                  We retain your data for as long as your account is active or as needed to provide services. 
                  You can delete your account at any time from your Profile Settings.
                </p>
                
                <h3 className="text-xl font-semibold mb-3 mt-6">7.1 30-Day Grace Period</h3>
                <p className="text-muted-foreground mb-4">
                  When you request account deletion, your account enters a 30-day grace period:
                </p>
                <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                  <li><strong>Reversible during grace period:</strong> You can cancel the deletion anytime within 30 days by logging back in and visiting your Profile Settings</li>
                  <li><strong>Full access retained:</strong> Your account remains fully functional during the grace period</li>
                  <li><strong>Automatic processing:</strong> After 30 days, your account will be permanently anonymized</li>
                  <li><strong>Notification:</strong> A visible banner will remind you of the scheduled deletion date when logged in</li>
                </ul>

                <h3 className="text-xl font-semibold mb-3 mt-6">7.2 What Happens After the Grace Period</h3>
                <p className="text-muted-foreground mb-4">
                  Once the 30-day grace period ends, account deletion is permanent:
                </p>
                <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                  <li><strong>Personal data is anonymized:</strong> Your name becomes "Deleted User", your email is anonymized, and profile information is removed</li>
                  <li><strong>Payment details are deleted:</strong> UPI IDs, bank account numbers, and other payment information are permanently removed</li>
                  <li><strong>Contest integrity preserved:</strong> Your photo submissions remain visible to maintain contest history and leaderboard accuracy</li>
                  <li><strong>Wallet restrictions:</strong> You cannot schedule deletion if you have pending earnings or an available balance</li>
                  <li><strong>Transaction records retained:</strong> Payment history is kept for legal and accounting purposes</li>
                </ul>

                <h3 className="text-xl font-semibold mb-3 mt-6">7.3 What Remains After Deletion</h3>
                <p className="text-muted-foreground mb-4">
                  To maintain platform integrity, the following data is retained after account deletion:
                </p>
                <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                  <li>Photo submissions (displayed under "Deleted User")</li>
                  <li>Contest participation and rankings</li>
                  <li>Leaderboard points and positions</li>
                  <li>Transaction history (without personal identifiers)</li>
                </ul>

                <h3 className="text-xl font-semibold mb-3 mt-6">7.4 Account Recovery</h3>
                <p className="text-muted-foreground mb-4">
                  Once the 30-day grace period has passed, account deletion cannot be undone by users. 
                  In exceptional circumstances, platform administrators may restore deleted accounts upon request. 
                  Contact{' '}
                  <a href="mailto:support@gaal.com" className="text-primary hover:underline">support@gaal.com</a>{' '}
                  if you believe your account was deleted in error.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">8. Your Rights</h2>
                <p className="text-muted-foreground mb-4">
                  You have the right to:
                </p>
                <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                  <li>Access your personal data</li>
                  <li>Correct inaccurate data</li>
                  <li>Request deletion of your data</li>
                  <li>Object to processing of your data</li>
                  <li>Data portability</li>
                  <li>Withdraw consent at any time</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">9. Cookies and Tracking</h2>
                <p className="text-muted-foreground mb-4">
                  We use cookies and similar technologies to:
                </p>
                <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                  <li>Keep you logged in</li>
                  <li>Remember your preferences</li>
                  <li>Analyze platform usage</li>
                  <li>Improve our services</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">10. Children and Privacy</h2>
                <p className="text-muted-foreground mb-4">
                  Our platform is available to users aged 18 and above only. We do not knowingly collect 
                  information from minors. If you believe we have collected data from someone 
                  under 18, please contact us immediately.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">11. Changes to This Policy</h2>
                <p className="text-muted-foreground mb-4">
                  We may update this Privacy Policy from time to time. We will notify you of significant 
                  changes via email or platform notification.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4">12. Contact Us</h2>
                <p className="text-muted-foreground">
                  For privacy-related inquiries, please contact us at{' '}
                  <a href="mailto:privacy@gaal.com" className="text-primary hover:underline">
                    privacy@gaal.com
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

export default Privacy;
