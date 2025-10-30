# 📤 Manual Upload Guide - Tasker to GitHub

## Overview
This guide helps you manually upload the Tasker folder to GitHub and then import it to a new Replit.

## ✅ What's in This Folder

Everything you need is in the `tasker/` folder:

```
tasker/
├── 📄 Documentation (8 files)
│   ├── README.md                      ← Start here
│   ├── replit.md                      ← Replit Agent reads this
│   ├── QUICK_START.md                 ← 5-minute setup
│   ├── TRANSFER_GUIDE.md              ← Transfer methods
│   ├── SETUP.md                       ← Detailed setup
│   ├── FEATURES.md                    ← Feature list
│   ├── ARCHITECTURE.md                ← Technical details
│   └── MANUAL_UPLOAD_GUIDE.md         ← This file
│
├── 🔧 Configuration
│   ├── package.json                   ← Dependencies
│   ├── tsconfig.json                  ← TypeScript config
│   ├── vite.config.ts                 ← Vite (port 5000)
│   └── .replit                        ← Replit run config
│
├── 💾 Backend (server/)
│   ├── index.ts                       ← Main server (1,363 lines)
│   ├── auth.ts                        ← Admin auth
│   ├── twitter.ts                     ← OAuth service
│   ├── telegram.ts                    ← Notifications
│   ├── jobManager.ts                  ← Background jobs
│   └── db.ts                          ← Database connection
│
├── 🎨 Frontend (client/)
│   ├── src/pages/                     ← React pages
│   ├── src/components/                ← UI components
│   ├── src/lib/                       ← Utilities
│   └── index.html                     ← Entry point
│
└── 🗄️ Database (shared/)
    └── schema.ts                      ← 18 table definitions
```

---

## 🚀 Step-by-Step Upload Process

### **Step 1: Download the Tasker Folder**

1. In Replit, select the entire `tasker/` folder
2. Right-click → **Download as ZIP**
3. Extract the ZIP on your computer
4. You should have a folder named `tasker/` with all files

### **Step 2: Create GitHub Repository**

1. Go to https://github.com/new
2. **Repository name**: `tasker-app` (or any name you prefer)
3. **Description**: "Twitter automation platform with OAuth and waitlist"
4. **Visibility**: Public or Private (your choice)
5. **Do NOT** check "Add a README file" (we already have one)
6. Click **Create repository**

### **Step 3: Upload Files to GitHub**

**Method A: GitHub Web Interface (Easiest)**

1. On your new repository page, click **uploading an existing file**
2. Drag the entire contents of the `tasker/` folder (NOT the folder itself, but ALL the files inside)
3. Or click "choose your files" and select all files
4. Scroll down and click **Commit changes**

**Method B: GitHub Desktop (Recommended)**

1. Download GitHub Desktop: https://desktop.github.com/
2. File → Add Local Repository
3. Choose your `tasker` folder
4. Click "Publish repository"
5. Select your account and repository name
6. Click "Publish"

**Method C: Command Line (Advanced)**

```bash
cd /path/to/tasker
git init
git add .
git commit -m "Initial commit - Tasker app"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/tasker-app.git
git push -u origin main
```

### **Step 4: Verify Upload**

Go to your GitHub repository URL:
```
https://github.com/YOUR_USERNAME/tasker-app
```

You should see:
- ✅ README.md displayed at the bottom
- ✅ All folders: server/, client/, shared/
- ✅ Configuration files: package.json, vite.config.ts, .replit
- ✅ Documentation files: *.md files

---

## 📥 Import to New Replit

### **Step 1: Import from GitHub**

1. Go to https://replit.com
2. Click **Create Repl**
3. Select **Import from GitHub**
4. Paste your repository URL:
   ```
   https://github.com/YOUR_USERNAME/tasker-app
   ```
5. Click **Import from GitHub**

### **Step 2: Enable PostgreSQL**

1. In your new Replit, go to **Tools** (left sidebar)
2. Click **Database**
3. Select **PostgreSQL**
4. Click **Enable PostgreSQL**
5. Replit will automatically set the `DATABASE_URL` environment variable

### **Step 3: Install & Run**

Open the Shell in your new Replit and run:

```bash
npm install
npm run dev
```

**The app will:**
- ✅ Auto-create all 18 database tables
- ✅ Create default admin user (admin/admin123)
- ✅ Start on port 5000
- ✅ Be ready to use!

### **Step 4: Access Your App**

Replit will show you the URL, usually:
```
https://your-repl-name.replit.app
```

Or click the **Webview** tab to see it.

**Login**: 
- Go to `/admin`
- Username: `admin`
- Password: `admin123`

---

## 🐦 Twitter OAuth Setup

After the app is running, you need to set up Twitter developer apps:

### **1. Get Your Replit URL**

Your callback URLs will be:
```
https://your-repl-name.replit.app/auth/x/callback/app_UNIQUE_ID
```

### **2. Create Twitter Developer App**

1. Go to https://developer.twitter.com
2. Create a new app
3. Settings → OAuth 2.0 Settings
4. Type: "Web App"
5. Callback URL: `https://your-repl-name.replit.app/auth/x/callback/app_UNIQUE_ID`
   - Replace `your-repl-name` with your actual Replit name
   - Replace `UNIQUE_ID` with any unique string (e.g., `app_001`)
6. Save **Client ID** and **Client Secret**

### **3. Add to Tasker**

1. Login to your Tasker admin panel
2. Go to **Twitter Apps**
3. Click **Add Twitter App**
4. Fill in:
   - **App Name**: Any name (e.g., "My Twitter App")
   - **Client ID**: From Twitter Developer Portal
   - **Client Secret**: From Twitter Developer Portal
   - **Callback URL**: `https://your-repl-name.replit.app/auth/x/callback/app_UNIQUE_ID`
5. Click **Save**

### **4. Test OAuth**

1. In the Twitter Apps list, click **Test Auth**
2. Follow the on-screen instructions
3. You'll be redirected to Twitter to authorize
4. After authorization, check **Users** page
5. You should see your authenticated Twitter account!

---

## ✅ Verification Checklist

After setup, verify everything works:

- [ ] PostgreSQL is enabled
- [ ] App runs on port 5000 without errors
- [ ] Can access landing page at `/`
- [ ] Can access admin at `/admin`
- [ ] Can login with admin/admin123
- [ ] Database has 18 tables (check logs or use Drizzle Studio)
- [ ] Twitter app is added
- [ ] OAuth test works
- [ ] User appears in Users page after OAuth

---

## 🔧 Environment Variables (Optional)

In your Replit, go to **Tools → Secrets** and add:

```
DATABASE_URL = (automatically set by PostgreSQL)
SESSION_SECRET = your-random-secret-change-this
NODE_ENV = production
```

**Note**: `DATABASE_URL` is automatically set when you enable PostgreSQL.

---

## 🐛 Common Issues

### "Database connection failed"
**Solution**: Enable PostgreSQL in Tools → Database → PostgreSQL

### "Can't login to admin"
**Solution**: 
- Default credentials: `admin` / `admin123`
- Restart app to trigger database initialization

### "OAuth callback 404"
**Solution**: 
- Verify callback URL in Twitter Developer Portal matches exactly
- Format: `https://your-repl-name.replit.app/auth/x/callback/app_xxx`

### "npm install fails"
**Solution**: Try `npm install --legacy-peer-deps`

### "Port already in use"
**Solution**: The app uses port 5000 (Replit default), should work automatically

---

## 📚 Next Steps

1. ✅ Change admin password (Admin → Settings)
2. ✅ Customize landing page (Admin → Landing Page Config)
3. ✅ Add more Twitter apps for scaling
4. ✅ Set up Telegram notifications (Admin → Telegram Settings)
5. ✅ Test the waitlist flow (go to `/` and click button)
6. ✅ Monitor users (Admin → Users)

---

## 📖 Documentation

All documentation is in this folder:

- **README.md** - Main documentation with quick start
- **replit.md** - Replit Agent configuration (auto-read by Agent)
- **QUICK_START.md** - 5-minute setup guide
- **SETUP.md** - Detailed setup instructions
- **FEATURES.md** - Complete feature list
- **ARCHITECTURE.md** - Technical architecture
- **TRANSFER_GUIDE.md** - Multiple transfer methods

---

## 🎯 You're All Set!

The app is now running independently on your new Replit. You can:
- Add Twitter developer apps
- Configure the landing page
- Collect users via OAuth waitlist
- Post tweets to authenticated accounts
- Manage everything from the admin panel

**Default Login**: `admin` / `admin123` ⚠️ Change this!

---

## 💡 Tips

- **Use GitHub Desktop** for easier file management
- **Keep your repo private** if it contains sensitive configs
- **Enable GitHub sync** in Replit to auto-push changes
- **Use Secrets** for API keys, never hardcode them
- **Test locally first** before adding production Twitter apps

---

**Need Help?** Check the other documentation files or review the code!

🎉 **Happy Building!**
