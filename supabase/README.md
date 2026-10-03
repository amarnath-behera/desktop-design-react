# Supabase setup

## Apply the schema

Open the Supabase project SQL Editor and run `migrations/20261004000000_finance_schema.sql`. It creates the profile, income, expense, transaction, borrowing, and investment tables with row-level security. If that migration was already applied before the RPC grants were hardened, also run `migrations/20261004000001_secure_dashboard_rpc.sql` to remove anonymous/public execution rights.

## Configure email authentication

Enable the Email provider under Authentication. The app requests a six-digit email OTP through Supabase Auth for sign-in and registration. In the email templates, include `{{ .Token }}` for the numeric code.

For Gmail custom SMTP, use `smtp.gmail.com` as the host, port `465`, and the full Gmail address as both sender and username. The SMTP password must be a Google App Password created with 2-Step Verification, not the normal Google account password. Keep SMTP credentials only in Supabase's SMTP settings; never put them in app code or `.env` files.

## Configure the local app

Copy `.env.example` to `.env.local`, then set `VITE_SUPABASE_ANON_KEY` to the project's publishable/anon key from Supabase API settings. Keep `.env.local` untracked. Never put a service-role key in a `VITE_` variable or browser code.

Restart the Vite server after changing `.env.local`. Once the migration has been applied and a user verifies their email, profiles and dashboard data are stored in Supabase. On first sign-in, existing browser dashboard data is copied up only when that user's remote dashboard is empty.