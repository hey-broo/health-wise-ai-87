import { RequireAuth } from "@/components/RequireAuth";
import { useEffect, useState } from "react";
import { doctorsStore, medicinesStore, usersStore, reportsStore, type Doctor, type Medicine, type StoredUser, type StoredReport } from "@/data/store";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Shield, Users, Stethoscope, Pill, FileClock, Plus, Trash2, Pencil } from "lucide-react";
import { format } from "date-fns";

export default function AdminPage() {
  return <RequireAuth adminOnly><Admin /></RequireAuth>;
}

function Admin() {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [meds, setMeds] = useState<Medicine[]>([]);
  const [users, setUsers] = useState<StoredUser[]>([]);
  const [reports, setReports] = useState<StoredReport[]>([]);

  const load = () => {
    setDoctors(doctorsStore.list());
    setMeds(medicinesStore.list());
    setUsers(usersStore.list());
    setReports(reportsStore.list().slice(0, 20));
  };

  useEffect(() => { load(); }, []);

  const stats = { users: users.length, reports: reportsStore.list().length, doctors: doctors.length, meds: meds.length };

  return (
    <div className="max-w-6xl space-y-6">
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold flex items-center gap-2"><Shield className="size-7 text-primary" /> Admin Panel</h1>
        <p className="text-muted-foreground">Manage users, doctors, medicines, and reports.</p>
        <p className="text-xs text-muted-foreground mt-1">All data (users, doctors, medicines, reports) is stored in <code>src/data/*.json</code> as seed and mirrored to this browser's localStorage. Changes persist on this device only.</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Users", value: stats.users, icon: Users },
          { label: "Reports", value: stats.reports, icon: FileClock },
          { label: "Doctors", value: stats.doctors, icon: Stethoscope },
          { label: "Medicines", value: stats.meds, icon: Pill },
        ].map(({ label, value, icon: Icon }) => (
          <Card key={label} className="p-5 shadow-card">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-muted-foreground">{label}</div>
                <div className="text-2xl font-bold mt-1">{value}</div>
              </div>
              <Icon className="size-8 text-primary opacity-70" />
            </div>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="doctors">
        <TabsList>
          <TabsTrigger value="doctors">Doctors</TabsTrigger>
          <TabsTrigger value="meds">Medicines</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="reports">Recent reports</TabsTrigger>
        </TabsList>

        <TabsContent value="users">
          <Card className="p-4 shadow-card">
            <div className="space-y-2">
              {users.map((u) => (
                <div key={u.id} className="flex items-center justify-between p-3 rounded-lg border border-border">
                  <div>
                    <div className="font-medium">{u.fullName} <span className="text-xs text-muted-foreground">· {u.email}</span></div>
                    <div className="text-xs text-muted-foreground">role: {u.role} · joined {format(new Date(u.createdAt), "PP")}</div>
                  </div>
                </div>
              ))}
              {users.length === 0 && <p className="text-sm text-muted-foreground p-2">No users yet.</p>}
            </div>
          </Card>
        </TabsContent>


        <TabsContent value="doctors" className="space-y-3">
          <DoctorDialog onSaved={load} />
          <Card className="p-4 shadow-card">
            <div className="space-y-2">
              {doctors.map((d) => (
                <div key={d.id} className="flex items-center justify-between p-3 rounded-lg border border-border">
                  <div>
                    <div className="font-medium">{d.name}</div>
                    <div className="text-xs text-muted-foreground">{d.specialization} · {d.hospital} · {d.city}</div>
                    {(d.phone || d.email) && (
                      <div className="text-xs text-muted-foreground">{d.phone}{d.phone && d.email ? " · " : ""}{d.email}</div>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <DoctorDialog onSaved={load} existing={d} />
                    <Button variant="ghost" size="icon" onClick={() => {
                      if (!confirm("Delete?")) return;
                      doctorsStore.remove(d.id);
                      toast.success("Deleted"); load();
                    }}><Trash2 className="size-4 text-destructive" /></Button>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="meds" className="space-y-3">
          <MedDialog onSaved={load} />
          <Card className="p-4 shadow-card">
            <div className="space-y-2">
              {meds.map((m) => (
                <div key={m.id} className="flex items-center justify-between p-3 rounded-lg border border-border">
                  <div>
                    <div className="font-medium">{m.name} <span className="text-xs text-muted-foreground">· {m.condition_category}</span></div>
                    <div className="text-xs text-muted-foreground">{m.description} {m.dosage && `· ${m.dosage}`}</div>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => {
                    if (!confirm("Delete?")) return;
                    medicinesStore.remove(m.id);
                    toast.success("Deleted"); load();
                  }}><Trash2 className="size-4 text-destructive" /></Button>
                </div>
              ))}
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="reports">
          <Card className="p-4 shadow-card">
            <div className="space-y-2">
              {reports.map((r) => (
                <div key={r.id} className="p-3 rounded-lg border border-border">
                  <div className="font-medium truncate">{r.symptoms}</div>
                  <div className="text-xs text-muted-foreground">{r.specialist} · {format(new Date(r.created_at), "PPp")}</div>
                </div>
              ))}
              {reports.length === 0 && <p className="text-sm text-muted-foreground p-2">No reports yet.</p>}
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function DoctorDialog({ onSaved, existing }: { onSaved: () => void; existing?: Doctor }) {
  const [open, setOpen] = useState(false);
  const empty = { name: "", specialization: "", hospital: "", city: "", phone: "", email: "" };
  const [f, setF] = useState<any>(existing ?? empty);
  useEffect(() => { if (open) setF(existing ?? empty); }, [open]);
  const save = () => {
    if (!f.name || !f.specialization) return toast.error("Name & specialization required");
    const payload = { name: f.name, specialization: f.specialization, hospital: f.hospital, city: f.city, phone: f.phone, email: f.email };
    if (existing) doctorsStore.update(existing.id, payload);
    else doctorsStore.add(payload);
    toast.success(existing ? "Doctor updated" : "Doctor added");
    setOpen(false); onSaved();
  };
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {existing
          ? <Button variant="ghost" size="icon"><Pencil className="size-4" /></Button>
          : <Button size="sm" className="gap-1"><Plus className="size-4" /> Add doctor</Button>}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>{existing ? "Edit doctor" : "Add doctor"}</DialogTitle></DialogHeader>
        <div className="space-y-3">
          {[["name","Name"],["specialization","Specialization"],["hospital","Hospital"],["city","City"],["phone","Phone"],["email","Email"]].map(([k, lbl]) => (
            <div key={k} className="space-y-1"><Label>{lbl}</Label><Input value={(f as any)[k] ?? ""} onChange={(e) => setF({ ...f, [k]: e.target.value })} /></div>
          ))}
        </div>
        <DialogFooter><Button onClick={save}>Save</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function MedDialog({ onSaved }: { onSaved: () => void }) {
  const [open, setOpen] = useState(false);
  const [f, setF] = useState({ name: "", condition_category: "", description: "", dosage: "" });
  const save = () => {
    if (!f.name || !f.condition_category) return toast.error("Name & category required");
    medicinesStore.add(f);
    toast.success("Medicine added");
    setOpen(false); setF({ name: "", condition_category: "", description: "", dosage: "" }); onSaved();
  };
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button size="sm" className="gap-1"><Plus className="size-4" /> Add medicine</Button></DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Add medicine</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1"><Label>Name</Label><Input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></div>
          <div className="space-y-1"><Label>Condition category</Label><Input value={f.condition_category} onChange={(e) => setF({ ...f, condition_category: e.target.value })} /></div>
          <div className="space-y-1"><Label>Description</Label><Textarea value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} /></div>
          <div className="space-y-1"><Label>Dosage</Label><Input value={f.dosage} onChange={(e) => setF({ ...f, dosage: e.target.value })} /></div>
        </div>
        <DialogFooter><Button onClick={save}>Save</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
