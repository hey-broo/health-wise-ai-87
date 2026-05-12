
-- Roles
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  email TEXT,
  age INT,
  gender TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  UNIQUE(user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role) $$;

CREATE TABLE public.doctors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  specialization TEXT NOT NULL,
  hospital TEXT,
  city TEXT,
  phone TEXT,
  email TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.doctors ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.medicines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  condition_category TEXT NOT NULL,
  description TEXT,
  dosage TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.medicines ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.symptom_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  symptoms TEXT NOT NULL,
  age INT,
  gender TEXT,
  duration TEXT,
  severity TEXT,
  conditions JSONB,
  precautions JSONB,
  specialist TEXT,
  medicines JSONB,
  advice TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.symptom_reports ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.admin_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  target TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.admin_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "users view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "users update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "users insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "admins manage profiles" ON public.profiles FOR ALL USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "users view own roles" ON public.user_roles FOR SELECT USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "admins manage roles" ON public.user_roles FOR ALL USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "anyone authed view doctors" ON public.doctors FOR SELECT TO authenticated USING (true);
CREATE POLICY "admins manage doctors" ON public.doctors FOR ALL USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "anyone authed view medicines" ON public.medicines FOR SELECT TO authenticated USING (true);
CREATE POLICY "admins manage medicines" ON public.medicines FOR ALL USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "users view own reports" ON public.symptom_reports FOR SELECT USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "users insert own reports" ON public.symptom_reports FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "users delete own reports" ON public.symptom_reports FOR DELETE USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "admins manage reports" ON public.symptom_reports FOR ALL USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "admins view logs" ON public.admin_logs FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "admins insert logs" ON public.admin_logs FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Auto-create profile + default user role on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'full_name', ''));
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'user');
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Seed doctors
INSERT INTO public.doctors (name, specialization, hospital, city, phone, email) VALUES
('Dr. Sarah Chen', 'General Physician', 'City Medical Center', 'New York', '+1-555-0101', 'sarah.chen@citymed.com'),
('Dr. James Patel', 'Cardiologist', 'Heart Care Institute', 'Boston', '+1-555-0102', 'j.patel@heartcare.com'),
('Dr. Maria Garcia', 'Dermatologist', 'Skin Health Clinic', 'Los Angeles', '+1-555-0103', 'm.garcia@skinhealth.com'),
('Dr. Ahmed Khan', 'Neurologist', 'Brain & Spine Hospital', 'Chicago', '+1-555-0104', 'a.khan@brainspine.com'),
('Dr. Emily Wong', 'Pulmonologist', 'Respiratory Center', 'Seattle', '+1-555-0105', 'e.wong@respcenter.com'),
('Dr. David Singh', 'Gastroenterologist', 'Digestive Health Clinic', 'Houston', '+1-555-0106', 'd.singh@digestive.com'),
('Dr. Lisa Brown', 'ENT Specialist', 'ENT Wellness', 'Miami', '+1-555-0107', 'l.brown@entwell.com'),
('Dr. Robert Kim', 'Orthopedic', 'Bone & Joint Center', 'Denver', '+1-555-0108', 'r.kim@boneandjoint.com');

-- Seed medicines (informational only)
INSERT INTO public.medicines (name, condition_category, description, dosage) VALUES
('Paracetamol', 'Fever / Pain', 'Common pain reliever and fever reducer', '500mg every 6 hours'),
('Ibuprofen', 'Pain / Inflammation', 'NSAID for pain and inflammation', '200-400mg every 6-8 hours'),
('Loratadine', 'Allergy', 'Antihistamine for allergies', '10mg once daily'),
('Cetirizine', 'Allergy', 'Antihistamine for allergic reactions', '10mg once daily'),
('Omeprazole', 'Acid Reflux / Stomach', 'Reduces stomach acid', '20mg once daily before breakfast'),
('Loperamide', 'Diarrhea', 'Anti-diarrheal', '2mg after each loose stool'),
('Dextromethorphan', 'Cough', 'Cough suppressant', '10-20mg every 4 hours'),
('Guaifenesin', 'Cough / Congestion', 'Expectorant for chest congestion', '200-400mg every 4 hours'),
('Diphenhydramine', 'Allergy / Sleep', 'Antihistamine, may cause drowsiness', '25-50mg every 4-6 hours'),
('ORS Solution', 'Dehydration', 'Oral rehydration salts', 'As needed for hydration');
