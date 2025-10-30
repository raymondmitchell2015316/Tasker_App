# ✅ Tasker App - Configuration Changes for Clean Transfer

## 🔧 Changes Made (October 30, 2025)

### **Port Configuration Updated**
- ✅ Changed server from port 3000 → **5000** (Replit default)
- ✅ Changed Vite from port 3001 → **5000**
- ✅ Removed proxy configuration (no longer needed)
- ✅ Updated all documentation to reference port 5000

### **Workflow Removed**
- ✅ Removed "Tasker App" workflow from parent Replit
- ✅ App will not auto-run in parent project
- ✅ Clean state for new Replit deployment

### **Build Configuration**
- ✅ Updated `npm run dev` to build frontend first, then serve on port 5000
- ✅ Single command deployment ready
- ✅ No separate dev servers needed

### **Files Modified**

1. **tasker/server/index.ts**
   - Changed `const PORT = process.env.PORT || 3000;`
   - To: `const PORT = process.env.PORT || 5000;`

2. **tasker/vite.config.ts**
   - Removed proxy configuration
   - Changed port from 3001 to 5000
   - Simplified to use `strictPort: false` for flexibility

3. **tasker/package.json**
   - Updated dev script: `"dev": "npm run build && NODE_ENV=development tsx server/index.ts"`
   - Now builds frontend then starts server on same port

4. **tasker/.replit** (New file)
   - Added Replit configuration
   - Run command: `npm run dev`
   - Ready for deployment

5. **Documentation Files**
   - QUICK_START.md - Updated port references
   - TASKER_SETUP_INSTRUCTIONS.md - Updated all endpoints and instructions
   - TRANSFER_GUIDE.md - Already generic (no changes needed)

### **Ready for Transfer**

The app is now configured to:
- ✅ Run on port 5000 out of the box
- ✅ Work with Replit's default URL structure
- ✅ No workflow conflicts
- ✅ Single-command startup: `npm run dev`
- ✅ Clean separation from parent app

---

## 📦 Export Files

Two export packages available:

1. **tasker-app-export.tar.gz** (Original - 146 KB)
2. **tasker-app-export-v2.tar.gz** (Updated - Port 5000)

**Use the v2 export** for clean transfer to new Replit!

---

## 🚀 Transfer Instructions

### **Quick Transfer (5 minutes)**

1. **Create Git Repo**
   ```bash
   cd tasker
   git init
   git add -A
   git config user.email "your-email@example.com"
   git config user.name "Your Name"
   git commit -m "Tasker app - Port 5000 config"
   ```

2. **Push to GitHub**
   ```bash
   # Create repo on GitHub, then:
   git remote add origin https://github.com/yourusername/tasker-app.git
   git branch -M main
   git push -u origin main
   ```

3. **Import to New Replit**
   - Create Repl → Import from GitHub
   - Paste your repo URL
   - Enable PostgreSQL
   - Run: `npm install && npm run dev`

4. **Update Twitter Callbacks**
   - Old: `https://rsolans.pro/auth/x/callback/app_xxx`
   - New: `https://your-new-repl.replit.app/auth/x/callback/app_xxx`

---

## ✅ What You Get

- **Clean Configuration**: No port conflicts, ready for Replit
- **Single Port**: Everything on 5000 (Replit default)
- **No Workflows**: Won't interfere with parent app
- **Full Documentation**: 3 setup guides included
- **Production Ready**: Just add Twitter apps and go!

---

## 🎯 URLs After Transfer

**Your New Tasker App:**
- Landing page: `https://your-repl.replit.app/`
- Admin login: `https://your-repl.replit.app/admin`
- OAuth callback: `https://your-repl.replit.app/auth/x/callback/app_xxx`

**No more port 3000/3001 references!** Everything uses the default Replit URL.

---

## 📝 Next Steps

1. Transfer to new Replit (see QUICK_START.md)
2. Enable PostgreSQL
3. Run `npm install && npm run dev`
4. Login with admin/admin123
5. Update Twitter app callback URLs
6. Test OAuth flow
7. Start building!

---

**All set for a clean transfer!** 🎉
