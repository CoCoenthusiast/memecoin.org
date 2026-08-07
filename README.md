# memecoins.org

A community forum focused on memecoin discussion and trading culture.

Built with Next.js 16 (App Router), TypeScript, Tailwind CSS, Prisma + SQLite.

## Features

- 8 discussion channels (General Chat, PnL Flex, Questions, Wallet Tracker, Twitter Tracker, Best Setup, Solana, Robinhood,)
- User accounts with email/password authentication
- Create posts and reply to threads
- Reaction system (Like, Dislike, Funny, Sad) — one reaction per user per post/reply
- User profile pages showing all posts and total reactions received
- Dark theme, mobile-responsive layout

## Prerequisites

- Node.js 18+
- npm

## Setup

```bash
# Install dependencies
npm install

# Initialize the database, generate Prisma client, and seed with sample data
npx prisma migrate dev

# Start the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Seed accounts

| Username | Email               | Password    |
|----------|---------------------|-------------|
| alice    | alice@example.com   | password123 |
| bob      | bob@example.com     | password123 |
| charlie  | charlie@example.com | password123 |
| diana    | diana@example.com   | password123 |

## Environment Variables

| Variable     | Description                          | Default                        |
|--------------|--------------------------------------|--------------------------------|
| DATABASE_URL | SQLite database file path            | file:./dev.db                  |
| JWT_SECRET   | Secret key for JWT token signing     | memecoins-dev-secret-...       |

## Tech Stack

- **Next.js 16** (App Router, Turbopack)
- **TypeScript**
- **Tailwind CSS 4**
- **Prisma** — ORM with SQLite
- **bcryptjs** — password hashing
- **jsonwebtoken** — auth tokens

## Project Structure

```
src/
  app/
    api/           # REST API routes
      auth/        # login, register, logout, me
      channels/    # list channels, get channel, create posts
      posts/       # get post, create replies
      reactions/   # create/update/delete reactions
      users/       # user profile data
    c/[slug]/      # channel page
    p/[id]/        # post detail page
    new-post/      # create post page
    profile/[username]/  # user profile page
    login/         # login page
    register/      # register page
  components/      # React components
    AuthGuard.tsx
    LayoutClient.tsx
    NewPostForm.tsx
    NewReplyForm.tsx
    PostCard.tsx
    ReactionBar.tsx
    ReplyList.tsx
    Sidebar.tsx
  hooks/
    useSession.tsx  # Auth session context + hook
  lib/
    api.ts         # API utilities
    auth.ts        # Auth helpers (hash, verify, JWT, session)
    constants.ts   # Channel definitions
    db.ts          # Prisma client singleton
prisma/
  schema.prisma    # Database schema
  seed.ts          # Seed data script
```
