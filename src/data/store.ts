// Local JSON-backed data store for doctors & medicines.
// Seed data lives in src/data/*.json and is loaded on first run.
// Runtime edits are persisted to localStorage (browsers cannot write to disk).
import doctorsSeed from "./doctors.json";
import medicinesSeed from "./medicines.json";

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

const DOCTORS_KEY = "medisense.doctors.v1";
const MEDS_KEY = "medisense.medicines.v1";

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

export const doctorsStore = {
  list: (): Doctor[] => read<Doctor>(DOCTORS_KEY, doctorsSeed as Doctor[]),
  add: (d: Omit<Doctor, "id">): Doctor => {
    const list = doctorsStore.list();
    const next: Doctor = { ...d, id: uid() };
    write(DOCTORS_KEY, [next, ...list]);
    return next;
  },
  update: (id: string, patch: Partial<Doctor>): void => {
    const list = doctorsStore.list().map((d) => (d.id === id ? { ...d, ...patch } : d));
    write(DOCTORS_KEY, list);
  },
  remove: (id: string): void => {
    write(DOCTORS_KEY, doctorsStore.list().filter((d) => d.id !== id));
  },
  reset: () => write(DOCTORS_KEY, doctorsSeed as Doctor[]),
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
    const list = medicinesStore.list().map((m) => (m.id === id ? { ...m, ...patch } : m));
    write(MEDS_KEY, list);
  },
  remove: (id: string): void => {
    write(MEDS_KEY, medicinesStore.list().filter((m) => m.id !== id));
  },
  reset: () => write(MEDS_KEY, medicinesSeed as Medicine[]),
};
