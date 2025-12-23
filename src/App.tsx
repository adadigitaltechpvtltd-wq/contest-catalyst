import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import Index from "./pages/Index";
import ContestDetail from "./pages/ContestDetail";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Contests from "./pages/Contests";
import SubmitPhoto from "./pages/SubmitPhoto";
import Terms from "./pages/Terms";
import Privacy from "./pages/Privacy";
import ContestRules from "./pages/ContestRules";
import Copyright from "./pages/Copyright";
import AgePolicy from "./pages/AgePolicy";
import ReportAbuse from "./pages/ReportAbuse";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/contests" element={<Contests />} />
            <Route path="/contest/:id" element={<ContestDetail />} />
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } />
            <Route path="/submit/:contestId" element={
              <ProtectedRoute>
                <SubmitPhoto />
              </ProtectedRoute>
            } />
            {/* Legal Pages */}
            <Route path="/terms" element={<Terms />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/contest-rules" element={<ContestRules />} />
            <Route path="/copyright" element={<Copyright />} />
            <Route path="/age-policy" element={<AgePolicy />} />
            <Route path="/report" element={<ReportAbuse />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
