-- Update the handle_new_user trigger to also set the role in profiles table
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
declare
  user_role app_role;
  profile_role user_role;
begin
  -- Get role from metadata, default to farmer
  user_role := coalesce(
    case NEW.raw_user_meta_data->>'role'
      when 'veterinarian' then 'veterinarian'::app_role
      when 'pet_owner' then 'pet_owner'::app_role
      when 'farmer' then 'farmer'::app_role
      else 'farmer'::app_role
    end,
    'farmer'::app_role
  );
  
  -- Map app_role to user_role for profiles table
  profile_role := coalesce(
    case NEW.raw_user_meta_data->>'role'
      when 'veterinarian' then 'veterinarian'::user_role
      when 'pet_owner' then 'pet_owner'::user_role
      when 'farmer' then 'farmer'::user_role
      else 'farmer'::user_role
    end,
    'farmer'::user_role
  );
  
  -- Insert profile with correct role
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
$function$;