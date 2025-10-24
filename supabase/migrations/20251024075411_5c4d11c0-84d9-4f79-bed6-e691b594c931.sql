-- Fix RLS policy to use user_roles table via has_role function
DROP POLICY IF EXISTS "Vets can view pending consultations" ON consultations;

CREATE POLICY "Vets can view pending consultations"
ON consultations
FOR SELECT
USING (
  status = 'pending'::consultation_status 
  AND has_role(auth.uid(), 'veterinarian'::app_role)
);

-- Sync profile roles with user_roles (handle enum type mismatch)
UPDATE profiles p
SET role = 
  CASE 
    WHEN ur.role = 'veterinarian'::app_role THEN 'veterinarian'::user_role
    WHEN ur.role = 'farmer'::app_role THEN 'farmer'::user_role
    WHEN ur.role = 'pet_owner'::app_role THEN 'pet_owner'::user_role
    ELSE p.role
  END
FROM user_roles ur
WHERE p.user_id = ur.user_id 
AND p.role::text != ur.role::text;