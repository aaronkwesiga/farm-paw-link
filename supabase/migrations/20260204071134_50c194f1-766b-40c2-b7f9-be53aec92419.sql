-- Fix: Veterinarian Contact Information Exposed to Public Internet
-- The current policy exposes phone_number and license_number publicly
-- Solution: Create a view with only public fields and update the policy

-- Drop the existing overly permissive policy
DROP POLICY IF EXISTS "Public can view vet profiles" ON public.profiles;

-- Create a new more restrictive policy that still allows public viewing
-- but only exposes non-sensitive fields by requiring auth for sensitive data
-- For unauthenticated users: they can see basic vet info but not phone/license
-- For authenticated users: they can see phone/license only if they have an active consultation

-- Policy 1: Allow everyone to see basic vet profile info (no sensitive data access via RLS)
-- Note: The actual field restriction will be enforced in the application layer
-- We'll create a function to return safe vet data for public access

-- Create a secure function to get public vet profiles (without sensitive data)
CREATE OR REPLACE FUNCTION public.get_public_vet_profiles()
RETURNS TABLE (
  id uuid,
  user_id uuid,
  full_name text,
  location text,
  bio text,
  specialization text,
  profile_image_url text,
  latitude numeric,
  longitude numeric,
  is_available boolean
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    id,
    user_id,
    full_name,
    location,
    bio,
    specialization,
    profile_image_url,
    latitude,
    longitude,
    is_available
  FROM public.profiles
  WHERE role = 'veterinarian';
$$;

-- Grant execute permission to anonymous users
GRANT EXECUTE ON FUNCTION public.get_public_vet_profiles() TO anon;
GRANT EXECUTE ON FUNCTION public.get_public_vet_profiles() TO authenticated;

-- Create policy for authenticated users who have consultations with vets
-- This allows them to see full vet profiles including phone numbers
CREATE POLICY "Authenticated users with consultations can view full vet profile"
ON public.profiles
FOR SELECT
USING (
  role = 'veterinarian'
  AND EXISTS (
    SELECT 1 FROM consultations c
    WHERE c.vet_id = profiles.user_id
    AND c.farmer_id = auth.uid()
    AND c.status IN ('in_progress', 'completed')
  )
);

-- Create policy for vets to view their own full profile
CREATE POLICY "Vets can view their own full profile"
ON public.profiles
FOR SELECT
USING (
  role = 'veterinarian'
  AND auth.uid() = user_id
);