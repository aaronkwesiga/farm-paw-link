-- Create user_roles table with proper security
create type public.app_role as enum ('admin', 'farmer', 'pet_owner', 'veterinarian');

create table public.user_roles (
    id uuid primary key default gen_random_uuid(),
    user_id uuid references auth.users(id) on delete cascade not null,
    role app_role not null,
    created_at timestamp with time zone not null default now(),
    unique (user_id, role)
);

-- Enable RLS
alter table public.user_roles enable row level security;

-- Create security definer function to check roles
create or replace function public.has_role(_user_id uuid, _role app_role)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.user_roles
    where user_id = _user_id
      and role = _role
  )
$$;

-- Policy to allow users to view their own roles
create policy "Users can view their own roles"
on public.user_roles
for select
to authenticated
using (auth.uid() = user_id);

-- Migrate existing role data from profiles to user_roles (text conversion)
insert into public.user_roles (user_id, role)
select 
  user_id, 
  case 
    when role::text = 'farmer' then 'farmer'::app_role
    when role::text = 'pet_owner' then 'pet_owner'::app_role
    when role::text = 'veterinarian' then 'veterinarian'::app_role
    else 'farmer'::app_role
  end as role
from public.profiles
on conflict (user_id, role) do nothing;

-- Update handle_new_user function to create user_roles entry
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = 'public'
as $$
declare
  user_role app_role;
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
  
  -- Insert profile
  insert into public.profiles (user_id, full_name)
  values (
    NEW.id,
    coalesce(NEW.raw_user_meta_data->>'full_name', 'New User')
  );
  
  -- Insert user role
  insert into public.user_roles (user_id, role)
  values (NEW.id, user_role);
  
  return NEW;
end;
$$;