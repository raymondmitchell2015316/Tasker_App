# Tasker - Twitter Automation Platform

## Project Overview
**Tasker** is a dual-interface Twitter automation platform featuring:
1. **Admin Panel** - Twitter app management, OAuth 2.0 authentication, user management, and automated posting
2. **Public Landing Page** - User waitlist system with social media tasks for SOL rewards

**Tech Stack**: Express.js + React + TypeScript + PostgreSQL + Drizzle ORM

## Database Configuration (CRITICAL - READ FIRST)

### PostgreSQL Setup
This app **requires PostgreSQL** to function. Before running, you MUST:

1. **Enable PostgreSQL in Replit**:
   - Go to Tools → Database → PostgreSQL
   - Click "Enable PostgreSQL"
   - Replit will automatically set the `DATABASE_URL` environment variable

2. **Auto-Initialization**:
   - The app automatically creates all 18 database tables on first run
   - Default admin user is created: username `admin`, password `admin123`
   - Sample data is populated automatically

3. **Database Tables** (auto-created):
   ```
   - admin_users          # Admin authentication
   - twitter_apps         # Twitter app configurations
   - social_users         # Authenticated Twitter users
   - tweet_history        # Tweet posting history
   - app_settings         # OAuth verifiers and settings
   - landing_page_config  # Landing page customization
   - telegram_settings    # Telegram notification settings
   - session              # Express session storage
   ```

### IMPORTANT: Database Migration Commands

**NEVER manually write SQL migrations.** Always use Drizzle commands:

```bash
# Push schema changes to database
npm run db:push

# If you get data-loss warnings, force the push
npm run db:push --force

# Open Drizzle Studio to view database
npm run db:studio
```

### Database Schema Rules
- **NEVER change primary key types** (serial ↔ varchar) - This breaks existing data
- **Schema location**: `shared/schema.ts` contains all table definitions
- **Auto-sync**: The app auto-creates tables if they don't exist
- All ID columns use `serial("id").primaryKey()` for consistency

## Setup Instructions

### Step 1: Install Dependencies
```bash
npm install
```

### Step 2: Enable PostgreSQL
- Tools → Database → PostgreSQL → Enable
- Verify `DATABASE_URL` is set in Secrets

### Step 3: (Optional) Set Environment Variables
Go to Tools → Secrets and add:
```
SESSION_SECRET=your-random-secret-here-change-this
NODE_ENV=production
```

Note: `DATABASE_URL` is automatically set by Replit when you enable PostgreSQL.

### Step 4: Start the Application
```bash
npm run dev
```

This will:
1. Build the React frontend
2. Auto-create all database tables (if not exist)
3. Create default admin user (admin/admin123)
4. Start Express server on port 5000

### Step 5: Access the App
- **Landing Page**: `http://localhost:5000/`
- **Admin Login**: `http://localhost:5000/admin`
- **Default Credentials**: admin / admin123

## Project Structure

```
tasker/
├── server/               # Backend (Express + TypeScript)
│   ├── index.ts         # Main Express server (1,363 lines)
│   ├── auth.ts          # Admin authentication
│   ├── twitter.ts       # Twitter OAuth 2.0 service
│   ├── telegram.ts      # Telegram notifications
│   ├── jobManager.ts    # Background job processing
│   └── db.ts            # Database connection
├── client/              # Frontend (React + TypeScript + Vite)
│   ├── src/
│   │   ├── pages/       # React pages (Landing, Admin, Users, etc.)
│   │   ├── components/  # Reusable UI components
│   │   └── lib/         # Utilities
│   └── index.html
├── shared/              # Shared between frontend/backend
│   └── schema.ts        # Drizzle database schema (18 tables)
├── package.json         # Dependencies and scripts
├── vite.config.ts       # Vite configuration (port 5000)
├── tsconfig.json        # TypeScript configuration
└── .replit              # Replit run configuration
```

## Key Features Implemented

### Admin Panel Features (100% Complete)
- ✅ Twitter Apps Management (CRUD operations)
- ✅ OAuth 2.0 Authentication (Test & Production modes)
- ✅ User Management (view, delete, refresh tokens)
- ✅ Duplicate User Detection & Automatic Fixing
- ✅ Token Validation & Refresh
- ✅ Tweet Posting (Individual & Bulk)
- ✅ Tweet History Tracking (last 100 tweets)
- ✅ Landing Page Configuration (colors, text, button actions)
- ✅ Telegram Notifications Integration
- ✅ Job Progress Tracking (real-time updates)
- ✅ 15 Users Per Twitter App Limit Enforcement

### Landing Page Features
- ✅ Glassmorphism Design with Admin-Configurable Colors
- ✅ Button Actions: Waitlist / Coming Soon / External Link / Dashboard
- ✅ OAuth Waitlist System with Twitter Authentication
- ✅ Success Modal (New User / Returning User detection)
- ✅ Smart Twitter App Assignment
- ✅ Rate Limiting (15 users per Twitter app)

## Twitter OAuth Setup (IMPORTANT)

### Understanding OAuth Callback URLs

For OAuth to work, Twitter must redirect back to your app. The callback URL format is:
```
https://YOUR_REPLIT_DOMAIN/auth/x/callback/app_UNIQUE_ID
```

### Development Setup (Localhost)
If testing locally:
```
http://localhost:5000/auth/x/callback/app_UNIQUE_ID
```

### Production Setup (Replit)
When deployed on Replit:
```
https://your-repl-name.replit.app/auth/x/callback/app_UNIQUE_ID
```

### Steps to Configure Twitter Apps

1. **Create Twitter Developer App**:
   - Go to https://developer.twitter.com
   - Create a new app or use existing
   - App Settings → OAuth 2.0 Settings
   - Set Type: "Web App"
   - Add callback URL: `https://your-domain.com/auth/x/callback/app_UNIQUE_ID`
   - Save Client ID and Client Secret

2. **Add to Tasker Admin**:
   - Login to Admin panel (`/admin`)
   - Go to Twitter Apps
   - Click "Add Twitter App"
   - Fill in:
     - App Name (any name)
     - Client ID (from Twitter)
     - Client Secret (from Twitter)
     - Callback URL (must match Twitter exactly)
   - Save

3. **Test OAuth Flow**:
   - Admin → Twitter Apps → Click "Test Auth" button
   - Follow instructions to complete OAuth
   - Check Admin → Users to see authenticated user

## Available Scripts

```bash
# Development (builds frontend + starts server)
npm run dev

# Server only (no frontend rebuild)
npm run dev:server

# Client only (Vite dev server)
npm run dev:client

# Build frontend for production
npm run build

# Database: Push schema changes
npm run db:push

# Database: Force push (skip warnings)
npm run db:push --force

# Database: Open Drizzle Studio
npm run db:studio
```

## API Endpoints

### Admin Authentication
- `POST /api/admin/login` - Admin login
- `POST /api/admin/logout` - Admin logout
- `GET /api/admin/check` - Check auth status

### Twitter Apps Management
- `GET /api/twitter-apps` - List all Twitter apps
- `POST /api/twitter-apps` - Create new Twitter app
- `PATCH /api/twitter-apps/:id` - Update Twitter app
- `DELETE /api/twitter-apps/:id` - Delete Twitter app
- `POST /api/twitter-apps/:id/test-auth` - Test OAuth flow

### User Management
- `GET /api/users` - Get all users with pagination
- `GET /api/users/stats` - Get user statistics
- `DELETE /api/users/:id` - Delete user by ID
- `POST /api/users/duplicates/detect` - Detect duplicate users
- `POST /api/users/duplicates/fix` - Fix duplicate users
- `POST /api/users/:id/refresh-token` - Refresh user's OAuth token
- `POST /api/users/refresh-tokens/bulk` - Bulk refresh tokens
- `POST /api/users/validate-tokens` - Validate all tokens

### Tweet Posting
- `POST /api/tweets/post` - Post tweet to single account
- `POST /api/tweets/bulk-post` - Post to multiple accounts
- `POST /api/tweets/general-session` - General posting session
- `GET /api/tweets/history` - Get tweet history

### Landing Page
- `GET /api/landing-config` - Get landing page config
- `POST /api/landing-config` - Update landing page config
- `GET /api/landing/initiate-oauth` - Start OAuth flow

### Telegram
- `GET /api/telegram/settings` - Get Telegram settings
- `POST /api/telegram/settings` - Update Telegram settings
- `POST /api/telegram/test` - Test Telegram notification

### Jobs
- `GET /api/jobs/:jobId/progress` - Get job progress

## Common Issues & Solutions

### Issue: "Database connection failed"
**Solution**: Enable PostgreSQL in Tools → Database → PostgreSQL

### Issue: "Admin login doesn't work"
**Solution**: 
1. Check database is initialized (restart app to trigger auto-init)
2. Default credentials: `admin` / `admin123`
3. If still failing, check logs for database errors

### Issue: "OAuth callback returns 404"
**Solution**: 
1. Verify callback URL in Twitter Developer Portal matches exactly
2. Format: `https://your-domain.com/auth/x/callback/app_UNIQUE_ID`
3. Make sure Twitter app is active (`is_active = true`)

### Issue: "Can't add users (15 limit reached)"
**Solution**: 
- Each Twitter app has a 15-user limit
- Add more Twitter apps in Admin → Twitter Apps
- Or delete old users to free up slots

### Issue: "Token validation fails"
**Solution**:
- OAuth tokens expire after 2 hours
- Use Admin → Users → Bulk Refresh Tokens
- Or individual user → Refresh Token button

### Issue: "Duplicate users appearing"
**Solution**:
- Use Admin → Users → Find Duplicates
- Click "Fix Duplicates" to auto-remove
- Keeps most recent, active users

## Environment Variables

```bash
# Database (automatically set by Replit)
DATABASE_URL=postgresql://...

# Session Secret (generate a random string)
SESSION_SECRET=your-random-secret-change-this

# Node Environment
NODE_ENV=production

# Custom Domain (optional)
CUSTOM_DOMAIN=your-domain.com
```

## Security Notes

- **Change default admin password immediately** in production
- **Never commit secrets** to Git (use Replit Secrets)
- **OAuth tokens expire** after 2 hours (use refresh tokens)
- **Session secret** should be random and unique
- **HTTPS required** for production OAuth (HTTP only for localhost)

## Database Schema Reference

All tables are defined in `shared/schema.ts`:

```typescript
// Example: admin_users table
export const adminUsers = pgTable("admin_users", {
  id: serial("id").primaryKey(),
  username: varchar("username", { length: 255 }).notNull().unique(),
  password_hash: varchar("password_hash", { length: 255 }).notNull(),
  created_at: timestamp("created_at").defaultNow(),
});

// Example: twitter_apps table
export const twitterApps = pgTable("twitter_apps", {
  id: serial("id").primaryKey(),
  app_name: varchar("app_name", { length: 255 }).notNull(),
  client_id: varchar("client_id", { length: 255 }).notNull(),
  client_secret: varchar("client_secret", { length: 500 }).notNull(),
  callback_url: varchar("callback_url", { length: 500 }).notNull(),
  is_active: boolean("is_active").default(true),
  created_at: timestamp("created_at").defaultNow(),
});
```

## Coding Conventions

- **Language**: TypeScript (strict mode)
- **Style**: Functional components, async/await, no semicolons
- **Database**: Drizzle ORM, no raw SQL migrations
- **UI**: Tailwind CSS + shadcn/ui components
- **Routing**: Wouter for React routing
- **State**: TanStack Query for server state
- **Authentication**: Express sessions + bcrypt

## Testing OAuth Flow

1. **Start the app**: `npm run dev`
2. **Create Twitter app** in Admin panel
3. **Test authentication**: Admin → Twitter Apps → Test Auth button
4. **Follow instructions** to complete OAuth
5. **Verify user**: Admin → Users (should see new user)

## Deployment Checklist

Before deploying to production:

- [ ] Enable PostgreSQL
- [ ] Change admin password from default
- [ ] Set strong `SESSION_SECRET`
- [ ] Update Twitter callback URLs to production domain
- [ ] Configure Telegram notifications (optional)
- [ ] Test OAuth flow end-to-end
- [ ] Verify all 18 database tables exist
- [ ] Check logs for errors

## Support & Documentation

All features are documented in:
- `README.md` - Feature overview
- `SETUP.md` - Detailed setup guide
- `FEATURES.md` - Complete feature list
- `ARCHITECTURE.md` - Technical architecture
- `TRANSFER_GUIDE.md` - Transfer instructions
- `QUICK_START.md` - 5-minute quick start

## Recent Changes (October 30, 2025)

- ✅ Reconfigured to use port 5000 (Replit default)
- ✅ Removed workflow dependencies
- ✅ Updated build process (frontend builds first)
- ✅ Fixed OAuth state handling (prod_ vs test_ prefixes)
- ✅ Fixed duplicate deletion bug (ID-based instead of username)
- ✅ Ready for independent deployment

---

**Default Admin Credentials**: `admin` / `admin123`

**IMPORTANT**: This is a standalone application, not a library. It's ready to run immediately after enabling PostgreSQL and running `npm install && npm run dev`.
