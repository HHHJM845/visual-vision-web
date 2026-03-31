import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Index from "./pages/Index.tsx";
import Commissions from "./pages/Commissions.tsx";
import CommissionDetail from "./pages/CommissionDetail.tsx";
import Gallery from "./pages/Gallery.tsx";
import Showcase from "./pages/Showcase.tsx";
import Events from "./pages/Events.tsx";
import AppPage from "./pages/AppPage.tsx";
import NotFound from "./pages/NotFound.tsx";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/commissions" element={<Commissions />} />
          <Route path="/commissions/:id" element={<CommissionDetail />} />
          <Route path="/gallery" element={<Gallery />} />
          <Route path="/showcase" element={<Showcase />} />
          <Route path="/events" element={<Events />} />
          <Route path="/app" element={<AppPage />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
