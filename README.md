# degenscult

A community forum for memecoin discussion and trading culture — built for people trading on Ethereum, Solana, and beyond.

Built with Next.js 16 (App Router), TypeScript, Tailwind CSS, Prisma + PostgreSQL (Supabase).

## Features

- **Channels** — General Chat, PnL Flex, Questions, Wallet Tracker, Twitter Tracker, Best Setup, Solana, Robinhood
- **Accounts** — email/password authentication with hashed passwords (bcrypt) and JWT session cookies
- **Posts & replies** — create posts, reply to threads, nested replies
- **Reactions** — Like, Dislike, Funny, Sad (one reaction per user per post/reply)
- **Moderation** — admin role with permission to delete any post or reply; user-submitted reports (spam, scam, offensive content, other) reviewed from an admin dashboard
- **User profiles** — avatar upload, post count, reply count, total reactions received, and a public comment wall ("Mural") where other users can leave messages
- **Search** — search posts by title/body, filter by author, accessible from the sidebar on every page
- **Legal pages** — Terms of Use, Privacy Policy, and a financial disclaimer (content is user-generated and not financial advice)
- **Donations** — a dedicated page explaining the project and accepting optional Solana donations
- **Rate limiting** — basic protection against brute-force login attempts
- Dark theme, mobile-responsive layout

## Prerequisites

- Node.js 18+
- npm
- A [Supabase](https://supabase.com) project (free tier is enough) for the PostgreSQL database

## Setup

1. Create a Supabase project and grab two connection strings from **Connect → ORM → Prisma**:
   - the pooled connection (port `6543`, with `pgbouncer=true`) for `DATABASE_URL`
   - the direct connection (port `5432`) for `DIRECT_URL`

2. Create a `.env` file in the project root (see [Environment Variables](#environment-variables) below).

```bash
# Install dependencies
npm install

# Generate the Prisma client
npx prisma generate

# Apply migrations to your Supabase database
npx prisma migrate deploy

# Seed the database with sample data
npx prisma db seed

# Start the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

> **Note:** `prisma migrate dev` can hang against Supabase's connection pooler, since it needs to create a shadow database, which the pooler doesn't support for DDL operations. Use `prisma migrate deploy` with the direct connection (`DIRECT_URL`, configured in `prisma.config.ts`) instead, as shown above.

### Seed accounts

| Username | Email               | Password    | Role  |
|----------|---------------------|-------------|-------|
| alice    | alice@example.com   | password123 | ADMIN |
| bob      | bob@example.com     | password123 | USER  |
| charlie  | charlie@example.com | password123 | USER  |
| diana    | diana@example.com   | password123 | USER  |

## Environment Variables

| Variable       | Description                                                              |
|----------------|---------------------------------------------------------------------------|
| `DATABASE_URL` | Supabase pooled connection string (port 6543, `pgbouncer=true`) — used by the running app |
| `DIRECT_URL`   | Supabase direct connection string (port 5432) — used only for migrations, via `prisma.config.ts` |
| `JWT_SECRET`   | Secret key for signing session tokens. Generate a strong one with `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` — never use a placeholder value |

`.env` is git-ignored and must never be committed.

## Tech Stack

- **Next.js 16** (App Router, Turbopack)
- **TypeScript**
- **Tailwind CSS 4**
- **Prisma** — ORM, PostgreSQL provider (hosted on Supabase)
- **bcryptjs** — password hashing
- **jsonwebtoken** — auth tokens, stored in an httpOnly cookie

## Project Structure

```
prisma/
  schema.prisma       # Database schema
  seed.ts             # Seed data script
  migrations/         # Migration history
prisma.config.ts      # Points Prisma CLI at DIRECT_URL for migrations
src/
  app/
    api/               # REST API routes
      auth/            # login, register, logout, me
      channels/        # list channels, get channel, create posts
      posts/           # get post, create replies, delete (admin)
      replies/         # delete (admin)
      reactions/       # create/update/delete reactions
      reports/         # submit and resolve reports
      search/          # search posts
      users/[username]/
        route.ts       # profile data (posts, replies, reactions received)
        avatar/        # avatar upload
        comments/      # profile "Mural" comments
    c/[slug]/          # channel page
    p/[id]/            # post detail page
    new-post/          # create post page
    profile/[username]/ # user profile page (posts, mural, avatar)
    search/            # search results page
    admin/reports/     # moderation dashboard (admin only)
    about/             # project mission + donation address
    terms/             # Terms of Use
    privacy/           # Privacy Policy
    disclaimer/        # Financial disclaimer
    login/ register/   # auth pages
  components/          # React components
    AuthGuard.tsx
    LayoutClient.tsx
    NewPostForm.tsx
    NewReplyForm.tsx
    PostCard.tsx
    ReactionBar.tsx
    ReplyList.tsx
    Sidebar.tsx
    ContentActions.tsx   # report / delete buttons on posts, replies, and profiles
    AdminReportsList.tsx # moderation dashboard list
  hooks/
    useSession.tsx     # Auth session context + hook
  lib/
    api.ts             # API utilities
    auth.ts            # Auth helpers (hash, verify, JWT, session, role checks)
    constants.ts        # Channel definitions
    db.ts               # Prisma client singleton
    rateLimit.ts         # Basic login rate limiting
  generated/db/          # Generated Prisma client (do not edit)
```

## Moderation

Accounts with the `ADMIN` role can delete any post or reply, and review user-submitted reports from `/admin/reports`. There's no self-service way to become an admin — promote an account by updating its `role` field directly in the database (e.g. via Prisma Studio: `npx prisma studio`).

## Legal

The `/terms`, `/privacy`, and `/disclaimer` pages are a starting point, not a substitute for legal review. Get them checked by a lawyer before scaling up or handling real money.
