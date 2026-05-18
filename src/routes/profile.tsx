import { RequireAuth } from "@/components/RequireAuth";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { UserCircle } from "lucide-react";

export default function ProfilePage() {
  return <RequireAuth><Profile /></RequireAuth>;
}

function Profile() {
  const { user, isAdmin, updateProfile } = useAuth();
  const [fullName, setFullName] = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState("Male");

  useEffect(() => {
    if (!user) return;
    setFullName(user.fullName ?? "");
    setAge(user.age ? String(user.age) : "");
    setGender(user.gender ?? "Male");
  }, [user]);

  const save = () => {
    updateProfile({ fullName, age: age ? Number(age) : null, gender });
    toast.success("Profile saved");
  };

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold flex items-center gap-2"><UserCircle className="size-7 text-primary" /> Profile</h1>
        <p className="text-muted-foreground">Manage your personal details.</p>
      </div>

      <Card className="p-6 shadow-card space-y-4">
        <div className="space-y-1.5">
          <Label>Email</Label>
          <Input value={user?.email ?? ""} disabled />
        </div>
        <div className="space-y-1.5">
          <Label>Full name</Label>
          <Input value={fullName} onChange={(e) => setFullName(e.target.value)} />
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label>Age</Label>
            <Input type="number" value={age} onChange={(e) => setAge(e.target.value)} />
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
        </div>
        <Button onClick={save} className="w-full">Save changes</Button>
        {isAdmin && <div className="text-xs text-success font-medium">★ Admin account</div>}
      </Card>
    </div>
  );
}
