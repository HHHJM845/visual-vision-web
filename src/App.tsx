import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import Index from "./pages/Index";
import Commissions from "./pages/Commissions";
import CommissionDetail from "./pages/CommissionDetail";
import CommissionEdit from "./pages/CommissionEdit";
import CommissionNew from "./pages/CommissionNew";
import Creators from "./pages/Creators";
import Gallery from "./pages/Gallery";
import Showcase from "./pages/Showcase";
import Events from "./pages/Events";
import AppPage from "./pages/AppPage";
import Messages from "./pages/Messages";
import Login from "./pages/Login";
import Register from "./pages/Register";
import OnboardingAigcer from "./pages/OnboardingAigcer";
import OnboardingClient from "./pages/OnboardingClient";
import DashboardClient from "./pages/DashboardClient";
import DashboardAigcer from "./pages/DashboardAigcer";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminReviews from "./pages/admin/AdminReviews";
import AdminReviewDetail from "./pages/admin/AdminReviewDetail";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminAuditLog from "./pages/admin/AdminAuditLog";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/onboarding/aigcer" element={<OnboardingAigcer />} />
            <Route path="/onboarding/client" element={<OnboardingClient />} />
            <Route path="/dashboard/client" element={<DashboardClient />} />
            <Route path="/dashboard/aigcer" element={<DashboardAigcer />} />
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/verifications" element={<AdminReviews />} />
            <Route path="/admin/verifications/:id" element={<AdminReviewDetail />} />
            <Route path="/admin/users" element={<AdminUsers />} />
            <Route path="/admin/audit-log" element={<AdminAuditLog />} />
            <Route path="/commissions" element={<Commissions />} />
            <Route path="/commissions/new" element={<CommissionNew />} />
            <Route path="/commissions/:id/edit" element={<CommissionEdit />} />
            <Route path="/commissions/:id" element={<CommissionDetail />} />
            <Route path="/creators" element={<Creators />} />
            <Route path="/gallery" element={<Gallery />} />
            <Route path="/showcase" element={<Showcase />} />
            <Route path="/events" element={<Events />} />
            <Route path="/messages" element={<Messages />} />
            <Route path="/app" element={<AppPage />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
