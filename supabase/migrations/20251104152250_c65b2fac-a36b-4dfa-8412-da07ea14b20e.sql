-- Remove the security definer view and simplify the approach
DROP VIEW IF EXISTS public.pending_consultations_summary;

-- The application layer will handle showing limited info for pending consultations
-- Keep the RLS policies as they are - they properly restrict access