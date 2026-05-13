import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/use-auth";
import { AppShell } from "./AppShell";

export function RequireAuth({ children, adminOnly = false }: { children: React.ReactNode; adminOnly?: boolean }) {
  const { user, loading, isAdmin } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) navigate("/login");
    if (!loading && adminOnly && user && !isAdmin) navigate("/dashboard");
  }, [user, loading, isAdmin, adminOnly, navigate]);

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="size-10 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }
  return <AppShell>{children}</AppShell>;
}
