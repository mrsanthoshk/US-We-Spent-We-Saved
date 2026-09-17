# US — We Spent / We Saved

A private two-person finance tracker for Santhosh and Sindhuja.

## Stack

- React + Vite
- Supabase Auth + PostgreSQL
- Recharts
- Lucide icons

## 1. Supabase setup

1. Open your Supabase project.
2. Go to **SQL Editor**.
3. Run `supabase_schema.sql`.
4. Go to **Authentication → Users** and create the shared login user:
   - Email: `tarasaifam@gmail.com`
   - Password: choose your own password.
5. If email confirmation is enabled, confirm the account or disable confirmation for this private app.
6. Copy `.env.example` to `.env.local`.
7. Put your Supabase publishable key in `.env.local`.

The Supabase URL is already configured.

## 2. Run locally

```bash
npm install
npm run dev
```

Open the local URL shown by Vite.

## 3. Deploy for free

You can deploy this Vite project to Vercel, Netlify, or Cloudflare Pages. Add the two `VITE_` environment variables in the hosting provider.

## Security

Only the Supabase publishable key belongs in the browser. Never put a `service_role` or secret key in `.env.local` or frontend code.
