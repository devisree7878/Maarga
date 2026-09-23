# ELEVORA — Turn your goals into daily progress.

A personal-development platform: set a goal, pick a schedule, get a dynamic
day-by-day plan, complete tasks, solve problems, play brain-training games,
track real performance, and connect + chat with friends. Backed by Supabase
(Auth, Postgres + Row Level Security, Realtime).

## 1. Set up Supabase

1. Create a project at [supabase.com](https://supabase.com).
2. In **SQL Editor**, paste and run `supabase/migrations/0001_init.sql`. It's
   idempotent (safe to re-run).
3. In **Authentication → Providers → Email**, make sure Email auth is
   enabled (it is by default).
4. In **Authentication → Providers → Google**, enable Google and fill in the
   OAuth **Client ID** / **Client Secret** from a Google Cloud OAuth
   consent screen + credentials (Web application type). Add this exact
   redirect URI in the Google Cloud console:
   `https://YOUR-PROJECT-REF.supabase.co/auth/v1/callback`
5. In **Authentication → URL Configuration**, set **Site URL** to your
   deployed URL (or `http://localhost:5173` for local dev) and add it (plus
   your Vercel URL) to **Redirect URLs**.
6. The admin account is provisioned automatically: any signup using
   `devisreeadmin@gmail.com` gets `profiles.role = 'admin'` via the
   `handle_new_user` trigger. No manual step needed — just register (or sign
   in with Google) using that exact address.

## 2. Configure environment variables

```bash
cp .env.example .env
```

Fill in `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` from
**Supabase → Project Settings → API**. Set the same two variables in
**Vercel → Project → Settings → Environment Variables** for production.

## 3. Run it locally

```bash
npm install
npm run dev
```

## 4. Build for production

```bash
npm run build
npm run preview   # optional: preview the production build locally
```

## 5. Deploy to Vercel

Push to GitHub, import the repo in Vercel (framework preset **Vite**, build
command `npm run build`, output dir `dist`), and add the two Supabase env
vars from step 2.

## How data works now

Every user's plan (categories, days, tasks, problems, mistakes, goals, study
logs) lives in Postgres under `user_plans`, one row per user, protected by
Row Level Security so a user can only ever read/write their own row. Game
scores, friend requests/friendships, and chat messages are likewise real
Postgres tables with RLS — nothing is faked or hardcoded. **Settings → Data**
still offers a local JSON export/import for personal backups.

## Project structure

```
src/
  pages/auth/        Login, Register, Forgot/Reset Password
  pages/              Home, Onboarding, Dashboard, Games, Friends, Chat,
                       Admin Dashboard, Settings, and the original
                       plan pages (Days, Problems, Mistakes, Goals, Analytics)
  components/games/   The three playable brain-training games
  context/            AuthContext (Supabase session/profile), AppContext
                       (per-user plan data), UIContext (panels/search)
  services/           planStorage, gamesService, friendsService,
                       messagesService, adminService — all Supabase-backed
  lib/                supabaseClient.js
  data/schema.js       shape/defaults for a user's plan (dynamic day count)
supabase/migrations/   SQL migration: tables, RLS policies, RPCs
```

## Security notes

- Admin access is enforced server-side: `get_admin_stats()` is a
  `SECURITY DEFINER` Postgres function that itself checks `is_admin()`
  before returning anything — the `/admin` route guard in the UI is
  defense-in-depth, not the actual security boundary.
- Every user-owned table (`profiles`, `user_plans`, `game_sessions`,
  `friend_requests`, `friendships`, `messages`) is RLS-protected against
  `auth.uid()`. Users can never grant themselves the `admin` role (enforced
  in the `profiles` UPDATE policy) and can only message someone they are
  actually friends with (enforced in the `messages` INSERT policy).
