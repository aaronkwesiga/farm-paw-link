-- Add location and availability columns to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS latitude DECIMAL(10, 8),
ADD COLUMN IF NOT EXISTS longitude DECIMAL(11, 8),
ADD COLUMN IF NOT EXISTS is_available BOOLEAN DEFAULT true;

-- Create vet_portfolios table
CREATE TABLE IF NOT EXISTS public.vet_portfolios (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  vet_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  category TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on vet_portfolios
ALTER TABLE public.vet_portfolios ENABLE ROW LEVEL SECURITY;

-- Vets can manage their own portfolio items
CREATE POLICY "Vets can view their own portfolio items"
ON public.vet_portfolios FOR SELECT
USING (auth.uid() = vet_id);

CREATE POLICY "Vets can create their own portfolio items"
ON public.vet_portfolios FOR INSERT
WITH CHECK (auth.uid() = vet_id AND has_role(auth.uid(), 'veterinarian'::app_role));

CREATE POLICY "Vets can update their own portfolio items"
ON public.vet_portfolios FOR UPDATE
USING (auth.uid() = vet_id);

CREATE POLICY "Vets can delete their own portfolio items"
ON public.vet_portfolios FOR DELETE
USING (auth.uid() = vet_id);

-- Public can view all vet portfolio items
CREATE POLICY "Public can view all vet portfolio items"
ON public.vet_portfolios FOR SELECT
USING (true);

-- Create updated_at trigger for vet_portfolios
CREATE TRIGGER update_vet_portfolios_updated_at
BEFORE UPDATE ON public.vet_portfolios
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create portfolio-images storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('portfolio-images', 'portfolio-images', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for portfolio images
CREATE POLICY "Portfolio images are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'portfolio-images');

CREATE POLICY "Vets can upload their own portfolio images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'portfolio-images' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Vets can update their own portfolio images"
ON storage.objects FOR UPDATE
USING (bucket_id = 'portfolio-images' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Vets can delete their own portfolio images"
ON storage.objects FOR DELETE
USING (bucket_id = 'portfolio-images' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Allow public to view basic vet profile info for the Find Vets feature
CREATE POLICY "Public can view vet profiles"
ON public.profiles FOR SELECT
USING (role = 'veterinarian'::user_role);