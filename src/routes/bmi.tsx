import { createFileRoute } from "@tanstack/react-router";
import { RequireAuth } from "@/components/RequireAuth";
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Calculator } from "lucide-react";

export const Route = createFileRoute("/bmi")({
  component: () => <RequireAuth><BMI /></RequireAuth>,
});

function BMI() {
  const [h, setH] = useState("170");
  const [w, setW] = useState("70");
  const [unit, setUnit] = useState<"metric" | "imperial">("metric");
  const [result, setResult] = useState<{ bmi: number; cat: string; color: string } | null>(null);

  const calc = () => {
    const ht = parseFloat(h);
    const wt = parseFloat(w);
    if (!ht || !wt) return;
    let bmi: number;
    if (unit === "metric") bmi = wt / Math.pow(ht / 100, 2);
    else bmi = (wt / Math.pow(ht, 2)) * 703;
    bmi = Math.round(bmi * 10) / 10;
    let cat = "Normal", color = "text-success";
    if (bmi < 18.5) { cat = "Underweight"; color = "text-warning-foreground"; }
    else if (bmi < 25) { cat = "Normal"; color = "text-success"; }
    else if (bmi < 30) { cat = "Overweight"; color = "text-warning-foreground"; }
    else { cat = "Obese"; color = "text-destructive"; }
    setResult({ bmi, cat, color });
  };

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold flex items-center gap-2"><Calculator className="size-7 text-primary" /> BMI Calculator</h1>
        <p className="text-muted-foreground">Quickly check your Body Mass Index.</p>
      </div>

      <Card className="p-6 shadow-card space-y-5">
        <div className="flex gap-2">
          <Button variant={unit === "metric" ? "default" : "outline"} size="sm" onClick={() => setUnit("metric")}>Metric</Button>
          <Button variant={unit === "imperial" ? "default" : "outline"} size="sm" onClick={() => setUnit("imperial")}>Imperial</Button>
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label>Height ({unit === "metric" ? "cm" : "in"})</Label>
            <Input type="number" value={h} onChange={(e) => setH(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Weight ({unit === "metric" ? "kg" : "lb"})</Label>
            <Input type="number" value={w} onChange={(e) => setW(e.target.value)} />
          </div>
        </div>
        <Button onClick={calc} className="w-full">Calculate BMI</Button>

        {result && (
          <div className="mt-4 p-6 rounded-xl gradient-soft border border-border text-center">
            <div className="text-sm text-muted-foreground">Your BMI</div>
            <div className="text-5xl font-bold mt-1">{result.bmi}</div>
            <div className={`mt-2 text-lg font-semibold ${result.color}`}>{result.cat}</div>
          </div>
        )}
      </Card>

      <Card className="p-6 text-sm space-y-1.5 shadow-card">
        <div className="font-semibold mb-2">BMI Categories</div>
        <div className="flex justify-between"><span>Underweight</span><span className="text-muted-foreground">&lt; 18.5</span></div>
        <div className="flex justify-between"><span>Normal</span><span className="text-muted-foreground">18.5 – 24.9</span></div>
        <div className="flex justify-between"><span>Overweight</span><span className="text-muted-foreground">25 – 29.9</span></div>
        <div className="flex justify-between"><span>Obese</span><span className="text-muted-foreground">≥ 30</span></div>
      </Card>
    </div>
  );
}
