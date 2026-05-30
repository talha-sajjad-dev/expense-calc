-- Fix: creators could INSERT groups but not SELECT them back (not members yet).
-- Also adds a secure create_group RPC used by server actions.

create policy "Creators can read groups they created"
  on public.groups for select
  using (auth.uid() = created_by);

-- Ensure profile exists for auth users (handles signups before trigger existed)
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

  insert into public.profiles (id, full_name)
  select
    u.id,
    coalesce(u.raw_user_meta_data->>'full_name', split_part(u.email, '@', 1))
  from auth.users u
  where u.id = v_user_id
  on conflict (id) do nothing;
end;
$$;

grant execute on function public.ensure_profile() to authenticated;

-- Atomic group creation (bypasses RLS edge cases in server actions)
create or replace function public.create_group(p_name text)
returns public.groups
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_code text;
  v_group public.groups;
  v_attempt int;
begin
  if v_user_id is null then
    raise exception 'Not authenticated';
  end if;

  if length(trim(p_name)) < 2 then
    raise exception 'Group name must be at least 2 characters';
  end if;

  perform public.ensure_profile();

  for v_attempt in 1..10 loop
    v_code := public.generate_invite_code();
    begin
      insert into public.groups (name, invite_code, created_by)
      values (trim(p_name), v_code, v_user_id)
      returning * into v_group;
      exit;
    exception when unique_violation then
      continue;
    end;
  end loop;

  if v_group.id is null then
    raise exception 'Failed to create group';
  end if;

  insert into public.group_members (group_id, user_id)
  values (v_group.id, v_user_id)
  on conflict do nothing;

  return v_group;
end;
$$;

grant execute on function public.create_group(text) to authenticated;
