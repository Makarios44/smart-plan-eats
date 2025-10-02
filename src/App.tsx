import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Onboarding from "./pages/Onboarding";
import Dashboard from "./pages/Dashboard";
import PlanoAlimentar from "./pages/PlanoAlimentar";
import Evolucao from "./pages/Evolucao";
import ListaCompras from "./pages/ListaCompras";
import NotFound from "./pages/NotFound";
import FeedbackSemanal from "./pages/FeedbackSemanal";
import RestricoesDietarias from "./pages/RestricoesDietarias";
import HistoricoAjustes from "./pages/HistoricoAjustes";
import MinhaDespensa from "./pages/MinhaDespensa";
import SugestoesIA from "./pages/SugestoesIA";
import Insights from "./pages/Insights";
import AdminPanel from "./pages/AdminPanel";
import NutritionistPanel from "./pages/NutritionistPanel";
import ResetPassword from "./pages/ResetPassword";
import Settings from "./pages/Settings";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/onboarding" element={<Onboarding />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/plano" element={<PlanoAlimentar />} />
          <Route path="/evolucao" element={<Evolucao />} />
          <Route path="/lista-compras" element={<ListaCompras />} />
          <Route path="/feedback-semanal" element={<FeedbackSemanal />} />
          <Route path="/restricoes" element={<RestricoesDietarias />} />
          <Route path="/historico-ajustes" element={<HistoricoAjustes />} />
          <Route path="/despensa" element={<MinhaDespensa />} />
          <Route path="/sugestoes-ia" element={<SugestoesIA />} />
          <Route path="/insights" element={<Insights />} />
          <Route path="/admin" element={<AdminPanel />} />
          <Route path="/nutricionista" element={<NutritionistPanel />} />
          <Route path="/auth/reset-password" element={<ResetPassword />} />
          <Route path="/settings" element={<Settings />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
