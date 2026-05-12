import { createFileRoute, Link } from "@tanstack/react-router";
import { RequireAuth } from "@/components/RequireAuth";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { Search, FileClock, ArrowRight, Trash2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/history")({
  component: () => <RequireAuth><History /></RequireAuth>,
});

function History() {
  const { user } = useAuth();
  const [reports, setReports] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [sortAsc, setSortAsc] = useState(false);

  const load = async () => {
    if (!user) return;
    const { data } = await supabase.from("symptom_reports").select("*")
      .eq("user_id", user.id).order("created_at", { ascending: sortAsc });
    setReports(data ?? []);
  };

  useEffect(() => { load(); }, [user, sortAsc]);

  const filtered = reports.filter(r =>
    !search || r.symptoms.toLowerCase().includes(search.toLowerCase()) ||
    r.specialist?.toLowerCase().includes(search.toLowerCase())
  );

  const del = async (id: string) => {
    if (!confirm("Delete this report?")) return;
    const { error } = await supabase.from("symptom_reports").delete().eq("id", id);
    if (error) toast.error(error.message);
    else { toast.success("Deleted"); load(); }
  };

  return (
    <div className="max-w-5xl space-y-6">
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold flex items-center gap-2"><FileClock className="size-7 text-primary" /> Patient History</h1>
        <p className="text-muted-foreground">All your past symptom analyses.</p>
      </div>

      <div className="flex flex-wrap gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input className="pl-9" placeholder="Search by symptoms or specialist…" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Button variant="outline" onClick={() => setSortAsc(!sortAsc)}>
          Date: {sortAsc ? "Oldest" : "Newest"} first
        </Button>
      </div>

      {filtered.length === 0 ? (
        <Card className="p-12 text-center text-muted-foreground">
          No reports found. <Link to="/symptom-checker" className="text-primary font-medium hover:underline">Run an analysis</Link>.
        </Card>
      ) : (
        <div className="space-y-2">
          {filtered.map((r) => (
            <Card key={r.id} className="p-4 flex items-center gap-3 hover:shadow-card transition-shadow">
              <Link to="/report/$id" params={{ id: r.id }} className="flex-1 min-w-0">
                <div className="font-medium truncate">{r.symptoms}</div>
                <div className="text-xs text-muted-foreground">
                  {r.specialist} · {r.severity} · {format(new Date(r.created_at), "PPp")}
                </div>
              </Link>
              <Button variant="ghost" size="icon" onClick={() => del(r.id)}>
                <Trash2 className="size-4 text-destructive" />
              </Button>
              <Link to="/report/$id" params={{ id: r.id }}>
                <Button variant="ghost" size="icon"><ArrowRight className="size-4" /></Button>
              </Link>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
