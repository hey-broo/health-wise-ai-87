import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from "react";
import { usersStore, hashPassword, SESSION_KEY, type StoredUser } from "@/data/store";

type SessionUser = Omit<StoredUser, "passwordHash">;

interface AuthContextValue {
  user: SessionUser | null;
  loading: boolean;
  isAdmin: boolean;
  signIn: (email: string, password: string) => Promise<{ error?: string }>;
  signUp: (fullName: string, email: string, password: string) => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
  updateProfile: (patch: Partial<Pick<StoredUser, "fullName" | "age" | "gender">>) => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function strip(u: StoredUser): SessionUser {
  const { passwordHash, ...rest } = u;
  return rest;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const raw = typeof window !== "undefined" ? localStorage.getItem(SESSION_KEY) : null;
    if (raw) {
      try {
        const { userId } = JSON.parse(raw);
        const u = usersStore.findById(userId);
        if (u) setUser(strip(u));
      } catch { /* ignore */ }
    }
    setLoading(false);
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    const u = usersStore.findByEmail(email);
    if (!u) return { error: "Invalid email or password" };
    const hash = await hashPassword(password);
    if (hash !== u.passwordHash) return { error: "Invalid email or password" };
    localStorage.setItem(SESSION_KEY, JSON.stringify({ userId: u.id }));
    setUser(strip(u));
    return {};
  }, []);

  const signUp = useCallback(async (fullName: string, email: string, password: string) => {
    if (usersStore.findByEmail(email)) return { error: "Email already registered" };
    const passwordHash = await hashPassword(password);
    const u = usersStore.add({
      email, fullName, age: null, gender: "Other",
      passwordHash, role: "user",
    });
    localStorage.setItem(SESSION_KEY, JSON.stringify({ userId: u.id }));
    setUser(strip(u));
    return {};
  }, []);

  const signOut = useCallback(async () => {
    localStorage.removeItem(SESSION_KEY);
    setUser(null);
  }, []);

  const updateProfile = useCallback((patch: Partial<Pick<StoredUser, "fullName" | "age" | "gender">>) => {
    if (!user) return;
    usersStore.update(user.id, patch);
    const u = usersStore.findById(user.id);
    if (u) setUser(strip(u));
  }, [user]);

  return (
    <AuthContext.Provider value={{ user, loading, isAdmin: user?.role === "admin", signIn, signUp, signOut, updateProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
