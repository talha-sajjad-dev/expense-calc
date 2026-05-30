-- Seed data for SplitFlat demo
-- Run AFTER migrations and AFTER creating two auth users in Supabase Dashboard.
--
-- Step 1: Create users in Authentication → Users:
--   talha@example.com / password123  (metadata: {"full_name": "Talha"})
--   ahmed@example.com / password123  (metadata: {"full_name": "Ahmed"})
--
-- Step 2: Replace the UUIDs below with the actual user IDs from auth.users
-- Step 3: Run this script in SQL Editor

-- ▼▼▼ REPLACE THESE UUIDs ▼▼▼
-- \set talha_id '00000000-0000-0000-0000-000000000001'
-- \set ahmed_id '00000000-0000-0000-0000-000000000002'

-- Example using variables (paste your IDs):
DO $$
DECLARE
  talha_id uuid := 'REPLACE-TALHA-USER-ID';
  ahmed_id uuid := 'REPLACE-AHMED-USER-ID';
  group_id uuid;
  exp_rent uuid;
  exp_groc uuid;
  exp_util uuid;
  exp_net uuid;
BEGIN
  -- Ensure profiles exist (trigger should have created them)
  INSERT INTO public.profiles (id, full_name)
  VALUES
    (talha_id, 'Talha'),
    (ahmed_id, 'Ahmed')
  ON CONFLICT (id) DO UPDATE SET full_name = EXCLUDED.full_name;

  INSERT INTO public.groups (name, invite_code, created_by)
  VALUES ('Flat Expenses', 'FLAT2024', talha_id)
  RETURNING id INTO group_id;

  INSERT INTO public.group_members (group_id, user_id)
  VALUES
    (group_id, talha_id),
    (group_id, ahmed_id);

  -- Talha paid rent Rs. 10,000
  INSERT INTO public.expenses (
    group_id, paid_by, title, category, amount_minor, expense_date, created_by
  ) VALUES (
    group_id, talha_id, 'Monthly Rent', 'Rent', 1000000,
    date_trunc('month', current_date)::date, talha_id
  ) RETURNING id INTO exp_rent;

  INSERT INTO public.expense_participants (expense_id, user_id)
  VALUES (exp_rent, talha_id), (exp_rent, ahmed_id);

  -- Ahmed paid groceries Rs. 6,000
  INSERT INTO public.expenses (
    group_id, paid_by, title, category, amount_minor, expense_date, created_by
  ) VALUES (
    group_id, ahmed_id, 'Weekly Groceries', 'Groceries', 600000,
    (date_trunc('month', current_date) + interval '5 days')::date, ahmed_id
  ) RETURNING id INTO exp_groc;

  INSERT INTO public.expense_participants (expense_id, user_id)
  VALUES (exp_groc, talha_id), (exp_groc, ahmed_id);

  -- Talha paid utilities Rs. 4,000
  INSERT INTO public.expenses (
    group_id, paid_by, title, notes, category, amount_minor, expense_date, created_by
  ) VALUES (
    group_id, talha_id, 'Electricity Bill', 'K-Electric', 'Utilities', 400000,
    (date_trunc('month', current_date) + interval '10 days')::date, talha_id
  ) RETURNING id INTO exp_util;

  INSERT INTO public.expense_participants (expense_id, user_id)
  VALUES (exp_util, talha_id), (exp_util, ahmed_id);

  -- Ahmed paid internet Rs. 3,000
  INSERT INTO public.expenses (
    group_id, paid_by, title, category, amount_minor, expense_date, created_by
  ) VALUES (
    group_id, ahmed_id, 'Internet Package', 'Internet', 300000,
    (date_trunc('month', current_date) + interval '12 days')::date, ahmed_id
  ) RETURNING id INTO exp_net;

  INSERT INTO public.expense_participants (expense_id, user_id)
  VALUES (exp_net, talha_id), (exp_net, ahmed_id);

  RAISE NOTICE 'Seed complete. Group ID: %, Invite code: FLAT2024', group_id;
  RAISE NOTICE 'Expected settlement: Ahmed pays Talha Rs. 2,500';
END $$;
