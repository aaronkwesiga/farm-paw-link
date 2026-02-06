
-- Update handle_new_user() to prevent self-assignment of veterinarian role
-- Users selecting 'veterinarian' at registration will be assigned 'farmer' by default
-- An admin must manually upgrade them to veterinarian after verification
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
declare
  user_role app_role;
  profile_role user_role;
  requested_role text;
begin
  -- Get requested role from metadata
  requested_role := coalesce(NEW.raw_user_meta_data->>'role', 'farmer');

  -- Only allow safe roles to be self-assigned
  -- 'veterinarian' requires admin verification and cannot be self-assigned
  user_role := case requested_role
    when 'pet_owner' then 'pet_owner'::app_role
    when 'farmer' then 'farmer'::app_role
    else 'farmer'::app_role  -- Default to farmer for any unrecognized or restricted role
  end;
  
  -- Map app_role to user_role for profiles table
  profile_role := case requested_role
    when 'pet_owner' then 'pet_owner'::user_role
    when 'farmer' then 'farmer'::user_role
    else 'farmer'::user_role  -- Default to farmer for any unrecognized or restricted role
  end;
  
  -- Insert profile with validated role
  insert into public.profiles (user_id, full_name, role)
  values (
    NEW.id,
    coalesce(NEW.raw_user_meta_data->>'full_name', 'New User'),
    profile_role
  );
  
  -- Insert user role
  insert into public.user_roles (user_id, role)
  values (NEW.id, user_role);
  
  return NEW;
end;
$$;
