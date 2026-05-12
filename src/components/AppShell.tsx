import { Link, useLocation, useRouter } from "@tanstack/react-router";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard, Stethoscope, FileClock, Calculator, User, LogOut,
  Shield, HeartPulse, Menu, X
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

const navItems = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/symptom-checker", label: "Symptom Checker", icon: Stethoscope },
  { to: "/history", label: "History", icon: FileClock },
  { to: "/bmi", label: "BMI Calculator", icon: Calculator },
  { to: "/profile", label: "Profile", icon: User },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const { user, isAdmin, signOut } = useAuth();
  const router = useRouter();
  const location = useLocation();
  const [open, setOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    router.navigate({ to: "/login" });
  };

  return (
    <div className="min-h-screen flex bg-background">
      {/* Sidebar */}
      <aside className={cn(
        "fixed lg:static inset-y-0 left-0 z-40 w-64 bg-sidebar border-r border-sidebar-border flex flex-col transition-transform lg:translate-x-0",
        open ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="h-16 flex items-center gap-2 px-6 border-b border-sidebar-border">
          <div className="size-9 rounded-lg gradient-primary flex items-center justify-center shadow-soft">
            <HeartPulse className="size-5 text-primary-foreground" />
          </div>
          <div>
            <div className="font-semibold text-sidebar-foreground leading-tight">MediSense</div>
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Health AI</div>
          </div>
        </div>
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {navItems.map(({ to, label, icon: Icon }) => {
            const active = location.pathname === to;
            return (
              <Link
                key={to}
                to={to}
                onClick={() => setOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                  active
                    ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-soft"
                    : "text-sidebar-foreground hover:bg-sidebar-accent"
                )}
              >
                <Icon className="size-4" />
                {label}
              </Link>
            );
          })}
          {isAdmin && (
            <Link
              to="/admin"
              onClick={() => setOpen(false)}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors mt-4 border-t border-sidebar-border pt-4",
                location.pathname === "/admin"
                  ? "bg-sidebar-primary text-sidebar-primary-foreground"
                  : "text-sidebar-foreground hover:bg-sidebar-accent"
              )}
            >
              <Shield className="size-4" />
              Admin Panel
            </Link>
          )}
        </nav>
        <div className="p-3 border-t border-sidebar-border">
          <div className="px-3 py-2 mb-2">
            <div className="text-xs text-muted-foreground">Signed in as</div>
            <div className="text-sm font-medium text-sidebar-foreground truncate">{user?.email}</div>
          </div>
          <Button variant="ghost" size="sm" className="w-full justify-start gap-2" onClick={handleSignOut}>
            <LogOut className="size-4" /> Sign out
          </Button>
        </div>
      </aside>

      {/* Overlay mobile */}
      {open && <div className="fixed inset-0 bg-black/40 z-30 lg:hidden" onClick={() => setOpen(false)} />}

      <div className="flex-1 flex flex-col min-w-0">
        {/* Topbar */}
        <header className="h-16 border-b border-border bg-card flex items-center justify-between px-4 lg:px-8">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setOpen(!open)}>
              {open ? <X className="size-5" /> : <Menu className="size-5" />}
            </Button>
            <div>
              <div className="text-sm text-muted-foreground">Welcome back</div>
              <div className="text-base font-semibold">{user?.email?.split("@")[0]}</div>
            </div>
          </div>
          <div className="text-xs text-muted-foreground hidden sm:block">
            AI insights are informational only — always consult a qualified doctor.
          </div>
        </header>
        <main className="flex-1 p-4 lg:p-8 overflow-x-hidden">{children}</main>
      </div>
    </div>
  );
}
