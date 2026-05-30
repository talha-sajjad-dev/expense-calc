# SplitFlat — Shared Expense Tracker

A production-ready MVP for roommates to track shared household expenses. Built with Next.js, Supabase, and Tailwind CSS. Deployable to Vercel.

## Features

- Email/password authentication (Supabase Auth)
- Create and join expense groups via invite code or link
- Full expense CRUD with categories, participants, and PKR amounts
- Net-balance settlement algorithm with simplified transfers
- Monthly dashboard with summaries, category breakdown, and member balances
- Real-time updates via Supabase Realtime
- Row Level Security on all tables
- Responsive UI with sidebar (desktop) and bottom navigation (mobile)

## Tech Stack

- **Frontend:** Next.js 16 (App Router), TypeScript, Tailwind CSS v4, shadcn/ui, Lucide icons
- **Forms:** React Hook Form + Zod
- **Backend:** Supabase (Postgres, Auth, Realtime, RLS)
- **Hosting:** Vercel

## Prerequisites

- Node.js 20+
- A [Supabase](https://supabase.com) project
- A [Vercel](https://vercel.com) account (for deployment)

## Quick start checklist

Follow these steps in order — skipping one often causes auth or RLS errors.

### 1. Supabase project

1. Create a project at [supabase.com](https://supabase.com).
2. **Settings → API** — copy **Project URL** and **anon public** key (same project).
3. **Settings → Database** — copy the **URI** connection string (for migrations).

### 2. Local `.env`

```bash
cp .env.example .env
```

```env
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_REF.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...your_anon_key
SUPABASE_DB_URL=postgresql://postgres:PASSWORD@db.YOUR_REF.supabase.co:5432/postgres
```

Run `npm run db:validate-env` — all three must show the **same project ref**.

### 3. Run migrations

```bash
npm run db:migrate
```

This applies only **pending** migrations (tracked in `supabase/.migrations_applied.json`).

If `psql` is unavailable, paste each file from `supabase/migrations/` into the Supabase SQL Editor in order.

### 4. Auth settings (Supabase Dashboard)

- **Authentication → Providers → Email** — enabled.
- For local dev: disable **Confirm email** (optional).
- After deploy: add your site URL under **Authentication → URL Configuration**.

### 5. Run the app

```bash
npm install
npm run dev
```

Open http://localhost:3000

### 6. First-time user flow

1. **Sign up** at `/signup` (creates auth user + profile).
2. Go to **Groups** → create a group (e.g. "Flat Expenses").
3. Copy the invite code — second user joins at `/dashboard/groups`.
4. Add expenses from either browser.

### Troubleshooting

| Error | Fix |
|-------|-----|
| Invalid API key | Anon key must match the project URL — run `npm run db:validate-env` |
| RLS policy on `groups` | Run `npm run db:migrate` (migration `004` adds `create_group` RPC) |
| Empty dashboard | Create or join a group first |
| Realtime not updating | Enable replication for `expenses`, `expense_participants`, `group_members` |
| **Email rate limit exceeded** | Supabase caps auth emails on free tier. **Fix for dev:** Dashboard → **Authentication → Providers → Email** → turn off **Confirm email**. Or wait ~1 hour, or create users manually under **Authentication → Users → Add user**. |


1. Create two users in **Authentication → Users**:
   - `talha@example.com` / `password123` — user metadata: `{"full_name": "Talha"}`
   - `ahmed@example.com` / `password123` — user metadata: `{"full_name": "Ahmed"}`
2. Copy their UUIDs from the users table.
3. Edit `supabase/seed.sql`, replace `REPLACE-TALHA-USER-ID` and `REPLACE-AHMED-USER-ID`.
4. Run the script in the SQL Editor.

Expected result: Ahmed owes Talha **Rs. 2,500** for the current month (see seed comments for expense breakdown).

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Production build |
| `npm run start` | Start production server |
| `npm run lint` | ESLint |
| `npm test` | Run balance algorithm unit tests |

## Deploy to Vercel

1. Push the repository to GitHub.
2. Import the project in [Vercel](https://vercel.com/new).
3. Add environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Deploy.

In Supabase → **Authentication → URL Configuration**, add your Vercel URL:

- **Site URL:** `https://your-app.vercel.app`
- **Redirect URLs:** `https://your-app.vercel.app/auth/callback`

## Testing with two users

1. Sign up as User A in Chrome.
2. Create a group and copy the invite code.
3. Open an incognito window, sign up as User B, join with the code.
4. Add expenses from each browser — the other should update within seconds without refresh.

## Manual QA Checklist

- [ ] Sign up creates profile automatically
- [ ] Login / logout works; dashboard is protected
- [ ] Create group generates unique invite code
- [ ] Second user joins with invite code
- [ ] Add expense with all members pre-selected
- [ ] Exclude a member from an expense — balances update correctly
- [ ] Edit and delete own expenses (with confirmation)
- [ ] Cannot see another group’s data by changing IDs in requests
- [ ] Month filter changes dashboard totals
- [ ] Expense list filters: category, search, sort
- [ ] Settlement card shows correct payer/recipient in PKR
- [ ] Realtime: expense added in tab A appears in tab B
- [ ] Mobile layout: bottom nav and add button work
- [ ] Production build succeeds (`npm run build`)

## Project Structure

```
src/
  app/              # Routes (landing, auth, dashboard)
  actions/          # Server actions (groups, expenses, profile)
  components/       # UI and feature components
  contexts/         # Group context + active group state
  hooks/            # Expenses, month selector
  lib/              # Balances, currency, Supabase clients
supabase/
  migrations/       # SQL schema, RLS, realtime
  seed.sql          # Demo data script
```

## Balance Algorithm

For each expense, the share per participant is `amount / participantCount` (integer paisa with remainder distributed). The payer’s balance increases by the full amount; each participant’s balance decreases by their share. Positive balance = should receive; negative = owes. Transfers are simplified via a greedy debtor/creditor matching algorithm.

## License

Private / MIT — use as needed for your household.
