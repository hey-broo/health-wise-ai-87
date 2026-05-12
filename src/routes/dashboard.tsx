import { createFileRoute, Link } from "@tanstack/react-router";
import { RequireAuth } from "@/components/RequireAuth";
import { useAuth } from "@/hooks/use-auth";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Stethoscope, FileClock, Calculator, Activity, ArrowRight, ClipboardList } from "lucide-react";
import { format } from "date-fns";

export const Route = createFileRoute("/dashboard")({
  component: () => <RequireAuth><Dashboard /></RequireAuth>,
});

function Dashboard() {
  const { user } = useAuth();
  const [reports, setReports] = useState<any[]>([]);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    if (!user) return;
    supabase.from("symptom_reports").select("*", { count: "exact" })
      .eq("user_id", user.id).order("created_at", { ascending: false }).limit(5)
      .then(({ data, count }) => { setReports(data ?? []); setTotal(count ?? 0); });
  }, [user]);

  return (
    <div className="space-y-6 max-w-6xl">
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold">Health Dashboard</h1>
        <p className="text-muted-foreground">Your personal medical insights at a glance.</p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card className="p-6 shadow-card">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-muted-foreground">Total reports</div>
              <div className="text-3xl font-bold mt-1">{total}</div>
            </div>
            <div className="size-12 rounded-xl bg-accent flex items-center justify-center">
              <ClipboardList className="size-6 text-primary" />
            </div>
          </div>
        </Card>
        <Card className="p-6 shadow-card gradient-primary text-primary-foreground">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm opacity-90">New analysis</div>
              <div className="text-xl font-semibold mt-1">Symptom Checker</div>
              <Link to="/symptom-checker">
                <Button variant="secondary" size="sm" className="mt-3 gap-1">Start <ArrowRight className="size-3" /></Button>
              </Link>
            </div>
            <Stethoscope className="size-10 opacity-70" />
          </div>
        </Card>
        <Card className="p-6 shadow-card">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-muted-foreground">Quick tool</div>
              <div className="text-xl font-semibold mt-1">BMI Calculator</div>
              <Link to="/bmi">
                <Button size="sm" variant="outline" className="mt-3 gap-1">Open <Calculator className="size-3" /></Button>
              </Link>
            </div>
            <Activity className="size-10 text-primary" />
          </div>
        </Card>
      </div>

      <Card className="p-6 shadow-card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-lg flex items-center gap-2"><FileClock className="size-4 text-primary" /> Recent reports</h2>
          <Link to="/history"><Button variant="ghost" size="sm">View all</Button></Link>
        </div>
        {reports.length === 0 ? (
          <div className="text-center py-10 text-muted-foreground">
            No reports yet.{" "}
            <Link to="/symptom-checker" className="text-primary font-medium hover:underline">Run your first analysis</Link>.
          </div>
        ) : (
          <div className="space-y-2">
            {reports.map((r) => (
              <Link key={r.id} to="/report/$id" params={{ id: r.id }}
                className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-muted transition-colors">
                <div className="min-w-0">
                  <div className="font-medium truncate">{r.symptoms}</div>
                  <div className="text-xs text-muted-foreground">
                    {r.specialist} · {format(new Date(r.created_at), "PPp")}
                  </div>
                </div>
                <ArrowRight className="size-4 text-muted-foreground shrink-0" />
              </Link>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
