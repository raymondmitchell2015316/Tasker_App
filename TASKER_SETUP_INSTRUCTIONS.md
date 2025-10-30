# 🚀 Tasker App - Setup Instructions for New Replit

## 📦 What's Included

This export contains the complete **Tasker** application - a dual-interface Twitter automation platform with:

1. **Admin Panel** (port 3000) - Twitter app management, OAuth, automated posting
2. **Public Landing Page** (port 3000) - User waitlist with social tasks for SOL rewards

## 🛠️ Setup in New Replit

### Step 1: Create New Node.js Replit
1. Go to Replit.com
2. Create a new Replit
3. Select **Node.js** template
4. Name it something like "Tasker-App"

### Step 2: Upload Files
Extract `tasker-app-export.tar.gz` and upload all files to your new Replit.

**Key Files Structure:**
```
/
├── server/           # Backend (Express + TypeScript)
├── client/           # Frontend (React + TypeScript + Vite)
├── shared/           # Shared schemas
├── package.json      # Dependencies
├── tsconfig.json     # TypeScript config
├── vite.config.ts    # Vite config
└── .replit           # Replit configuration
```

### Step 3: Install Dependencies
```bash
npm install
```

### Step 4: Set Up Database
1. In Replit, enable **PostgreSQL** database
2. The app will auto-create all 18 tables on first run
3. Default admin credentials: `admin` / `admin123`

### Step 5: Configure Environment Variables

Create a `.env` file or use Replit Secrets:

```env
# Database (automatically set by Replit if using built-in PostgreSQL)
DATABASE_URL=your_postgres_connection_string

# Custom Domain (optional - for production)
CUSTOM_DOMAIN=your-domain.com

# Session Secret (generate a random string)
SESSION_SECRET=your-random-secret-here
```

### Step 6: Start the App
```bash
npm run dev
```

This will:
1. Build the frontend (React + Vite)
2. Start the backend server on port 5000 (Replit's default)
3. Serve the built frontend from the same port

Access the app at: **http://localhost:5000** or your Replit URL

## 🔐 Twitter OAuth Setup

### For Development (Localhost):
1. Go to [Twitter Developer Portal](https://developer.twitter.com)
2. Create a new app or use existing
3. Set callback URL to: `http://localhost:5000/auth/x/callback/app_YOUR_UNIQUE_ID`
4. Copy Client ID and Client Secret
5. Add in Tasker Admin → Twitter Apps

### For Production (Custom Domain):
1. Update callback URL to: `https://yourdomain.com/auth/x/callback/app_YOUR_UNIQUE_ID`
2. Make sure your domain points to your Replit
3. Update Twitter app settings in Admin panel

## 📋 Database Tables (Auto-Created)

The app automatically creates these tables:
1. `admin_users` - Admin authentication
2. `twitter_apps` - Twitter app configurations
3. `social_users` - Authenticated Twitter users
4. `tweet_history` - Tweet posting history
5. `app_settings` - OAuth verifiers and settings
6. `landing_page_config` - Landing page customization
7. `telegram_settings` - Telegram notification settings
8. `session` - Express session storage

## 🎯 Features Implemented

### Admin Panel Features:
✅ Twitter Apps Management (CRUD)
✅ OAuth 2.0 Authentication (Test & Production)
✅ User Management (view, delete, refresh tokens)
✅ Duplicate User Detection & Fixing
✅ Token Validation
✅ Tweet Posting (individual & bulk)
✅ Tweet History Tracking
✅ Landing Page Configuration
✅ Telegram Notifications
✅ Job Progress Tracking

### Landing Page Features:
✅ Glassmorphism Design
✅ Admin-Configurable Button Actions (Waitlist/Coming Soon/External Link/Dashboard)
✅ OAuth Waitlist System
✅ Success Modal (New/Returning Users)
✅ 15 Users Per Twitter App Limit
✅ Smart App Assignment
✅ Returning User Detection

## 🔧 Key Endpoints

### Admin Panel
- `http://localhost:5000/admin` - Admin login
- `http://localhost:5000/admin/twitter-apps` - Twitter apps management
- `http://localhost:5000/admin/users` - User management
- `http://localhost:5000/admin/landing-config` - Landing page config
- `http://localhost:5000/admin/telegram-settings` - Telegram setup

### Public
- `http://localhost:5000/` - Landing page
- `http://localhost:5000/auth/x/callback/:appId` - OAuth callback

### API
- `GET /api/landing-config` - Get landing page config
- `GET /api/landing/initiate-oauth` - Start OAuth flow
- `GET /api/users` - Get all users (admin)
- `POST /api/users/duplicates/fix` - Fix duplicate users

## 🐛 Troubleshooting

### OAuth Not Working?
- Verify callback URL matches exactly in Twitter Developer Portal
- Check that the app is active (`is_active = true`)
- Make sure you have less than 15 users per Twitter app
- Check logs for OAuth verifier errors

### Database Issues?
- Restart the app to trigger auto-initialization
- Check `DATABASE_URL` is set correctly
- Verify PostgreSQL is enabled in Replit

### Can't Login to Admin?
- Default credentials: `admin` / `admin123`
- Reset password in database: `UPDATE admin_users SET password_hash = '$2a$10$...' WHERE username = 'admin';`

## 📝 Next Steps

1. **Configure Domain**: Point your custom domain to this Replit
2. **Update Twitter Apps**: Change callback URLs to your production domain
3. **Configure Landing Page**: Customize title, subtitle, colors in Admin
4. **Set Up Telegram**: Add bot token for notifications (optional)
5. **Test OAuth Flow**: Click "Join Waitlist" and complete Twitter auth
6. **Monitor Users**: Check Admin → Users to see authenticated users

## 🚨 Important Notes

- **Separate App**: This is completely independent from the main SolRentRecover app
- **OAuth Issue**: In the original monorepo, OAuth callbacks went to the main app instead of Tasker. Running as a separate app fixes this!
- **Database**: Uses its own database tables, no conflicts with main app
- **Port**: Runs on port 5000 (Replit's default port for web apps)

## 📚 Documentation Files

All documentation is in the `tasker/` folder:
- `README.md` - Overview
- `SETUP.md` - Setup guide
- `FEATURES.md` - Feature list
- `ARCHITECTURE.md` - Technical architecture
- `RUNNING.md` - Running guide
- `ACCESS.md` - Access information
- `ADVANCED_FEATURES.md` - Advanced features

## 💪 Built With

- **Backend**: Express.js, TypeScript, Drizzle ORM
- **Frontend**: React 18, TypeScript, Vite, TailwindCSS, shadcn/ui
- **Database**: PostgreSQL
- **Authentication**: Express Session, bcrypt
- **OAuth**: Twitter OAuth 2.0 with PKCE
- **Notifications**: Telegram Bot API

---

**Questions?** Check the documentation in the `tasker/` folder or review the code!

🎉 **Happy Building!**
