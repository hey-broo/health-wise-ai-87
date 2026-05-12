import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { RequireAuth } from "@/components/RequireAuth";
import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Stethoscope, Sparkles, AlertTriangle } from "lucide-react";
import { z } from "zod";

export const Route = createFileRoute("/symptom-checker")({
  component: () => <RequireAuth><SymptomChecker /></RequireAuth>,
});

const schema = z.object({
  symptoms: z.string().trim().min(5, "Describe your symptoms (min 5 chars)").max(2000),
  age: z.number().int().min(1).max(120),
  gender: z.string().min(1),
  duration: z.string().min(1),
  severity: z.string().min(1),
});

function SymptomChecker() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [symptoms, setSymptoms] = useState("");
  const [age, setAge] = useState("30");
  const [gender, setGender] = useState("Male");
  const [duration, setDuration] = useState("1-3 days");
  const [severity, setSeverity] = useState("Moderate");
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = schema.safeParse({ symptoms, age: Number(age), gender, duration, severity });
    if (!parsed.success) { toast.error(parsed.error.issues[0].message); return; }
    if (!user) return;

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("symptom-analyze", {
        body: parsed.data,
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      const { data: inserted, error: insErr } = await supabase.from("symptom_reports").insert({
        user_id: user.id,
        symptoms: parsed.data.symptoms,
        age: parsed.data.age,
        gender: parsed.data.gender,
        duration: parsed.data.duration,
        severity: parsed.data.severity,
        conditions: data.conditions,
        precautions: data.precautions,
        specialist: data.specialist,
        medicines: data.medicines,
        advice: data.advice,
      }).select().single();
      if (insErr) throw insErr;
      toast.success("Analysis complete");
      navigate({ to: "/report/$id", params: { id: inserted.id } });
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Analysis failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold flex items-center gap-2">
          <Stethoscope className="size-7 text-primary" /> AI Symptom Checker
        </h1>
        <p className="text-muted-foreground">Describe how you feel and get structured health insights.</p>
      </div>

      <div className="rounded-lg bg-warning/10 border border-warning/30 p-4 flex gap-3 text-sm">
        <AlertTriangle className="size-5 text-warning-foreground shrink-0 mt-0.5" />
        <div>This tool provides general informational insights only. It is not a substitute for professional medical advice. In an emergency, call your local emergency number.</div>
      </div>

      <Card className="p-6 shadow-card">
        <form onSubmit={onSubmit} className="space-y-5">
          <div className="space-y-1.5">
            <Label htmlFor="symptoms">Symptoms *</Label>
            <Textarea id="symptoms" rows={4} value={symptoms} onChange={(e) => setSymptoms(e.target.value)}
              placeholder="E.g. headache for 2 days, mild fever, sore throat, runny nose…" required />
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="age">Age</Label>
              <Input id="age" type="number" min={1} max={120} value={age} onChange={(e) => setAge(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Gender</Label>
              <Select value={gender} onValueChange={setGender}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Male">Male</SelectItem>
                  <SelectItem value="Female">Female</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Duration</Label>
              <Select value={duration} onValueChange={setDuration}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="< 24 hours">Less than 24 hours</SelectItem>
                  <SelectItem value="1-3 days">1–3 days</SelectItem>
                  <SelectItem value="4-7 days">4–7 days</SelectItem>
                  <SelectItem value="1-2 weeks">1–2 weeks</SelectItem>
                  <SelectItem value="> 2 weeks">More than 2 weeks</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Severity</Label>
              <Select value={severity} onValueChange={setSeverity}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Mild">Mild</SelectItem>
                  <SelectItem value="Moderate">Moderate</SelectItem>
                  <SelectItem value="Severe">Severe</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <Button type="submit" disabled={loading} size="lg" className="w-full gap-2">
            {loading ? (
              <><div className="size-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" /> Analyzing…</>
            ) : (
              <><Sparkles className="size-4" /> Analyze symptoms</>
            )}
          </Button>
        </form>
      </Card>
    </div>
  );
}
