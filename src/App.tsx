import { BrowserRouter, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider } from "@/hooks/use-auth";

import Landing from "@/routes/index";
import Login from "@/routes/login";
import Register from "@/routes/register";
import Dashboard from "@/routes/dashboard";
import SymptomChecker from "@/routes/symptom-checker";
import History from "@/routes/history";
import BMI from "@/routes/bmi";
import Profile from "@/routes/profile";
import Admin from "@/routes/admin";
import Report from "@/routes/report.$id";
import NotFound from "@/routes/not-found";

const queryClient = new QueryClient();

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/symptom-checker" element={<SymptomChecker />} />
            <Route path="/history" element={<History />} />
            <Route path="/bmi" element={<BMI />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="/report/:id" element={<Report />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
          <Toaster richColors position="top-right" />
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
