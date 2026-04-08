# WCN Next.js Starter

A premium dark-mode starter for your WCN official site and in-site wiki.

## Included

- Homepage
- About page
- How It Works page
- Node Network page
- Apply page
- Docs / Wiki module with sidebar navigation

## Run locally

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Node applications + Admin login

This project includes:
- Node application form at `/apply` (saves to Postgres)
- Admin dashboard at `/dashboard/applications` (review + update status)
- Login at `/login` (email/password)

### 1) Configure environment variables

Copy `.env.example` → `.env` and set:
- `DATABASE_URL` (use Vercel Postgres `POSTGRES_URL` for local + Prisma Studio)
- `NEXTAUTH_URL` (local: `http://localhost:3000`, production: your domain)
- `NEXTAUTH_SECRET` (random string)

Generate a secret:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 2) Run migrations

```bash
npx prisma generate
npx prisma migrate dev --name init
```

### 3) Create admin user

```bash
ADMIN_EMAIL="admin@example.com" ADMIN_PASSWORD="your-strong-password" node scripts/create-admin.mjs
```

Then sign in at `/login` and open `/dashboard/applications`.

## Deploy to Vercel

1. Create a GitHub repo and upload these files
2. Log in to Vercel
3. Import the repo
4. Click Deploy
5. Bind your custom domain in the Vercel project settings

## Suggested next upgrades

- Add bilingual switcher (Chinese / English)
- Replace placeholder copy with your final WCN content
- Connect Apply page to Tally / Typeform / custom CRM
- Add CMS or Markdown pipeline for docs
- Add dashboard later under `/dashboard`

