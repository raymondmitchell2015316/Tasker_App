# 🚀 Tasker App Transfer Guide

## Method 1: Git Repository (Recommended) ✅

### Step 1: Create Git Repository in Current Replit

Open the **Shell** in this Replit and run:

```bash
cd tasker
git init
git add -A
git config user.email "you@example.com"
git config user.name "Your Name"
git commit -m "Initial Tasker app export"
```

### Step 2: Push to GitHub

**Option A: Create GitHub Repo via CLI (if you have GitHub CLI)**
```bash
# Install GitHub CLI if not available
gh repo create tasker-app --public --source=. --remote=origin
git push -u origin main
```

**Option B: Create GitHub Repo Manually**
1. Go to https://github.com/new
2. Create a new repository named "tasker-app"
3. Copy the repository URL (e.g., `https://github.com/yourusername/tasker-app.git`)
4. Run in Shell:
```bash
git remote add origin https://github.com/yourusername/tasker-app.git
git branch -M main
git push -u origin main
```

### Step 3: Import to New Replit

1. Go to https://replit.com
2. Click **Create Repl**
3. Select **Import from GitHub**
4. Enter your repository URL: `https://github.com/yourusername/tasker-app`
5. Replit will automatically import all files
6. Click **Create Repl**

### Step 4: Configure New Replit

Once imported, run these commands in the new Replit Shell:

```bash
# Install dependencies
npm install

# Set up PostgreSQL (if not auto-detected)
# Go to Tools → Database → PostgreSQL → Enable
```

### Step 5: Set Environment Variables

In your new Replit, go to **Tools → Secrets** and add:

```
DATABASE_URL = (automatically set by Replit PostgreSQL)
SESSION_SECRET = your-random-secret-here-change-this
NODE_ENV = production
```

### Step 6: Start the App

```bash
npm run dev
```

The app will:
- ✅ Auto-create all 18 database tables
- ✅ Create default admin user (admin/admin123)
- ✅ Start backend on port 3000
- ✅ Start frontend dev server on port 3001

---

## Method 2: Manual File Copy (Alternative)

If you prefer not to use Git:

### Step 1: Create New Node.js Replit

1. Go to https://replit.com
2. Click **Create Repl**
3. Select **Node.js** template
4. Name it "tasker-app"

### Step 2: Copy Files

**In Current Replit:**
1. Open Shell and create archive:
```bash
cd tasker
tar -czf tasker-export.tar.gz --exclude='node_modules' .
```

2. Download the archive:
   - In the Files panel, right-click `tasker-export.tar.gz`
   - Select **Download**

**In New Replit:**
1. Upload `tasker-export.tar.gz` to the root directory
2. In Shell, extract:
```bash
tar -xzf tasker-export.tar.gz
rm tasker-export.tar.gz
```

3. Install dependencies:
```bash
npm install
```

### Step 3: Configure Database

1. Enable PostgreSQL: **Tools → Database → PostgreSQL**
2. The `DATABASE_URL` will be set automatically

### Step 4: Start the App

```bash
npm run dev
```

---

## Method 3: Replit Import (Fastest)

### Step 1: Make Repository Public

In current Replit:
1. Click **Share** button (top right)
2. Make sure "Public" is selected
3. Copy the Replit URL

### Step 2: Fork/Import

1. Open the Replit URL in a new browser tab
2. Click **Fork** button
3. This creates a complete copy

### Step 3: Configure

1. Enable PostgreSQL in the forked Replit
2. Run `npm install`
3. Run `npm run dev`

---

## 🔧 Post-Transfer Checklist

After transferring to new Replit, verify:

- [ ] PostgreSQL database enabled
- [ ] `npm install` completed successfully
- [ ] Database tables auto-created (check logs)
- [ ] Admin login works (admin/admin123)
- [ ] Frontend loads at port 3000
- [ ] Backend API responds at port 3000/api

## 🐦 Twitter App Configuration

**IMPORTANT:** Update Twitter Developer Portal callback URLs!

### Old Callback URLs (Won't Work):
```
https://rsolans.pro/auth/x/callback/app_xxx
```

### New Callback URLs (Use These):
```
https://your-new-replit-name.replit.app/auth/x/callback/app_xxx
```

Or if you have a custom domain:
```
https://your-custom-domain.com/auth/x/callback/app_xxx
```

### Steps to Update:
1. Go to [Twitter Developer Portal](https://developer.twitter.com)
2. For each Twitter app you created:
   - Settings → OAuth 2.0 Settings
   - Update Callback URL to new domain
   - Save changes
3. In Tasker Admin → Twitter Apps:
   - Delete old apps with wrong callback URLs
   - Add new apps with correct callback URLs

## 📝 Default Credentials

- **Admin Username:** `admin`
- **Admin Password:** `admin123`

⚠️ **Change this immediately in production!**

## 🚨 Common Issues & Solutions

### Issue: "Database connection failed"
**Solution:** Enable PostgreSQL in Tools → Database → PostgreSQL

### Issue: "Admin login doesn't work"
**Solution:** Database not initialized. Restart app to trigger auto-init.

### Issue: "OAuth callback 404"
**Solution:** Update Twitter app callback URLs to match your new Replit domain.

### Issue: "Port 3000 already in use"
**Solution:** Check `.replit` file has correct run command: `npm run dev`

### Issue: "npm install fails"
**Solution:** Try `npm install --legacy-peer-deps`

---

## 📚 File Structure Reference

Your new Replit should have:

```
/
├── server/
│   ├── index.ts          # Main Express server
│   ├── auth.ts           # Admin authentication
│   ├── twitter.ts        # Twitter OAuth service
│   ├── telegram.ts       # Telegram notifications
│   └── db.ts             # Database connection
├── client/
│   ├── src/
│   │   ├── pages/        # React pages
│   │   ├── components/   # React components
│   │   └── lib/          # Utilities
│   ├── index.html
│   └── vite.config.ts
├── shared/
│   └── schema.ts         # Drizzle schema (18 tables)
├── package.json
├── tsconfig.json
├── .replit               # Replit configuration
└── README.md             # Documentation
```

---

## 🎯 Next Steps After Transfer

1. **Update Domain Settings**
   - Update `CUSTOM_DOMAIN` in Secrets if using custom domain
   - Update all Twitter app callback URLs

2. **Test OAuth Flow**
   - Go to landing page (http://your-repl.replit.app)
   - Click "Join Waitlist"
   - Complete Twitter authentication
   - Verify user appears in Admin → Users

3. **Configure Landing Page**
   - Admin → Landing Page Config
   - Customize title, subtitle, colors
   - Set button action (waitlist/coming_soon/etc)

4. **Set Up Telegram (Optional)**
   - Admin → Telegram Settings
   - Add bot token and chat ID
   - Test notification

5. **Add Twitter Apps**
   - Admin → Twitter Apps
   - Add your Twitter developer apps
   - Configure client ID, secret, callback URL

---

## ✅ Success Indicators

You'll know the transfer worked when:

1. ✅ Admin login page loads
2. ✅ Can login with admin/admin123
3. ✅ Dashboard shows 0 Twitter Apps, 0 Users
4. ✅ Landing page loads with default config
5. ✅ Database has 18 tables (check with SQL query)
6. ✅ No errors in console/logs

---

## 💡 Pro Tips

- **Use Git Method** for version control and easy updates
- **Enable GitHub Integration** in Replit for automatic syncing
- **Set up Custom Domain** for professional URLs
- **Use Secrets** for sensitive data, never hardcode
- **Monitor Logs** in Replit console for errors
- **Test Locally First** before adding real Twitter apps

---

Need help? Check the documentation files:
- `README.md` - Overview
- `SETUP.md` - Detailed setup
- `FEATURES.md` - Feature list
- `ARCHITECTURE.md` - Technical details

🎉 **You're all set! Happy building!**
