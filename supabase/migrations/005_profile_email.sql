-- Store email on profiles so notifications don't depend on auth.admin per user.

alter table public.profiles add column if not exists email text;

-- Backfill existing profiles from auth.users
update public.profiles p
set email = u.email
from auth.users u
where p.id = u.id and p.email is null;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    new.email
  );
  return new;
end;
$$;

create or replace function public.ensure_profile()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
begin
  if v_user_id is null then
    raise exception 'Not authenticated';
  end if;

  insert into public.profiles (id, full_name, email)
  select
    u.id,
    coalesce(u.raw_user_meta_data->>'full_name', split_part(u.email, '@', 1)),
    u.email
  from auth.users u
  where u.id = v_user_id
  on conflict (id) do update set
    email = coalesce(excluded.email, public.profiles.email),
    full_name = case
      when public.profiles.full_name = split_part(public.profiles.email, '@', 1)
        or public.profiles.full_name = ''
      then excluded.full_name
      else public.profiles.full_name
    end;
end;
$$;
