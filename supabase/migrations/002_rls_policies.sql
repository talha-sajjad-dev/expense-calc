alter table public.profiles enable row level security;
alter table public.groups enable row level security;
alter table public.group_members enable row level security;
alter table public.expenses enable row level security;
alter table public.expense_participants enable row level security;

-- Profiles
create policy "Users can read own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can read profiles in same groups"
  on public.profiles for select
  using (
    exists (
      select 1 from public.group_members gm1
      join public.group_members gm2 on gm1.group_id = gm2.group_id
      where gm1.user_id = auth.uid() and gm2.user_id = profiles.id
    )
  );

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Groups
create policy "Members can read their groups"
  on public.groups for select
  using (public.is_group_member(id));

create policy "Authenticated users can create groups"
  on public.groups for insert
  with check (auth.uid() = created_by);

-- Group members
create policy "Members can read group members"
  on public.group_members for select
  using (public.is_group_member(group_id));

create policy "Users can insert themselves when creating a group"
  on public.group_members for insert
  with check (auth.uid() = user_id);

-- Expenses
create policy "Members can read group expenses"
  on public.expenses for select
  using (public.is_group_member(group_id));

create policy "Members can create expenses"
  on public.expenses for insert
  with check (
    public.is_group_member(group_id)
    and auth.uid() = created_by
    and public.is_group_member(group_id, paid_by)
  );

create policy "Creators can update their expenses"
  on public.expenses for update
  using (auth.uid() = created_by and public.is_group_member(group_id))
  with check (
    auth.uid() = created_by
    and public.is_group_member(group_id)
    and public.is_group_member(group_id, paid_by)
  );

create policy "Creators can delete their expenses"
  on public.expenses for delete
  using (auth.uid() = created_by and public.is_group_member(group_id));

-- Expense participants
create policy "Members can read expense participants"
  on public.expense_participants for select
  using (
    exists (
      select 1 from public.expenses e
      where e.id = expense_id and public.is_group_member(e.group_id)
    )
  );

create policy "Expense creators can manage participants on insert"
  on public.expense_participants for insert
  with check (
    exists (
      select 1 from public.expenses e
      where e.id = expense_id
        and e.created_by = auth.uid()
        and public.is_group_member(e.group_id)
    )
  );

create policy "Expense creators can delete participants"
  on public.expense_participants for delete
  using (
    exists (
      select 1 from public.expenses e
      where e.id = expense_id
        and e.created_by = auth.uid()
        and public.is_group_member(e.group_id)
    )
  );

