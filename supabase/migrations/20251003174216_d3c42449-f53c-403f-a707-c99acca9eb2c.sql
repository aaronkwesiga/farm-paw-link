-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create enum for user roles
CREATE TYPE public.user_role AS ENUM ('farmer', 'pet_owner', 'veterinarian', 'admin');

-- Create enum for consultation status
CREATE TYPE public.consultation_status AS ENUM ('pending', 'in_progress', 'completed', 'cancelled');

-- Create enum for animal types
CREATE TYPE public.animal_type AS ENUM ('poultry', 'cattle', 'goat', 'sheep', 'pig', 'dog', 'cat', 'other');

-- Create user profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  phone_number TEXT,
  location TEXT,
  role user_role NOT NULL DEFAULT 'farmer',
  bio TEXT,
  specialization TEXT, -- For veterinarians
  license_number TEXT, -- For veterinarians
  profile_image_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create animals table
CREATE TABLE public.animals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id UUID NOT NULL,
  name TEXT,
  animal_type animal_type NOT NULL,
  breed TEXT,
  age_years INTEGER,
  age_months INTEGER,
  weight_kg NUMERIC(10, 2),
  medical_history TEXT,
  vaccination_records TEXT,
  image_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create consultations table
CREATE TABLE public.consultations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  farmer_id UUID NOT NULL,
  vet_id UUID,
  animal_id UUID NOT NULL,
  subject TEXT NOT NULL,
  description TEXT NOT NULL,
  symptoms TEXT,
  urgency_level TEXT NOT NULL CHECK (urgency_level IN ('low', 'medium', 'high', 'emergency')),
  status consultation_status NOT NULL DEFAULT 'pending',
  diagnosis TEXT,
  treatment_plan TEXT,
  follow_up_notes TEXT,
  image_urls TEXT[], -- Array of image URLs
  scheduled_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create consultation messages table for real-time chat
CREATE TABLE public.consultation_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  consultation_id UUID NOT NULL,
  sender_id UUID NOT NULL,
  message TEXT NOT NULL,
  attachment_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create storage bucket for animal and consultation images
INSERT INTO storage.buckets (id, name, public) 
VALUES ('animal-images', 'animal-images', true);

INSERT INTO storage.buckets (id, name, public) 
VALUES ('consultation-images', 'consultation-images', true);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.animals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consultations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consultation_messages ENABLE ROW LEVEL SECURITY;

-- Profiles RLS Policies
CREATE POLICY "Users can view all profiles"
  ON public.profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Animals RLS Policies
CREATE POLICY "Users can view their own animals"
  ON public.animals FOR SELECT
  USING (auth.uid() = owner_id);

CREATE POLICY "Vets can view animals in their consultations"
  ON public.animals FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.consultations c
      INNER JOIN public.profiles p ON p.user_id = auth.uid()
      WHERE c.animal_id = animals.id 
      AND c.vet_id = auth.uid()
      AND p.role = 'veterinarian'
    )
  );

CREATE POLICY "Users can create their own animals"
  ON public.animals FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can update their own animals"
  ON public.animals FOR UPDATE
  USING (auth.uid() = owner_id);

CREATE POLICY "Users can delete their own animals"
  ON public.animals FOR DELETE
  USING (auth.uid() = owner_id);

-- Consultations RLS Policies
CREATE POLICY "Farmers can view their own consultations"
  ON public.consultations FOR SELECT
  USING (auth.uid() = farmer_id);

CREATE POLICY "Vets can view assigned consultations"
  ON public.consultations FOR SELECT
  USING (auth.uid() = vet_id);

CREATE POLICY "Vets can view pending consultations"
  ON public.consultations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.role = 'veterinarian'
    )
    AND status = 'pending'
  );

CREATE POLICY "Farmers can create consultations"
  ON public.consultations FOR INSERT
  WITH CHECK (auth.uid() = farmer_id);

CREATE POLICY "Farmers can update their own consultations"
  ON public.consultations FOR UPDATE
  USING (auth.uid() = farmer_id);

CREATE POLICY "Vets can update assigned consultations"
  ON public.consultations FOR UPDATE
  USING (auth.uid() = vet_id);

-- Consultation Messages RLS Policies
CREATE POLICY "Users can view messages in their consultations"
  ON public.consultation_messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.consultations c
      WHERE c.id = consultation_messages.consultation_id
      AND (c.farmer_id = auth.uid() OR c.vet_id = auth.uid())
    )
  );

CREATE POLICY "Users can create messages in their consultations"
  ON public.consultation_messages FOR INSERT
  WITH CHECK (
    auth.uid() = sender_id AND
    EXISTS (
      SELECT 1 FROM public.consultations c
      WHERE c.id = consultation_messages.consultation_id
      AND (c.farmer_id = auth.uid() OR c.vet_id = auth.uid())
    )
  );

-- Storage RLS Policies for animal images
CREATE POLICY "Anyone can view animal images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'animal-images');

CREATE POLICY "Users can upload their own animal images"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'animal-images' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can update their own animal images"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'animal-images' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete their own animal images"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'animal-images' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Storage RLS Policies for consultation images
CREATE POLICY "Users can view consultation images in their consultations"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'consultation-images' AND
    EXISTS (
      SELECT 1 FROM public.consultations c
      WHERE (c.farmer_id = auth.uid() OR c.vet_id = auth.uid())
    )
  );

CREATE POLICY "Users can upload consultation images"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'consultation-images' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_animals_updated_at
  BEFORE UPDATE ON public.animals
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_consultations_updated_at
  BEFORE UPDATE ON public.consultations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'New User'),
    COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'farmer')
  );
  RETURN NEW;
END;
$$;

-- Create trigger for new user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Enable realtime for consultations and messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.consultations;
ALTER PUBLICATION supabase_realtime ADD TABLE public.consultation_messages;