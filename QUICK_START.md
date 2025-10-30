# ⚡ Tasker App - Quick Start (5 Minutes)

## 🚀 Fastest Way to Transfer

### 1. Create Git Repo (2 minutes)

**In current Replit Shell:**
```bash
cd tasker
git init
git add -A
git config user.email "your-email@example.com"
git config user.name "Your Name"
git commit -m "Initial Tasker export"
```

### 2. Push to GitHub (1 minute)

**Option A - Via GitHub Website:**
1. Go to https://github.com/new
2. Create repo: "tasker-app"
3. Copy the HTTPS URL

**Then in Shell:**
```bash
git remote add origin https://github.com/YOUR_USERNAME/tasker-app.git
git branch -M main
git push -u origin main
```

**Option B - Via GitHub CLI:**
```bash
gh repo create tasker-app --public --source=. --remote=origin
git push -u origin main
```

### 3. Import to New Replit (1 minute)

1. Go to https://replit.com
2. **Create Repl** → **Import from GitHub**
3. Paste: `https://github.com/YOUR_USERNAME/tasker-app`
4. Click **Import**

### 4. Configure & Run (1 minute)

**In new Replit:**
```bash
# Enable PostgreSQL
# Tools → Database → PostgreSQL → Enable

# Install & Run
npm install
npm run dev
```

**The app will run on port 5000** (Replit's default port)

**Done!** 🎉

---

## ✅ Verify It Works

1. Open the app (Replit will show the URL)
2. Login: `admin` / `admin123`
3. You should see the admin dashboard

---

## 🔑 Update Twitter Callbacks

**IMPORTANT:** Update your Twitter app callback URLs:

**Old:**
```
https://rsolans.pro/auth/x/callback/app_xxx
```

**New:**
```
https://YOUR-REPL-NAME.replit.app/auth/x/callback/app_xxx
```

### How to Update:
1. [Twitter Developer Portal](https://developer.twitter.com)
2. Your App → Settings → OAuth 2.0
3. Update Callback URL
4. Save

Then in Tasker:
- Admin → Twitter Apps
- Delete old apps
- Add new apps with updated callback URLs

---

## 📝 Default Login

- Username: `admin`
- Password: `admin123`

---

## 🎯 What You Get

✅ Complete admin panel on port 3000
✅ Twitter OAuth authentication system
✅ User management with duplicate detection  
✅ Landing page with waitlist
✅ 18 database tables auto-created
✅ Telegram notifications ready
✅ All features from main app

---

## 🆘 Quick Fixes

**"Database connection failed"**
→ Enable PostgreSQL in Tools → Database

**"Can't login"**
→ Wait for database auto-init, then try again

**"OAuth doesn't work"**
→ Update Twitter app callback URLs (see above)

---

## 📚 Full Docs

- See `TRANSFER_GUIDE.md` for detailed steps
- See `TASKER_SETUP_INSTRUCTIONS.md` for complete setup
- See `README.md` in tasker folder for features

---

**That's it!** Your Tasker app is now running independently. 🚀
