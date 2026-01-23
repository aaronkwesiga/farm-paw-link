import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Index from "./pages/Index";
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import MFASetup from "./pages/auth/MFASetup";
import Dashboard from "./pages/Dashboard";
import FarmerDashboard from "./pages/dashboard/FarmerDashboard";
import VetDashboard from "./pages/dashboard/VetDashboard";
import NewConsultation from "./pages/consultation/NewConsultation";
import ConsultationDetail from "./pages/consultation/ConsultationDetail";
import AnimalsManagement from "./pages/animals/AnimalsManagement";
import HowItWorks from "./pages/HowItWorks";
import About from "./pages/About";
import Services from "./pages/Services";
import Contact from "./pages/Contact";
import FAQ from "./pages/FAQ";
import Privacy from "./pages/Privacy";
import Profile from "./pages/Profile";
import NotFound from "./pages/NotFound";
import FindVets from "./pages/FindVets";
import VetProfilePage from "./pages/vet/VetProfile";
import VetPortfolioManage from "./pages/vet/VetPortfolioManage";
import Messages from "./pages/Messages";

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
            <Route path="/auth/login" element={<Login />} />
            <Route path="/auth/register" element={<Register />} />
            <Route path="/auth/mfa-setup" element={<MFASetup />} />
            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/dashboard/farmer" element={<ProtectedRoute><FarmerDashboard /></ProtectedRoute>} />
            <Route path="/dashboard/vet" element={<ProtectedRoute><VetDashboard /></ProtectedRoute>} />
            <Route path="/consultation/new" element={<ProtectedRoute><NewConsultation /></ProtectedRoute>} />
            <Route path="/consultation/:id" element={<ProtectedRoute><ConsultationDetail /></ProtectedRoute>} />
            <Route path="/animals" element={<ProtectedRoute><AnimalsManagement /></ProtectedRoute>} />
            <Route path="/how-it-works" element={<HowItWorks />} />
            <Route path="/about" element={<About />} />
            <Route path="/services" element={<Services />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/faq" element={<FAQ />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
            <Route path="/find-vets" element={<FindVets />} />
            <Route path="/vet/:userId" element={<VetProfilePage />} />
            <Route path="/vet/portfolio/manage" element={<ProtectedRoute><VetPortfolioManage /></ProtectedRoute>} />
            <Route path="/messages" element={<ProtectedRoute><Messages /></ProtectedRoute>} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;