// Local JSON-backed data store for everything: users, doctors, medicines, reports.
// Seed data lives in src/data/*.json (read-only at runtime).
// All runtime changes are mirrored to localStorage on the user's browser,
// because both browsers and Vercel's filesystem cannot write to .json files.
import doctorsSeed from "./doctors.json";
import medicinesSeed from "./medicines.json";
import usersSeed from "./users.json";
import reportsSeed from "./reports.json";

export type Doctor = {
  id: string;
  name: string;
  specialization: string;
  hospital?: string;
  city?: string;
  phone?: string;
  email?: string;
};

export type Medicine = {
  id: string;
  name: string;
  condition_category: string;
  description?: string;
  dosage?: string;
};

export type StoredUser = {
  id: string;
  email: string;
  fullName: string;
  age: number | null;
  gender: string;
  passwordHash: string;
  role: "admin" | "user";
  createdAt: string;
};

export type StoredReport = {
  id: string;
  user_id: string;
  symptoms: string;
  age: number | null;
  gender: string;
  duration: string;
  severity: string;
  conditions: any;
  precautions: any;
  specialist: string;
  medicines: any;
  advice: string;
  created_at: string;
};

const DOCTORS_KEY = "medisense.doctors.v1";
const MEDS_KEY = "medisense.medicines.v1";
const USERS_KEY = "medisense.users.v1";
const REPORTS_KEY = "medisense.reports.v1";
export const SESSION_KEY = "medisense.session.v1";

function read<T>(key: string, seed: T[]): T[] {
  if (typeof window === "undefined") return seed;
  const raw = localStorage.getItem(key);
  if (!raw) return seed;
  try { return JSON.parse(raw) as T[]; } catch { return seed; }
}

function write<T>(key: string, value: T[]) {
  if (typeof window !== "undefined") localStorage.setItem(key, JSON.stringify(value));
}

const uid = () => (crypto?.randomUUID?.() ?? Math.random().toString(36).slice(2));

export async function hashPassword(pw: string): Promise<string> {
  const bytes = new TextEncoder().encode(pw);
  const buf = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, "0")).join("");
}

export const doctorsStore = {
  list: (): Doctor[] => read<Doctor>(DOCTORS_KEY, doctorsSeed as Doctor[]),
  add: (d: Omit<Doctor, "id">): Doctor => {
    const list = doctorsStore.list();
    const next: Doctor = { ...d, id: uid() };
    write(DOCTORS_KEY, [next, ...list]);
    return next;
  },
  update: (id: string, patch: Partial<Doctor>): void => {
    write(DOCTORS_KEY, doctorsStore.list().map(d => d.id === id ? { ...d, ...patch } : d));
  },
  remove: (id: string): void => {
    write(DOCTORS_KEY, doctorsStore.list().filter(d => d.id !== id));
  },
};

export const medicinesStore = {
  list: (): Medicine[] => read<Medicine>(MEDS_KEY, medicinesSeed as Medicine[]),
  add: (m: Omit<Medicine, "id">): Medicine => {
    const list = medicinesStore.list();
    const next: Medicine = { ...m, id: uid() };
    write(MEDS_KEY, [next, ...list]);
    return next;
  },
  update: (id: string, patch: Partial<Medicine>): void => {
    write(MEDS_KEY, medicinesStore.list().map(m => m.id === id ? { ...m, ...patch } : m));
  },
  remove: (id: string): void => {
    write(MEDS_KEY, medicinesStore.list().filter(m => m.id !== id));
  },
};

export const usersStore = {
  list: (): StoredUser[] => read<StoredUser>(USERS_KEY, usersSeed as StoredUser[]),
  findByEmail: (email: string) =>
    usersStore.list().find(u => u.email.toLowerCase() === email.toLowerCase()),
  findById: (id: string) => usersStore.list().find(u => u.id === id),
  add: (u: Omit<StoredUser, "id" | "createdAt">): StoredUser => {
    const list = usersStore.list();
    const next: StoredUser = { ...u, id: uid(), createdAt: new Date().toISOString() };
    write(USERS_KEY, [next, ...list]);
    return next;
  },
  update: (id: string, patch: Partial<StoredUser>): void => {
    write(USERS_KEY, usersStore.list().map(u => u.id === id ? { ...u, ...patch } : u));
  },
};

export const reportsStore = {
  list: (): StoredReport[] => read<StoredReport>(REPORTS_KEY, reportsSeed as StoredReport[]),
  listByUser: (userId: string) =>
    reportsStore.list().filter(r => r.user_id === userId)
      .sort((a, b) => b.created_at.localeCompare(a.created_at)),
  findById: (id: string) => reportsStore.list().find(r => r.id === id),
  add: (r: Omit<StoredReport, "id" | "created_at">): StoredReport => {
    const next: StoredReport = { ...r, id: uid(), created_at: new Date().toISOString() };
    write(REPORTS_KEY, [next, ...reportsStore.list()]);
    return next;
  },
  remove: (id: string): void => {
    write(REPORTS_KEY, reportsStore.list().filter(r => r.id !== id));
  },
};
