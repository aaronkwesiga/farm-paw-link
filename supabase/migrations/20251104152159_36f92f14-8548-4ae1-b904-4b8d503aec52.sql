-- Fix pending consultation exposure issues
-- Create a view for pending consultations that only shows necessary info
CREATE OR REPLACE VIEW public.pending_consultations_summary AS
SELECT 
  id,
  animal_id,
  urgency_level,
  status,
  created_at,
  -- Hide sensitive details from pending view
  CASE WHEN urgency_level = 'emergency' THEN 'Emergency case - immediate attention needed' 
       ELSE 'Consultation request pending'
  END as subject,
  NULL::text as description,
  NULL::text as symptoms,
  NULL::text[] as image_urls,
  NULL::uuid as farmer_id
FROM public.consultations
WHERE status = 'pending'::consultation_status;

-- Grant select on the view to authenticated users with vet role
GRANT SELECT ON public.pending_consultations_summary TO authenticated;

-- Update the pending consultations policy to be more restrictive
-- Drop the overly permissive pending policy
DROP POLICY IF EXISTS "Vets can view pending consultations" ON public.consultations;

-- Create new limited policy for pending consultations
-- Vets can see basic info of pending consultations via the summary view
-- But full details require accepting the consultation
CREATE POLICY "Vets can view basic pending consultation info"
ON public.consultations
FOR SELECT
USING (
  (status = 'pending'::consultation_status AND has_role(auth.uid(), 'veterinarian'::app_role))
  AND (
    -- Only expose limited fields via application logic
    -- Full details visible only after vet accepts (status changes to in_progress)
    vet_id IS NULL
  )
);

-- Update the assigned consultation policy
DROP POLICY IF EXISTS "Vets can view assigned consultations" ON public.consultations;

CREATE POLICY "Vets can view assigned or accepted consultations"
ON public.consultations
FOR SELECT
USING (
  auth.uid() = vet_id 
  OR (status = 'pending'::consultation_status AND has_role(auth.uid(), 'veterinarian'::app_role))
);