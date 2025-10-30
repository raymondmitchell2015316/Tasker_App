# Tasker - Twitter Task Automation Platform

A powerful Twitter automation platform with OAuth 2.0 authentication, multi-account management, and bulk posting capabilities.

## Features

- ✅ Twitter OAuth 2.0 with PKCE security
- ✅ Multi-account Twitter app management
- ✅ Single & bulk tweet posting
- ✅ Token auto-refresh mechanism
- ✅ Mobile-optimized sharing flows
- ✅ Complete admin dashboard
- ✅ Tweet analytics and history
- ✅ Rate limit handling

## Setup

1. Install dependencies:
```bash
cd tasker
npm install
```

2. Create `.env` file:
```env
DATABASE_URL=your_postgresql_url
SESSION_SECRET=your_session_secret
CUSTOM_DOMAIN=your_domain.com
NODE_ENV=development
```

3. Push database schema:
```bash
npm run db:push
```

4. Start development server:
```bash
npm run dev
```

## Environment Variables

- `DATABASE_URL` - PostgreSQL connection string
- `SESSION_SECRET` - Session encryption key
- `CUSTOM_DOMAIN` - Production domain for OAuth callbacks
- `NODE_ENV` - development or production

## Tech Stack

- **Backend**: Express.js + TypeScript
- **Frontend**: React + Vite
- **Database**: PostgreSQL + Drizzle ORM
- **Auth**: Express Sessions + bcrypt
- **OAuth**: Twitter OAuth 2.0 with PKCE
