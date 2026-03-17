import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import Dashboard from "./pages/Dashboard";
import Projects from "./pages/dashboard/Projects";
import PromptBuilder from "./pages/dashboard/PromptBuilder";
import AIAgents from "./pages/dashboard/AIAgents";
import DebugConsole from "./pages/dashboard/DebugConsole";
import DeployPage from "./pages/dashboard/DeployPage";
import SettingsPage from "./pages/dashboard/SettingsPage";
import Overview from "./pages/dashboard/Overview";
import ProjectWorkspace from "./pages/dashboard/ProjectWorkspace";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/dashboard" element={<Dashboard />}>
            <Route index element={<Overview />} />
            <Route path="projects" element={<Projects />} />
            <Route path="prompt-builder" element={<PromptBuilder />} />
            <Route path="agents" element={<AIAgents />} />
            <Route path="debug" element={<DebugConsole />} />
            <Route path="deploy" element={<DeployPage />} />
            <Route path="settings" element={<SettingsPage />} />
          </Route>
          <Route path="/dashboard/projects/:id" element={<ProjectWorkspace />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
