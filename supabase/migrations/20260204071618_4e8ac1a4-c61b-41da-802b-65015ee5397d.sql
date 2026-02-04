-- Fix: User roles table lacks write protection
-- Add explicit deny policies for INSERT, UPDATE, DELETE operations
-- Roles should only be managed via the handle_new_user trigger during signup

-- Policy to prevent direct role insertion (roles are created via trigger)
CREATE POLICY "Only system can insert roles"
ON public.user_roles
FOR INSERT
WITH CHECK (false);

-- Policy to prevent role updates (roles should be immutable via direct access)
CREATE POLICY "Roles cannot be updated directly"
ON public.user_roles
FOR UPDATE
USING (false);

-- Policy to prevent role deletion (protect against privilege manipulation)
CREATE POLICY "Roles cannot be deleted directly"
ON public.user_roles
FOR DELETE
USING (false);