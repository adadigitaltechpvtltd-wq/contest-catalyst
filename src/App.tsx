import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import ScrollToTop from "@/components/ScrollToTop";
import OfflineBanner from "@/components/OfflineBanner";
import AdminLayout from "@/components/AdminLayout";
import Index from "./pages/Index";
import PhotoDetail from "./pages/PhotoDetail";
import ContestDetail from "./pages/ContestDetail";
import Auth from "./pages/Auth";
import ResetPassword from "./pages/ResetPassword";
import Dashboard from "./pages/Dashboard";
import Contests from "./pages/Contests";
import SubmitPhoto from "./pages/SubmitPhoto";
import MySubmissions from "./pages/MySubmissions";
import SubmissionDetail from "./pages/SubmissionDetail";
import Wallet from "./pages/Wallet";
import Profile from "./pages/Profile";
import Notifications from "./pages/Notifications";
import Terms from "./pages/Terms";
import Privacy from "./pages/Privacy";
import ContestRules from "./pages/ContestRules";
import Copyright from "./pages/Copyright";
import AgePolicy from "./pages/AgePolicy";
import HowGaalWorks from "./pages/HowGaalWorks";
import ReportAbuse from "./pages/ReportAbuse";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminContests from "./pages/admin/AdminContests";
import CreateContest from "./pages/admin/CreateContest";
import EditContest from "./pages/admin/EditContest";
import AdminSubmissions from "./pages/admin/AdminSubmissions";
import AdminPayments from "./pages/admin/AdminPayments";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminReports from "./pages/admin/AdminReports";
import AdminAnalytics from "./pages/admin/AdminAnalytics";
import AdminSEO from "./pages/admin/AdminSEO";
import BulkSEOReview from "./pages/admin/BulkSEOReview";
import WinnerSelection from "./pages/admin/WinnerSelection";
import LeaderboardPage from "./pages/LeaderboardPage";
import UserProfilePage from "./pages/UserProfilePage";
import Gallery from "./pages/Gallery";
import ForBrands from "./pages/ForBrands";
import AdminBrandInquiries from "./pages/admin/AdminBrandInquiries";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <HelmetProvider>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <OfflineBanner />
        <BrowserRouter>
          <AuthProvider>
            <ScrollToTop />
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/login" element={<Auth />} />
              <Route path="/signup" element={<Auth />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/contests" element={<Contests />} />
              <Route path="/contest/:slug" element={<ContestDetail />} />
              <Route path="/photo/:contestSlug/:photoSlug" element={<PhotoDetail />} />
              <Route path="/gallery" element={<Gallery />} />
              <Route path="/leaderboard" element={<LeaderboardPage />} />
              <Route path="/user/:username" element={<UserProfilePage />} />
              <Route path="/for-brands" element={<ForBrands />} />
            
            {/* Protected User Routes */}
            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/submit/:slug" element={<ProtectedRoute><SubmitPhoto /></ProtectedRoute>} />
            <Route path="/submissions" element={<ProtectedRoute><MySubmissions /></ProtectedRoute>} />
            <Route path="/submission/:id" element={<ProtectedRoute><SubmissionDetail /></ProtectedRoute>} />
            <Route path="/wallet" element={<ProtectedRoute><Wallet /></ProtectedRoute>} />
            <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
            <Route path="/notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />

            {/* Admin Routes */}
            <Route path="/admin" element={<ProtectedRoute requireAdmin><AdminLayout /></ProtectedRoute>}>
              <Route index element={<AdminDashboard />} />
              <Route path="contests" element={<AdminContests />} />
              <Route path="contests/new" element={<CreateContest />} />
              <Route path="contests/:id/edit" element={<EditContest />} />
              <Route path="contests/:contestId/winner" element={<WinnerSelection />} />
              <Route path="submissions" element={<AdminSubmissions />} />
              <Route path="payments" element={<AdminPayments />} />
              <Route path="users" element={<AdminUsers />} />
              <Route path="brand-inquiries" element={<AdminBrandInquiries />} />
              <Route path="reports" element={<AdminReports />} />
              <Route path="analytics" element={<AdminAnalytics />} />
              <Route path="seo" element={<AdminSEO />} />
              <Route path="seo/bulk" element={<BulkSEOReview />} />
            </Route>

            {/* Legal Pages */}
            <Route path="/terms" element={<Terms />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/contest-rules" element={<ContestRules />} />
            <Route path="/copyright" element={<Copyright />} />
            <Route path="/age-policy" element={<AgePolicy />} />
            <Route path="/how-gaal-works" element={<HowGaalWorks />} />
            <Route path="/report" element={<ReportAbuse />} />
            
              <Route path="*" element={<NotFound />} />
            </Routes>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </HelmetProvider>
);

export default App;
