-- Fix 1: Drop and recreate profile policies to restrict sensitive data exposure
-- Farmers should only see vet profiles for their OWN consultations
DROP POLICY IF EXISTS "Users can view vet profiles in consultations" ON profiles;
CREATE POLICY "Farmers can view vet profiles for their consultations"
ON profiles
FOR SELECT
USING (
  -- User viewing their own profile
  auth.uid() = id
  OR
  -- Farmer viewing vet profile for their assigned consultation
  EXISTS (
    SELECT 1 FROM consultations c
    WHERE c.farmer_id = auth.uid()
    AND c.vet_id = profiles.id
    AND c.status IN ('in_progress', 'completed')
  )
);

-- Vets should only see farmer profiles for consultations they've accepted
DROP POLICY IF EXISTS "Vets can view farmer profiles in consultations" ON profiles;
CREATE POLICY "Vets can view farmer profiles for their consultations"
ON profiles
FOR SELECT
USING (
  -- User viewing their own profile
  auth.uid() = id
  OR
  -- Vet viewing farmer profile for their assigned consultation
  EXISTS (
    SELECT 1 FROM consultations c
    WHERE c.vet_id = auth.uid()
    AND c.farmer_id = profiles.id
  )
);

-- Fix 2: Add missing policy for vets to accept pending consultations
CREATE POLICY "Vets can accept pending consultations"
ON consultations
FOR UPDATE
USING (
  status = 'pending'::consultation_status 
  AND vet_id IS NULL
  AND has_role(auth.uid(), 'veterinarian'::app_role)
)
WITH CHECK (
  vet_id = auth.uid()
  AND status IN ('in_progress'::consultation_status, 'pending'::consultation_status)
);