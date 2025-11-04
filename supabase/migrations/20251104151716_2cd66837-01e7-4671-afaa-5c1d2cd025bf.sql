-- Fix security issues in profiles table RLS policies
-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;

-- Users can view their own profile
CREATE POLICY "Users can view own profile"
ON public.profiles
FOR SELECT
USING (auth.uid() = user_id);

-- Users can view veterinarian profiles they have consultations with
CREATE POLICY "Users can view vet profiles in consultations"
ON public.profiles
FOR SELECT
USING (
  role = 'veterinarian'::user_role
  AND EXISTS (
    SELECT 1 FROM public.consultations
    WHERE (consultations.vet_id = profiles.user_id OR consultations.status = 'pending'::consultation_status)
    AND (consultations.farmer_id = auth.uid() OR consultations.vet_id = auth.uid())
  )
);

-- Veterinarians can view farmer profiles they have consultations with
CREATE POLICY "Vets can view farmer profiles in consultations"
ON public.profiles
FOR SELECT
USING (
  role IN ('farmer'::user_role, 'pet_owner'::user_role)
  AND EXISTS (
    SELECT 1 FROM public.consultations
    WHERE consultations.farmer_id = profiles.user_id
    AND consultations.vet_id = auth.uid()
  )
);