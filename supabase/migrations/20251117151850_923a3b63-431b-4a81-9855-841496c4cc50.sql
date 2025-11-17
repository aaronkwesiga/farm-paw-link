-- Create a security definer function to safely get user's current role
CREATE OR REPLACE FUNCTION public.get_user_role(_user_id uuid)
RETURNS user_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.profiles WHERE user_id = _user_id LIMIT 1;
$$;

-- Drop the existing update policy that allows unrestricted updates
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

-- Create new update policy that prevents role modification
-- Users can only update their profile if the role remains unchanged
CREATE POLICY "Users can update own profile" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid() = user_id)
WITH CHECK (
  auth.uid() = user_id 
  AND role = public.get_user_role(auth.uid())
);