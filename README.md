# Tasker - Twitter Automation Platform

A powerful dual-interface Twitter automation platform with OAuth 2.0 authentication, multi-account management, and user waitlist system.

## 🚀 Quick Start (5 Minutes)

### 1. Enable PostgreSQL (REQUIRED)
This app **requires PostgreSQL**. Before anything else:
- Go to **Tools → Database → PostgreSQL**
- Click **Enable PostgreSQL**
- Replit will automatically set `DATABASE_URL`

### 2. Install Dependencies
```bash
npm install
```

### 3. Start the App
```bash
npm run dev
```

The app will:
- ✅ Auto-create all 18 database tables
- ✅ Create default admin user (admin/admin123)
- ✅ Build frontend and start server on port 5000

### 4. Access the App
- **Landing Page**: `http://localhost:5000/`
- **Admin Panel**: `http://localhost:5000/admin`
- **Login**: admin / admin123

## 📋 Features

### Admin Panel (100% Complete)
- ✅ **Twitter Apps Management** - Create, edit, delete Twitter developer apps
- ✅ **OAuth 2.0 Authentication** - Test and production OAuth flows
- ✅ **User Management** - View, delete, refresh tokens for authenticated users
- ✅ **Duplicate Detection** - Find and fix duplicate users automatically
- ✅ **Token Validation** - Validate and refresh OAuth tokens in bulk
- ✅ **Tweet Posting** - Single, bulk, and general posting sessions
- ✅ **Tweet History** - Track last 100 tweets with success/failure status
- ✅ **Landing Page Config** - Customize colors, text, button actions
- ✅ **Telegram Notifications** - Integration with Telegram Bot API
- ✅ **Job Progress Tracking** - Real-time progress for long-running tasks
- ✅ **15 User Limit** - Automatic enforcement per Twitter app

### Landing Page
- ✅ **Glassmorphism Design** - Modern UI with admin-configurable colors
- ✅ **Button Actions** - Waitlist / Coming Soon / External Link / Dashboard
- ✅ **OAuth Waitlist** - Users authenticate with Twitter to join
- ✅ **Success Modal** - Welcome new users, detect returning users
- ✅ **Smart Assignment** - Automatically assigns users to Twitter apps
- ✅ **Rate Limiting** - Respects 15 users per Twitter app limit

## 🗄️ Database Configuration

### Auto-Initialization
The app automatically creates all 18 database tables on first run:
- `admin_users` - Admin authentication
- `twitter_apps` - Twitter app configurations
- `social_users` - Authenticated Twitter users
- `tweet_history` - Tweet posting history
- `app_settings` - OAuth verifiers and settings
- `landing_page_config` - Landing page customization
- `telegram_settings` - Telegram notification settings
- `session` - Express session storage
- Plus 10 more tables for complete functionality

### Database Schema Location
All table definitions are in `shared/schema.ts`

### Database Commands
```bash
# Push schema changes to database
npm run db:push

# Force push (if you get data-loss warnings)
npm run db:push --force

# Open Drizzle Studio to view database
npm run db:studio
```

**IMPORTANT**: Never manually write SQL migrations. Always use `npm run db:push`.

## 🐦 Twitter OAuth Setup

### Understanding Callback URLs
For OAuth to work, Twitter needs to redirect back to your app:

**Local Development**:
```
http://localhost:5000/auth/x/callback/app_UNIQUE_ID
```

**Production (Replit)**:
```
https://your-repl-name.replit.app/auth/x/callback/app_UNIQUE_ID
```

**Custom Domain**:
```
https://your-domain.com/auth/x/callback/app_UNIQUE_ID
```

### Setup Steps

1. **Create Twitter Developer App**:
   - Go to https://developer.twitter.com
   - Create new app or use existing
   - Settings → OAuth 2.0 Settings
   - Type: "Web App"
   - Callback URL: (use format above)
   - Save Client ID and Client Secret

2. **Add to Tasker**:
   - Login to Admin (`/admin`)
   - Twitter Apps → Add Twitter App
   - Enter: App Name, Client ID, Client Secret, Callback URL
   - Save

3. **Test OAuth**:
   - Click "Test Auth" button
   - Follow instructions
   - Check Users page for authenticated account

## 🛠️ Tech Stack

- **Backend**: Express.js + TypeScript
- **Frontend**: React 18 + Vite + TypeScript
- **Database**: PostgreSQL + Drizzle ORM
- **UI**: Tailwind CSS + shadcn/ui (Radix UI)
- **Auth**: Express Sessions + bcrypt
- **OAuth**: Twitter OAuth 2.0 with PKCE
- **State**: TanStack Query
- **Routing**: Wouter

## 📂 Project Structure

```
tasker/
├── server/               # Backend (Express + TypeScript)
│   ├── index.ts         # Main server (1,363 lines)
│   ├── auth.ts          # Admin authentication
│   ├── twitter.ts       # Twitter OAuth service
│   ├── telegram.ts      # Telegram notifications
│   ├── jobManager.ts    # Background jobs
│   └── db.ts            # Database connection
├── client/              # Frontend (React + TypeScript)
│   ├── src/
│   │   ├── pages/       # React pages
│   │   ├── components/  # UI components
│   │   └── lib/         # Utilities
│   └── index.html
├── shared/              # Shared types/schema
│   └── schema.ts        # Drizzle schema (18 tables)
├── package.json         # Dependencies
├── vite.config.ts       # Vite config (port 5000)
└── tsconfig.json        # TypeScript config
```

## 🔧 Available Scripts

```bash
# Start development server (builds + runs)
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

## 🌐 API Endpoints

### Admin Authentication
- `POST /api/admin/login` - Login
- `POST /api/admin/logout` - Logout
- `GET /api/admin/check` - Check auth

### Twitter Apps
- `GET /api/twitter-apps` - List apps
- `POST /api/twitter-apps` - Create app
- `PATCH /api/twitter-apps/:id` - Update app
- `DELETE /api/twitter-apps/:id` - Delete app

### User Management
- `GET /api/users` - List users
- `DELETE /api/users/:id` - Delete user
- `POST /api/users/duplicates/fix` - Fix duplicates
- `POST /api/users/refresh-tokens/bulk` - Bulk refresh

### Tweet Posting
- `POST /api/tweets/post` - Single tweet
- `POST /api/tweets/bulk-post` - Bulk tweets
- `GET /api/tweets/history` - Tweet history

### Landing Page
- `GET /api/landing-config` - Get config
- `POST /api/landing-config` - Update config
- `GET /api/landing/initiate-oauth` - Start OAuth

## ⚙️ Environment Variables

```bash
# Database (auto-set by Replit PostgreSQL)
DATABASE_URL=postgresql://...

# Session Secret (generate random string)
SESSION_SECRET=your-random-secret-change-this

# Node Environment
NODE_ENV=production

# Custom Domain (optional)
CUSTOM_DOMAIN=your-domain.com
```

Set these in **Tools → Secrets** in Replit.

## 🐛 Common Issues

### "Database connection failed"
**Solution**: Enable PostgreSQL in Tools → Database → PostgreSQL

### "Admin login doesn't work"
**Solution**: 
- Default: `admin` / `admin123`
- Restart app to trigger database auto-init

### "OAuth callback 404"
**Solution**: 
- Verify callback URL matches exactly in Twitter Developer Portal
- Format: `https://your-domain.com/auth/x/callback/app_UNIQUE_ID`
- Make sure Twitter app is active

### "Can't add users (15 limit)"
**Solution**: 
- Add more Twitter apps (Admin → Twitter Apps)
- Or delete old users to free slots

### "Token validation fails"
**Solution**: 
- Tokens expire after 2 hours
- Use Bulk Refresh Tokens in Admin → Users

## 🔒 Security Notes

- ⚠️ **Change default admin password** (admin/admin123) immediately
- 🔑 **Never commit secrets** to Git (use Replit Secrets)
- 🕐 **OAuth tokens expire** after 2 hours (refresh regularly)
- 🔐 **Session secret** must be random and unique
- 🌐 **HTTPS required** for production OAuth (localhost can use HTTP)

## 📖 Additional Documentation

- `SETUP.md` - Detailed setup guide
- `FEATURES.md` - Complete feature list
- `ARCHITECTURE.md` - Technical architecture
- `TRANSFER_GUIDE.md` - Transfer to new Replit
- `QUICK_START.md` - 5-minute quick start
- `replit.md` - Replit Agent configuration

## 🎯 Testing the App

1. **Start**: `npm run dev`
2. **Login**: Go to `/admin` with admin/admin123
3. **Add Twitter App**: Twitter Apps → Add Twitter App
4. **Test OAuth**: Click "Test Auth" → Follow instructions
5. **Check Users**: Users page → See authenticated account
6. **Test Landing**: Go to `/` → Click button → Complete OAuth

## 📝 Recent Updates (October 30, 2025)

- ✅ Reconfigured to use port 5000 (Replit default)
- ✅ Removed workflow dependencies for clean transfer
- ✅ Fixed OAuth state handling (prod_ vs test_ prefixes)
- ✅ Fixed duplicate deletion bug (ID-based)
- ✅ Enhanced database auto-initialization
- ✅ Added comprehensive replit.md for Agent setup
- ✅ Ready for independent deployment

## 🚀 Deployment

This app is ready to deploy on Replit:

1. ✅ Enable PostgreSQL
2. ✅ Install dependencies
3. ✅ Run the app
4. ✅ Update Twitter callback URLs to production domain
5. ✅ Change admin password
6. ✅ Configure Telegram (optional)
7. ✅ Test end-to-end

---

**Default Admin**: `admin` / `admin123` ⚠️ Change this!

**Support**: Check documentation files or review code for help.

Made with ❤️ for Twitter automation
