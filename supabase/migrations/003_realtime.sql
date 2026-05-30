-- Enable Realtime for collaborative tables
alter publication supabase_realtime add table public.expenses;
alter publication supabase_realtime add table public.expense_participants;
alter publication supabase_realtime add table public.group_members;
