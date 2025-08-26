import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Layout } from "./components/Layout";
import { Navigation } from "./components/Navigation";
import Home from "./pages/Home";
import Login from "./pages/Login";
import SubmitChapter from "./pages/SubmitChapter";
import Dashboard from "./pages/Dashboard";
import NotFound from "./pages/NotFound";
import CalculadoraEditorial from './pages/Calculadora';

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Layout>
          <Navigation />
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/submit" element={<SubmitChapter />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="calculadora" element={<CalculadoraEditorial />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Layout>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
