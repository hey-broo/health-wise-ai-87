import { Link, useParams } from "react-router-dom";
import { RequireAuth } from "@/components/RequireAuth";
import { useEffect, useState } from "react";
import { doctorsStore, reportsStore, type Doctor, type StoredReport } from "@/data/store";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { ArrowLeft, FileText, Pill, UserRound, ShieldAlert, Lightbulb } from "lucide-react";

export default function ReportRoute() {
  return <RequireAuth><ReportPage /></RequireAuth>;
}

function ReportPage() {
  const { id } = useParams<{ id: string }>();
  const [report, setReport] = useState<StoredReport | null>(null);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    const data = reportsStore.findById(id) ?? null;
    setReport(data);
    if (data) {
      const docs = doctorsStore.list();
      const specialist = (data.specialist || "").toLowerCase();
      const symptoms = (data.symptoms || "").toLowerCase();
      const conditionNames = ((data.conditions as any[]) || []).map(c => (c.name || "").toLowerCase()).join(" ");
      const haystack = `${specialist} ${symptoms} ${conditionNames}`;

      const scored = docs
        .map(d => {
          const spec = (d.specialization || "").toLowerCase();
          let score = 0;
          for (const word of spec.split(/[\s,/-]+/).filter(w => w.length > 2)) {
            if (haystack.includes(word)) score += 2;
          }
          if (spec && haystack.includes(spec)) score += 3;
          return { d, score };
        })
        .filter(x => x.score > 0)
        .sort((a, b) => b.score - a.score)
        .map(x => x.d);

      let matched = scored.slice(0, 4);
      if (matched.length === 0) {
        matched = docs.filter(d => {
          const s = (d.specialization || "").toLowerCase();
          return s.includes("general") || s.includes("mbbs") || s.includes("physician") || s.includes("family");
        }).slice(0, 4);
      }
      setDoctors(matched);
    }
    setLoading(false);
  }, [id]);

  if (loading) return <div className="flex justify-center p-12"><div className="size-8 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>;
  if (!report) return <div>Report not found. <Link to="/history" className="text-primary">Back to history</Link></div>;

  const likelihoodColor = (l: string) =>
    l === "high" ? "bg-destructive/15 text-destructive border-destructive/30" :
    l === "moderate" ? "bg-warning/20 text-warning-foreground border-warning/40" :
    "bg-success/15 text-success border-success/30";

  return (
    <div className="max-w-4xl space-y-6">
      <Link to="/history"><Button variant="ghost" size="sm" className="gap-1"><ArrowLeft className="size-4" /> Back to history</Button></Link>

      <Card className="p-6 shadow-card">
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2"><FileText className="size-6 text-primary" /> Health Report</h1>
            <p className="text-sm text-muted-foreground mt-1">{format(new Date(report.created_at), "PPpp")}</p>
          </div>
          <div className="text-xs text-muted-foreground text-right">
            <div>{report.age}yo · {report.gender}</div>
            <div>{report.duration} · {report.severity}</div>
          </div>
        </div>
        <div className="mt-4 p-4 rounded-lg bg-muted">
          <div className="text-xs uppercase tracking-wide text-muted-foreground mb-1">Reported symptoms</div>
          <p className="text-sm">{report.symptoms}</p>
        </div>
      </Card>

      <Card className="p-6 shadow-card">
        <h2 className="font-semibold text-lg mb-3">Possible conditions</h2>
        <div className="space-y-3">
          {(report.conditions as any[])?.map((c, i) => (
            <div key={i} className="p-4 rounded-lg border border-border">
              <div className="flex items-center justify-between mb-1">
                <div className="font-medium">{c.name}</div>
                <Badge variant="outline" className={likelihoodColor(c.likelihood)}>{c.likelihood}</Badge>
              </div>
              <p className="text-sm text-muted-foreground">{c.explanation}</p>
            </div>
          ))}
        </div>
      </Card>

      <div className="grid md:grid-cols-2 gap-6">
        <Card className="p-6 shadow-card">
          <h2 className="font-semibold flex items-center gap-2 mb-3"><ShieldAlert className="size-4 text-primary" /> Precautions</h2>
          <ul className="space-y-2 text-sm">
            {(report.precautions as string[])?.map((p, i) => (
              <li key={i} className="flex gap-2"><span className="text-primary">•</span>{p}</li>
            ))}
          </ul>
        </Card>
        <Card className="p-6 shadow-card">
          <h2 className="font-semibold flex items-center gap-2 mb-3"><Lightbulb className="size-4 text-primary" /> Health advice</h2>
          <p className="text-sm">{report.advice}</p>
        </Card>
      </div>

      <Card className="p-6 shadow-card">
        <h2 className="font-semibold flex items-center gap-2 mb-3"><Pill className="size-4 text-primary" /> Medicine suggestions</h2>
        <p className="text-xs text-muted-foreground mb-3">Informational only — do not self-medicate without consulting a doctor.</p>
        <div className="grid sm:grid-cols-2 gap-2">
          {(report.medicines as any[])?.map((m, i) => (
            <div key={i} className="p-3 rounded-lg bg-muted">
              <div className="font-medium text-sm">{m.name}</div>
              <div className="text-xs text-muted-foreground">{m.purpose}</div>
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-6 shadow-card">
        <h2 className="font-semibold flex items-center gap-2 mb-1"><UserRound className="size-4 text-primary" /> Recommended specialist</h2>
        <p className="text-sm text-muted-foreground mb-4">{report.specialist}</p>
        {doctors.length > 0 ? (
          <div className="grid sm:grid-cols-2 gap-3">
            {doctors.map((d) => (
              <div key={d.id} className="p-4 rounded-lg border border-border">
                <div className="font-medium">{d.name}</div>
                <div className="text-xs text-muted-foreground">{d.specialization}</div>
                <div className="text-xs mt-1">{d.hospital} · {d.city}</div>
                <div className="text-xs text-primary mt-1">{d.phone}</div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No matching doctors in the directory yet.</p>
        )}
      </Card>
    </div>
  );
}
