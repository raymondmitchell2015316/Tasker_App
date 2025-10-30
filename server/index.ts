import express from 'express';
import session from 'express-session';
import connectPgSimple from 'connect-pg-simple';
import { Pool } from 'pg';
import * as dotenv from 'dotenv';
import crypto from 'crypto';
import path from 'path';
import { fileURLToPath } from 'url';
import { twitterService } from './twitter';
import { requireAuth, authenticateAdmin, initializeDefaultAdmin } from './auth';
import { jobManager } from './jobManager';
import { TelegramService } from './telegram';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// PostgreSQL session store
const PgSession = connectPgSimple(session);
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Initialize Telegram service
const telegramService = new TelegramService(pool);

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging middleware (logs ALL requests to terminal)
app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      console.log(`[tasker] ${logLine}`);
    }
  });

  next();
});

app.use(
  session({
    store: new PgSession({
      pool,
      tableName: 'session',
    }),
    secret: process.env.SESSION_SECRET || crypto.randomBytes(32).toString('hex'),
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
    },
  })
);

// Serve static files from built frontend
const distPath = path.join(__dirname, '../dist');
app.use(express.static(distPath));

// Declare session types
declare module 'express-session' {
  interface SessionData {
    adminId: number;
    username: string;
  }
}

// ==================== CLIENT LOGGING ENDPOINT ====================

app.post('/api/logs', (req, res) => {
  try {
    const { level, message, data } = req.body;
    const timestamp = new Date().toISOString();
    
    // Format log for terminal output
    let logMessage = `[client-${level}] ${message}`;
    if (data) {
      logMessage += ` :: ${JSON.stringify(data)}`;
    }
    
    // Log to terminal based on level
    switch (level) {
      case 'error':
        console.error(logMessage);
        break;
      case 'warn':
        console.warn(logMessage);
        break;
      case 'info':
      case 'log':
      default:
        console.log(logMessage);
        break;
    }
    
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Logging failed' });
  }
});

// ==================== AUTHENTICATION ROUTES ====================

app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    console.log('[login] Attempting login for user:', username);
    const result = await authenticateAdmin(username, password);

    if (result.success && result.user) {
      req.session.adminId = result.user.id;
      req.session.username = result.user.username;
      
      // Save session and wait for confirmation
      req.session.save((err) => {
        if (err) {
          console.error('[login] ❌ Session save error:', err);
          return res.status(500).json({ success: false, error: 'Session save failed' });
        }
        
        console.log('[login] ✅ Login successful:', {
          adminId: req.session.adminId,
          username: req.session.username,
          sessionId: req.sessionID
        });
        
        res.json({ success: true, user: { username: result.user.username } });
      });
    } else {
      console.log('[login] ❌ Login failed:', result.error);
      res.status(401).json({ success: false, error: result.error });
    }
  } catch (error) {
    console.error('[login] ❌ Login error:', error);
    res.status(500).json({ success: false, error: 'Login failed' });
  }
});

app.post('/api/auth/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      res.status(500).json({ success: false, error: 'Logout failed' });
    } else {
      res.json({ success: true });
    }
  });
});

app.get('/api/auth/session', (req, res) => {
  console.log('[session] Session check:', {
    adminId: req.session?.adminId,
    username: req.session?.username,
    sessionId: req.sessionID
  });
  
  if (req.session?.adminId) {
    res.json({ 
      success: true, 
      authenticated: true, 
      user: { username: req.session.username } 
    });
  } else {
    res.json({ success: true, authenticated: false });
  }
});

// ==================== TWITTER APP MANAGEMENT ====================

app.get('/api/twitter-apps', requireAuth, async (req, res) => {
  try {
    const apps = await twitterService.getTwitterApps();
    res.json({ success: true, data: apps });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch Twitter apps' });
  }
});

app.post('/api/twitter-apps', requireAuth, async (req, res) => {
  try {
    const app = await twitterService.createTwitterApp(req.body);
    res.json({ success: true, data: app });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to create Twitter app' });
  }
});

app.put('/api/twitter-apps/:id', requireAuth, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const app = await twitterService.updateTwitterApp(id, req.body);
    res.json({ success: true, data: app });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to update Twitter app' });
  }
});

app.delete('/api/twitter-apps/:id', requireAuth, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const success = await twitterService.deleteTwitterApp(id);
    res.json({ success });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to delete Twitter app' });
  }
});

// Generate callback URL
app.post('/api/twitter-apps/generate-callback', requireAuth, async (req, res) => {
  try {
    const uniqueId = crypto.randomBytes(8).toString('hex');
    const protocol = req.get('x-forwarded-proto') || req.protocol;
    const host = process.env.NODE_ENV === 'production' && process.env.CUSTOM_DOMAIN 
      ? process.env.CUSTOM_DOMAIN 
      : req.get('host') || 'localhost:3000';
    
    const callbackUrl = `${protocol}://${host}/auth/twitter/callback/${uniqueId}`;
    
    res.json({
      success: true,
      callbackUrl,
      uniqueId,
      instructions: [
        `Go to your Twitter Developer Portal`,
        `Select your app and go to Settings`,
        `Add this callback URL to your OAuth 2.0 settings`,
        `Make sure to save the changes`,
        `Use this exact URL when creating the Twitter app in this system`
      ]
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to generate callback URL' });
  }
});

// Test auth for specific app
app.post('/api/twitter-apps/:id/test-auth', requireAuth, async (req, res) => {
  try {
    const appId = parseInt(req.params.id);
    const result = await twitterService.generateOAuthUrl(appId, true); // isTestAuth = true
    
    if (result.success) {
      res.json({ success: true, authUrl: result.authUrl });
    } else {
      res.status(400).json({ success: false, error: result.error });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to generate test auth URL' });
  }
});

// Test tweet for specific app
app.post('/api/twitter-apps/:id/test-tweet', requireAuth, async (req, res) => {
  try {
    const appId = parseInt(req.params.id);
    const {message} = req.body;
    const users = await twitterService.getSocialUsers();
    const appUser = users.find(u => u.twitterAppId === appId && u.isActive);
    
    if (!appUser) {
      return res.status(400).json({ 
        success: false, 
        error: 'No active users found for this app. Connect an account first.' 
      });
    }
    
    const result = await twitterService.postTweet(appUser.username, message || `🧪 Test tweet from App ID ${appId} at ${new Date().toLocaleTimeString()}`);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to post test tweet' });
  }
});

// Refresh tokens for specific app
app.post('/api/twitter-apps/:id/refresh-tokens', requireAuth, async (req, res) => {
  try {
    const appId = parseInt(req.params.id);
    const { batchSize = 5, maxTokens = 10 } = req.body;
    const users = await twitterService.getSocialUsers();
    const appUsers = users.filter(u => u.twitterAppId === appId);
    
    let refreshed = 0;
    let failed = 0;
    const results = [];
    
    for (const user of appUsers.slice(0, maxTokens)) {
      try {
        await twitterService.refreshUserToken(user.username);
        refreshed++;
        results.push({ username: user.username, success: true });
      } catch (error: any) {
        failed++;
        results.push({ username: user.username, success: false, error: error.message });
      }
    }
    
    res.json({ success: true, refreshed, failed, results });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to refresh tokens' });
  }
});

// Bulk refresh tokens across all apps
app.post('/api/twitter-apps/bulk-refresh-tokens', requireAuth, async (req, res) => {
  try {
    const { batchSize = 5, tokensPerApp = 5 } = req.body;
    const apps = await twitterService.getTwitterApps();
    const activeApps = apps.filter((a: any) => a.isActive);
    
    console.log(`[bulk-refresh] 🚀 Starting bulk refresh for ${activeApps.length} apps`);
    console.log(`[bulk-refresh] 📊 Settings: tokensPerApp=${tokensPerApp}, batchSize=${batchSize}`);
    
    const jobId = jobManager.createJob('bulk_refresh', activeApps.length, 'Starting bulk token refresh...');
    
    // Start background job
    (async () => {
      try {
        console.log(`[bulk-refresh] 🔄 Job ${jobId} - Processing started`);
        jobManager.updateJob(jobId, { stage: 'processing', message: 'Refreshing tokens...' });
        const users = await twitterService.getSocialUsers();
        let totalRefreshed = 0;
        let totalFailed = 0;
        const successfulAccounts: string[] = [];
        const failedAccounts: Array<{ username: string; error: string }> = [];
        
        for (const app of activeApps) {
          const appUsers = users.filter((u: any) => u.twitterAppId === app.id).slice(0, tokensPerApp);
          console.log(`[bulk-refresh] 🐦 Processing ${app.appName}: ${appUsers.length} users`);
          
          let appRefreshed = 0;
          let appFailed = 0;
          
          for (const user of appUsers) {
            try {
              console.log(`[bulk-refresh] 🔄 Refreshing token for @${user.username} (${app.appName})`);
              const result = await twitterService.refreshUserToken(user.username);
              if (result.success) {
                totalRefreshed++;
                appRefreshed++;
                successfulAccounts.push(user.username);
                console.log(`[bulk-refresh] ✅ Token refreshed for @${user.username}`);
              } else {
                totalFailed++;
                appFailed++;
                failedAccounts.push({ username: user.username, error: result.error || 'Unknown error' });
                console.log(`[bulk-refresh] ❌ Failed to refresh @${user.username}: ${result.error}`);
                jobManager.addError(jobId, `❌ ${app.appName}: Failed @${user.username} - ${result.error}`);
              }
            } catch (error: any) {
              totalFailed++;
              appFailed++;
              failedAccounts.push({ username: user.username, error: error.message });
              console.error(`[bulk-refresh] ❌ Error refreshing @${user.username}:`, error.message);
              jobManager.addError(jobId, `❌ ${app.appName}: Failed @${user.username} - ${error.message}`);
            }
          }
          
          const appMessage = `✅ ${app.appName}: ${appRefreshed} refreshed, ${appFailed} failed`;
          console.log(`[bulk-refresh] ${appMessage}`);
          jobManager.incrementProgress(jobId, 1, appMessage);
          
          // Delay between apps
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
        
        const finalMessage = `Completed: ${totalRefreshed} refreshed, ${totalFailed} failed`;
        console.log(`[bulk-refresh] ✅ Job ${jobId} completed - ${finalMessage}`);
        console.log(`[bulk-refresh] 📊 Success: ${successfulAccounts.length}, Failed: ${failedAccounts.length}`);
        
        jobManager.updateJob(jobId, {
          done: true,
          success: totalFailed === 0,
          stage: 'completed',
          message: finalMessage,
          data: { 
            totalRefreshed, 
            totalFailed,
            totalApps: activeApps.length,
            successfulAccounts,
            failedAccounts
          }
        });
      } catch (error: any) {
        console.error(`[bulk-refresh] ❌ Job ${jobId} failed:`, error);
        jobManager.updateJob(jobId, {
          done: true,
          success: false,
          stage: 'failed',
          message: error.message
        });
      }
    })().catch((err) => {
      console.error(`[bulk-refresh] ❌ FATAL: Unhandled error in job ${jobId}:`, err);
    });
    
    res.json({ success: true, jobId });
  } catch (error) {
    console.error('[bulk-refresh] ❌ Error starting bulk refresh:', error);
    res.status(500).json({ success: false, error: 'Failed to start bulk refresh' });
  }
});

// Get users for specific app
app.get('/api/twitter-apps/:id/users', requireAuth, async (req, res) => {
  try {
    const appId = parseInt(req.params.id);
    const users = await twitterService.getSocialUsers();
    const appUsers = users.filter((u: any) => u.twitterAppId === appId);
    res.json({ success: true, data: appUsers });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch app users' });
  }
});

// ==================== TWITTER OAUTH ====================

// Helper function to generate callback URL
function generateCallbackUrl(req: express.Request, appId: string): string {
  const protocol = req.get('x-forwarded-proto') || req.protocol;
  const host = process.env.NODE_ENV === 'production' && process.env.CUSTOM_DOMAIN 
    ? process.env.CUSTOM_DOMAIN 
    : req.get('host') || 'localhost:5000';
  
  return `${protocol}://${host}/auth/twitter/callback/${appId}`;
}

app.get('/api/auth/twitter/url', async (req, res) => {
  try {
    const appId = req.query.appId ? parseInt(req.query.appId as string) : undefined;
    const isTestAuth = req.query.test === 'true';
    const result = await twitterService.generateOAuthUrl(appId, isTestAuth);

    if (result.success) {
      res.json({ success: true, authUrl: result.authUrl, appId: result.appId });
    } else {
      res.status(400).json({ success: false, error: result.error });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to generate OAuth URL' });
  }
});

// Support both /auth/twitter/callback/:appId and /auth/x/callback/:appId (legacy)
app.get(['/auth/twitter/callback/:appId', '/auth/x/callback/:appId'], async (req, res) => {
  try {
    const { code, state, error, error_description } = req.query;
    
    // Extract appId from state parameter (format: "prod_17_..." or "test_17_...")
    let appId: number;
    if (state && typeof state === 'string') {
      const stateParts = state.split('_');
      if (stateParts.length >= 2) {
        appId = parseInt(stateParts[1]); // Extract app ID from state
        console.log(`[oauth-callback] 📥 Extracted app ID ${appId} from state: ${state}`);
      } else {
        return res.status(400).send('Invalid OAuth state format');
      }
    } else {
      return res.status(400).send('Missing OAuth state parameter');
    }

    console.log(`[oauth-callback] 📥 Received callback - appId: ${appId}, state: ${state}, code: ${code ? code.toString().substring(0, 20) + '...' : 'none'}, error: ${error || 'none'}`);

    if (error) {
      console.log(`[oauth-callback] ❌ OAuth error: ${error} - ${error_description}`);
      return res.status(400).send(`
        <div style="font-family: Arial; max-width: 600px; margin: 50px auto; padding: 20px; text-align: center;">
          <h2 style="color: #ef4444;">❌ OAuth Error</h2>
          <p><strong>Error:</strong> ${error}</p>
          <p><strong>Description:</strong> ${error_description || 'Unknown error'}</p>
          <a href="/" style="color: #3b82f6;">Return to Home</a>
        </div>
      `);
    }

    if (!code || !state) {
      console.log(`[oauth-callback] ❌ Missing OAuth parameters - code: ${!!code}, state: ${!!state}`);
      return res.status(400).send('Missing OAuth parameters');
    }

    console.log(`[oauth-callback] ✅ Valid callback, processing with twitterService...`);
    const result = await twitterService.handleOAuthCallback(
      code as string,
      state as string,
      appId
    );

    if (result.success && result.user) {
      // Check if this was a returning user (by checking if they already had a record)
      const isReturningUser = result.isReturningUser || false;
      
      // Send Telegram notification
      if (isReturningUser) {
        console.log(`[oauth-callback] 🔄 Returning user authenticated: @${result.user.username}`);
      } else {
        await telegramService.sendUserAuthNotification(
          result.user.username,
          result.user.twitterId,
          result.user.followersCount || 0
        );
        console.log(`[oauth-callback] 🆕 New user authenticated: @${result.user.username}`);
      }
      
      // Redirect to landing page with success parameter and user type
      return res.redirect(`/?success=true&returning=${isReturningUser}`);
    } else {
      return res.status(400).send(`
        <div style="font-family: Arial; max-width: 600px; margin: 50px auto; padding: 20px; text-align: center;">
          <h2 style="color: #ef4444;">❌ Authentication Failed</h2>
          <p>${result.error}</p>
          <a href="/" style="color: #3b82f6;">Try Again</a>
        </div>
      `);
    }
  } catch (error) {
    res.status(500).send('OAuth callback failed');
  }
});

// ==================== TWEET POSTING ====================

app.post('/api/tweets', requireAuth, async (req, res) => {
  try {
    const { username, tweetText, appId } = req.body;
    
    let result;
    if (appId && !username) {
      // Post using specific app (any user from that app)
      result = await twitterService.postTweetWithApp(appId, tweetText);
    } else if (username) {
      // Post using specific username
      result = await twitterService.postTweet(username, tweetText);
    } else {
      return res.status(400).json({ success: false, error: 'Either username or appId is required' });
    }

    if (result.success) {
      res.json({ success: true, tweetId: result.tweetId, message: result.message });
    } else {
      res.status(400).json({ success: false, error: result.error });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to post tweet' });
  }
});

// ==================== USER MANAGEMENT ====================

app.get('/api/users', requireAuth, async (req, res) => {
  try {
    const users = await twitterService.getSocialUsers();
    res.json({ success: true, data: users });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch users' });
  }
});

// Delete user by ID
app.delete('/api/users/:id', requireAuth, async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    const success = await twitterService.deleteUser(userId);
    res.json({ success });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to delete user' });
  }
});

// Bulk delete users (for cleanup after bulk operations)
app.post('/api/users/bulk-delete', requireAuth, async (req, res) => {
  try {
    const { usernames } = req.body;
    
    if (!Array.isArray(usernames) || usernames.length === 0) {
      return res.status(400).json({ success: false, error: 'Invalid usernames array' });
    }
    
    console.log(`[bulk-delete] 🗑️ Deleting ${usernames.length} users`);
    let deleted = 0;
    let failed = 0;
    
    for (const username of usernames) {
      try {
        const success = await twitterService.deleteUser(username);
        if (success) {
          deleted++;
          console.log(`[bulk-delete] ✅ Deleted @${username}`);
        } else {
          failed++;
          console.log(`[bulk-delete] ❌ Failed to delete @${username}`);
        }
      } catch (error) {
        failed++;
        console.error(`[bulk-delete] ❌ Error deleting @${username}:`, error);
      }
    }
    
    console.log(`[bulk-delete] ✅ Completed - Deleted: ${deleted}, Failed: ${failed}`);
    res.json({ success: true, deleted, failed });
  } catch (error) {
    console.error('[bulk-delete] ❌ Error:', error);
    res.status(500).json({ success: false, error: 'Failed to bulk delete users' });
  }
});

// Refresh individual user token
app.post('/api/users/:username/refresh', requireAuth, async (req, res) => {
  try {
    const { username } = req.params;
    console.log(`[token-refresh] 🔄 Refreshing token for @${username}`);
    const result = await twitterService.refreshUserToken(username);
    if (result.success) {
      console.log(`[token-refresh] ✅ Token refreshed successfully for @${username}`);
    } else {
      console.log(`[token-refresh] ❌ Token refresh failed for @${username}: ${result.error}`);
    }
    res.json({ success: true });
  } catch (error) {
    console.error(`[token-refresh] ❌ Error refreshing token for @${username}:`, error);
    res.status(500).json({ success: false, error: 'Failed to refresh token' });
  }
});

// ==================== TWEET HISTORY ====================

app.get('/api/tweet-history', requireAuth, async (req, res) => {
  try {
    const history = await twitterService.getTweetHistory();
    res.json({ success: true, data: history });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch tweet history' });
  }
});

// ==================== GENERAL POST ====================

app.post('/api/tweets/general-post', requireAuth, async (req, res) => {
  try {
    const { message, maxAppsToUse, useRandomApps, batchSettings } = req.body;
    console.log(`[general-post] 🚀 Starting general post to ${maxAppsToUse} apps`);
    
    const apps = await twitterService.getTwitterApps();
    const activeApps = apps.filter((a: any) => a.isActive);
    const appsToUse = useRandomApps 
      ? activeApps.sort(() => Math.random() - 0.5).slice(0, maxAppsToUse)
      : activeApps.slice(0, maxAppsToUse);
    
    console.log(`[general-post] 🐦 Using ${appsToUse.length} apps: ${appsToUse.map((a: any) => a.appName).join(', ')}`);
    
    const users = await twitterService.getSocialUsers();
    let successful = 0;
    let failed = 0;
    
    for (const app of appsToUse) {
      const appUsers = users.filter((u: any) => u.twitterAppId === app.id && u.isActive);
      console.log(`[general-post] 📤 Posting to ${appUsers.length} users from ${app.appName}`);
      
      for (const user of appUsers.slice(0, batchSettings?.batchSize || 5)) {
        try {
          await twitterService.postTweet(user.username, message);
          successful++;
          console.log(`[general-post] ✅ Posted to @${user.username}`);
        } catch (error) {
          failed++;
          console.log(`[general-post] ❌ Failed to post to @${user.username}`);
        }
        
        // Delay between posts
        if (batchSettings?.delayBetweenBatches) {
          await new Promise(resolve => setTimeout(resolve, batchSettings.delayBetweenBatches));
        }
      }
    }
    
    console.log(`[general-post] ✅ Completed - Success: ${successful}, Failed: ${failed}`);
    res.json({ success: true, successful, failed, total: successful + failed });
  } catch (error) {
    console.error('[general-post] ❌ Error:', error);
    res.status(500).json({ success: false, error: 'Failed to execute general post' });
  }
});

// ==================== BULK POSTING ====================

// Job tracking using JobManager (matches main app)

app.post('/api/tweets/bulk', requireAuth, async (req, res) => {
  try {
    const { useRandomAccounts, numAccounts, selectedAccounts, tweetVariations, maxTweets, minDelay, maxDelay, batchSize, usernameTagList, maxTagsPerPost, quoteTweetUrl } = req.body;
    
    const users = await twitterService.getSocialUsers();
    const activeUsers = users.filter((u: any) => u.isActive);
    
    let accountsToUse: any[];
    if (useRandomAccounts) {
      const shuffled = [...activeUsers].sort(() => Math.random() - 0.5);
      accountsToUse = shuffled.slice(0, numAccounts);
    } else {
      accountsToUse = activeUsers.filter((u: any) => selectedAccounts.includes(u.username));
    }

    // Apply maxTweets limit if specified
    if (maxTweets && maxTweets > 0) {
      accountsToUse = accountsToUse.slice(0, maxTweets);
      console.log(`[bulk-post] 🔢 Max tweets limit applied: ${accountsToUse.length} tweets will be posted`);
    }

    // Parse username tag list
    const usernameTags = usernameTagList 
      ? usernameTagList
          .split('\n')
          .map((u: string) => u.trim())
          .filter((u: string) => u.length > 0)
          .map((u: string) => u.startsWith('@') ? u : `@${u}`)
      : [];

    // Clamp maxTagsPerPost to prevent duplicates within a single tweet
    const effectiveMaxTags = usernameTags.length > 0 
      ? Math.min(maxTagsPerPost || 0, usernameTags.length) 
      : 0;

    const jobId = jobManager.createJob('bulk_post', accountsToUse.length, 'Starting bulk post...');

    // Start background job
    (async () => {
      console.log(`[bulk-post] 🚀 Job ${jobId} started with ${accountsToUse.length} accounts`);
      if (usernameTags.length > 0) {
        console.log(`[bulk-post] 🏷️ Tag list: ${usernameTags.length} usernames, max ${effectiveMaxTags} per post`);
      }
      
      try {
        jobManager.updateJob(jobId, { stage: 'processing', message: 'Posting tweets...' });

        const successfulAccounts: Array<{username: string, tweet: string, tweetId?: string}> = [];
        const failedAccounts: Array<{username: string, tweet: string, error: string}> = [];

        // Shuffle username tags for random selection without repetition
        let shuffledTags = [...usernameTags].sort(() => Math.random() - 0.5);
        let tagIndex = 0;

        for (const user of accountsToUse) {
          let variation = tweetVariations[Math.floor(Math.random() * tweetVariations.length)];
          
          // Add tags if available
          if (usernameTags.length > 0 && effectiveMaxTags > 0) {
            const tagsToAdd: string[] = [];
            
            for (let i = 0; i < effectiveMaxTags; i++) {
              // Reshuffle if we've exhausted the list
              if (tagIndex >= shuffledTags.length) {
                shuffledTags = [...usernameTags].sort(() => Math.random() - 0.5);
                tagIndex = 0;
                console.log(`[bulk-post] 🔄 Reshuffled tag list`);
              }
              
              tagsToAdd.push(shuffledTags[tagIndex]);
              tagIndex++;
            }
            
            variation = `${variation} ${tagsToAdd.join(' ')}`.trim();
            console.log(`[bulk-post] 📤 Posting to @${user.username}: "${variation.substring(0, 60)}..." [${tagsToAdd.length} tags]${quoteTweetUrl ? ' [quote tweet]' : ''}`);
          } else {
            console.log(`[bulk-post] 📤 Posting to @${user.username}: "${variation.substring(0, 50)}..."${quoteTweetUrl ? ' [quote tweet]' : ''}`);
          }
          
          const result = await twitterService.postTweet(user.username, variation, quoteTweetUrl);
          
          if (result.success) {
            console.log(`[bulk-post] ✅ @${user.username}: Posted successfully (ID: ${result.tweetId})`);
            successfulAccounts.push({ 
              username: user.username, 
              tweet: variation,
              tweetId: result.tweetId
            });
            jobManager.incrementProgress(jobId, 1, `✅ @${user.username}: Posted successfully`);
          } else {
            console.log(`[bulk-post] ❌ @${user.username}: ${result.error}`);
            failedAccounts.push({ 
              username: user.username, 
              tweet: variation,
              error: result.error || 'Unknown error' 
            });
            jobManager.addError(jobId, `❌ @${user.username}: ${result.error}`);
            jobManager.incrementProgress(jobId, 1, `❌ @${user.username}: ${result.error}`);
          }

          // Random delay between posts
          const delay = Math.random() * (maxDelay - minDelay) + minDelay;
          console.log(`[bulk-post] ⏱️ Waiting ${delay.toFixed(1)}s before next post...`);
          await new Promise(resolve => setTimeout(resolve, delay * 1000));
        }

        console.log(`[bulk-post] ✅ Job completed - Success: ${successfulAccounts.length}, Failed: ${failedAccounts.length}`);
        console.log(`[bulk-post] 📋 Successful accounts: ${successfulAccounts.map(s => `@${s.username}`).join(', ') || 'none'}`);
        if (failedAccounts.length > 0) {
          console.log(`[bulk-post] ⚠️ Failed accounts: ${failedAccounts.map(f => `@${f.username} (${f.error})`).join(', ')}`);
        }

        jobManager.updateJob(jobId, {
          done: true,
          success: failedAccounts.length === 0,
          stage: 'completed',
          message: `Posted ${successfulAccounts.length}/${accountsToUse.length} tweets successfully`,
          data: { 
            totalProcessed: accountsToUse.length,
            successful: successfulAccounts.length,
            failed: failedAccounts.length,
            successfulAccounts,
            failedAccounts
          }
        });
      } catch (error: any) {
        console.error(`❌ Job ${jobId} failed:`, error);
        jobManager.updateJob(jobId, {
          done: true,
          success: false,
          stage: 'failed',
          message: error.message
        });
      }
    })().catch((err) => {
      console.error(`❌ FATAL: Unhandled error in job ${jobId}:`, err);
    });

    res.json({ success: true, jobId });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to start bulk posting' });
  }
});

// ==================== DUPLICATE MANAGEMENT ====================

app.post('/api/users/duplicates/preview', requireAuth, async (req, res) => {
  try {
    const { by } = req.body;
    const users = await twitterService.getSocialUsers();
    
    const groups = new Map<string, any[]>();
    users.forEach((user: any) => {
      const key = by === 'username' ? user.username : user.twitterId;
      if (!groups.has(key)) {
        groups.set(key, []);
      }
      groups.get(key)!.push(user);
    });

    const duplicates = Array.from(groups.entries())
      .filter(([_, users]) => users.length > 1)
      .map(([key, users]) => ({ key, count: users.length, users }));

    res.json({ success: true, groups: duplicates });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to preview duplicates' });
  }
});

app.post('/api/users/duplicates/fix', requireAuth, async (req, res) => {
  try {
    const { by } = req.body;
    const users = await twitterService.getSocialUsers();
    
    const groups = new Map<string, any[]>();
    users.forEach((user: any) => {
      const key = by === 'username' ? user.username : user.twitterId;
      if (!groups.has(key)) {
        groups.set(key, []);
      }
      groups.get(key)!.push(user);
    });

    const duplicates = Array.from(groups.values()).filter(g => g.length > 1);
    const jobId = jobManager.createJob('duplicate_fixer', duplicates.length || 1, 'Finding duplicates...');

    // Start background job
    (async () => {
      try {
        console.log(`[duplicate-fix] Job ${jobId} started with ${duplicates.length} groups`);
        jobManager.updateJob(jobId, { stage: 'processing', message: 'Fixing duplicates...' });

        if (duplicates.length === 0) {
          console.log('[duplicate-fix] No duplicates to fix');
          jobManager.updateJob(jobId, {
            done: true,
            success: true,
            stage: 'completed',
            message: 'No duplicates found',
            data: { totalFixed: 0 }
          });
          return;
        }

        let totalDeleted = 0;
        
        for (const group of duplicates) {
          // Smart sorting: prioritize active users with app links and most recent
          const sorted = group.sort((a, b) => {
            // First priority: active users with app links
            const aHasApp = a.twitterAppId ? 1 : 0;
            const bHasApp = b.twitterAppId ? 1 : 0;
            if (aHasApp !== bHasApp) return bHasApp - aHasApp;
            
            // Second priority: active users
            const aActive = a.isActive ? 1 : 0;
            const bActive = b.isActive ? 1 : 0;
            if (aActive !== bActive) return bActive - aActive;
            
            // Third priority: most recent
            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
          });
          
          // Keep the first (best) user, delete the rest
          const toKeep = sorted[0];
          const toDelete = sorted.slice(1);
          
          console.log(`[duplicate-fix] 🔍 Group: ${by === 'username' ? toKeep.username : toKeep.twitterId}`);
          console.log(`[duplicate-fix] ✅ Keeping: @${toKeep.username} (${toKeep.isActive ? 'active' : 'inactive'}, app: ${toKeep.twitterAppId || 'none'}, created: ${new Date(toKeep.createdAt).toISOString()})`);
          console.log(`[duplicate-fix] 🗑️ Deleting ${toDelete.length} duplicate(s)`);

          for (const user of toDelete) {
            console.log(`[duplicate-fix]    Deleting: ID ${user.id} - @${user.username} (${user.isActive ? 'active' : 'inactive'}, app: ${user.twitterAppId || 'none'}, created: ${new Date(user.createdAt).toISOString()})`);
            await twitterService.deleteUser(user.id); // Delete by ID, not username
            totalDeleted++;
          }

          jobManager.incrementProgress(jobId, 1, `🗑️ Kept @${toKeep.username}, removed ${toDelete.length} duplicate(s)`);
        }

        console.log(`[duplicate-fix] ✅ Job completed - ${totalDeleted} duplicates deleted`);
        jobManager.updateJob(jobId, {
          done: true,
          success: true,
          stage: 'completed',
          message: `Cleaned ${duplicates.length} duplicate groups (deleted ${totalDeleted} old entries)`,
          data: { 
            totalGroups: duplicates.length,
            totalDeleted 
          }
        });
      } catch (error: any) {
        console.error(`[duplicate-fix] Job ${jobId} failed:`, error);
        jobManager.updateJob(jobId, {
          done: true,
          success: false,
          stage: 'failed',
          message: error.message
        });
      }
    })().catch((err) => {
      console.error(`❌ FATAL: Unhandled error in job ${jobId}:`, err);
    });

    res.json({ success: true, jobId });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fix duplicates' });
  }
});

// ==================== TOKEN VALIDATION ====================

app.post('/api/users/validate-tokens', requireAuth, async (req, res) => {
  try {
    const users = await twitterService.getSocialUsers();
    const jobId = jobManager.createJob('validate_tokens', users.length, 'Starting token validation...');

    // Start background job
    (async () => {
      console.log(`[validate-tokens] 🚀 Job ${jobId} started`);
      try {
        jobManager.updateJob(jobId, { stage: 'processing', message: 'Validating tokens...' });
        
        console.log(`[validate-tokens] Found ${users.length} users to validate`);
        const refreshableAccounts: Array<{username: string, error: string, hasRefreshToken: boolean}> = [];
        const accountsToDelete: Array<{username: string, error: string, hasRefreshToken: boolean}> = [];
        const validAccounts: string[] = [];

        for (const user of users) {
          // Validate token by making a real Twitter API call
          try {
            if (!user.accessToken) {
              throw new Error('No access token');
            }
            
            // Make a real API call to verify the token works
            const response = await fetch('https://api.twitter.com/2/users/me', {
              headers: {
                'Authorization': `Bearer ${user.accessToken}`,
              },
            });
            
            if (response.status === 401) {
              throw new Error('Token expired or invalid');
            } else if (!response.ok) {
              throw new Error(`API error: ${response.status}`);
            }
            
            console.log(`[validate-tokens] ✅ @${user.username}: Token valid`);
            validAccounts.push(user.username);
            jobManager.incrementProgress(jobId, 1, `✅ @${user.username}: Token valid`);
          } catch (error: any) {
            const errorMsg = error.message;
            const hasRefreshToken = !!user.refreshToken;
            
            console.log(`[validate-tokens] ❌ @${user.username}: ${errorMsg} (refresh token: ${hasRefreshToken ? 'yes' : 'no'})`);
            jobManager.addError(jobId, `❌ @${user.username}: ${errorMsg}`);
            jobManager.incrementProgress(jobId, 1, `❌ @${user.username}: ${errorMsg}`);
            
            // Categorize: can refresh if has refresh token and token is expired/invalid
            if (hasRefreshToken && (errorMsg.includes('expired') || errorMsg.includes('invalid'))) {
              refreshableAccounts.push({
                username: user.username,
                error: errorMsg,
                hasRefreshToken: true
              });
              console.log(`[validate-tokens]    → Can try to refresh this account`);
            } else {
              accountsToDelete.push({
                username: user.username,
                error: errorMsg,
                hasRefreshToken
              });
              console.log(`[validate-tokens]    → Should delete this account (no refresh token or unfixable error)`);
            }
          }
          
          // Small delay between validations to avoid rate limits
          await new Promise(resolve => setTimeout(resolve, 500));
        }

        const totalBad = refreshableAccounts.length + accountsToDelete.length;
        console.log(`[validate-tokens] ✅ Job completed - Valid: ${validAccounts.length}, Can Refresh: ${refreshableAccounts.length}, Should Delete: ${accountsToDelete.length}`);
        
        jobManager.updateJob(jobId, { 
          done: true, 
          success: totalBad === 0,
          stage: 'completed',
          message: totalBad === 0 
            ? 'All tokens valid' 
            : `Found ${totalBad} bad tokens (${refreshableAccounts.length} refreshable, ${accountsToDelete.length} deletable)`,
          data: { 
            validAccounts,
            refreshableAccounts,
            accountsToDelete,
            totalValid: validAccounts.length,
            totalRefreshable: refreshableAccounts.length,
            totalToDelete: accountsToDelete.length
          }
        });
      } catch (error: any) {
        console.error(`❌ Job ${jobId} failed:`, error);
        jobManager.updateJob(jobId, {
          done: true,
          success: false,
          stage: 'failed',
          message: error.message
        });
      }
    })().catch((err) => {
      console.error(`❌ FATAL: Unhandled error in job ${jobId}:`, err);
    });

    res.json({ success: true, jobId });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to validate tokens' });
  }
});

// ==================== JOB STATUS (matches main app) ====================

app.get('/api/admin/jobs/:id', requireAuth, async (req, res) => {
  try {
    const jobId = req.params.id;
    const job = jobManager.getJob(jobId);
    
    if (!job) {
      return res.status(404).json({ success: false, error: 'Job not found' });
    }
    
    res.json({ success: true, job });
  } catch (error) {
    console.error('Error fetching job status:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch job status' });
  }
});

app.post('/api/admin/jobs/:id/cancel', requireAuth, async (req, res) => {
  try {
    const jobId = req.params.id;
    const cancelled = jobManager.cancelJob(jobId);
    
    if (cancelled) {
      res.json({ success: true, message: 'Job cancelled successfully' });
    } else {
      res.status(404).json({ success: false, error: 'Job not found or already completed' });
    }
  } catch (error) {
    console.error('Error cancelling job:', error);
    res.status(500).json({ success: false, error: 'Failed to cancel job' });
  }
});

// ==================== LANDING PAGE (Public) ====================

app.get('/api/landing-config', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM landing_page_config WHERE is_active = true ORDER BY id DESC LIMIT 1');
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Landing configuration not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching landing config:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch landing configuration' });
  }
});

// ==================== TELEGRAM SETTINGS ADMIN ====================

app.get('/api/admin/telegram-settings', requireAuth, async (req, res) => {
  try {
    const settings = await telegramService.getSettings();
    if (!settings) {
      return res.status(404).json({ success: false, error: 'Telegram settings not found' });
    }
    res.json({ success: true, settings });
  } catch (error) {
    console.error('Error fetching Telegram settings:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch Telegram settings' });
  }
});

app.put('/api/admin/telegram-settings', requireAuth, async (req, res) => {
  try {
    const { botToken, chatId, botEnabled } = req.body;
    const success = await telegramService.updateSettings(botToken, chatId, botEnabled);
    
    if (success) {
      res.json({ success: true, message: 'Telegram settings updated successfully' });
    } else {
      res.status(500).json({ success: false, error: 'Failed to update settings' });
    }
  } catch (error) {
    console.error('Error updating Telegram settings:', error);
    res.status(500).json({ success: false, error: 'Failed to update Telegram settings' });
  }
});

app.post('/api/admin/telegram-settings/test', requireAuth, async (req, res) => {
  try {
    const success = await telegramService.sendNotification(
      '🧪 <b>Test Notification</b>\n\nYour Telegram bot is working correctly!\n\n🤖 <i>Credential Task Bot</i>'
    );
    
    if (success) {
      res.json({ success: true, message: 'Test notification sent successfully' });
    } else {
      res.status(500).json({ success: false, error: 'Failed to send test notification' });
    }
  } catch (error) {
    console.error('Error sending test notification:', error);
    res.status(500).json({ success: false, error: 'Failed to send test notification' });
  }
});

// ==================== LANDING PAGE ADMIN ====================

app.get('/api/admin/landing-config', requireAuth, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM landing_page_config WHERE id = 1');
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Landing configuration not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching landing config:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch landing configuration' });
  }
});

app.put('/api/admin/landing-config', requireAuth, async (req, res) => {
  try {
    const {
      title,
      subtitle,
      description,
      buttonText,
      successMessage,
      backgroundColor,
      primaryColor,
      logoUrl,
      isActive,
      buttonAction
    } = req.body;

    // Only use custom button text if provided, otherwise use empty string
    // This allows frontend to auto-populate based on buttonAction
    const finalButtonText = buttonText || '';

    // Provide defaults for nullable fields to satisfy database constraints
    const finalSuccessMessage = successMessage || '🎉 Welcome! Your account has been created successfully.';
    const finalBackgroundColor = backgroundColor || '#0a0118';
    const finalPrimaryColor = primaryColor || '#8b5cf6';
    const finalLogoUrl = logoUrl || '';

    const result = await pool.query(
      `UPDATE landing_page_config 
       SET title = $1, subtitle = $2, description = $3, button_text = $4, 
           success_message = $5, background_color = $6, primary_color = $7, 
           logo_url = $8, is_active = $9, button_action = $10, updated_at = NOW()
       WHERE id = 1
       RETURNING *`,
      [title, subtitle, description, finalButtonText, finalSuccessMessage, finalBackgroundColor, finalPrimaryColor, finalLogoUrl, isActive, buttonAction || 'waitlist']
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Landing configuration not found' });
    }

    console.log('✅ Landing page config updated');
    res.json({ success: true, config: result.rows[0] });
  } catch (error) {
    console.error('Error updating landing config:', error);
    res.status(500).json({ success: false, error: 'Failed to update landing configuration' });
  }
});

app.get('/api/landing/initiate-oauth', async (req, res) => {
  try {
    console.log('🔐 [OAuth] Initiating OAuth flow for landing page waitlist');
    
    // Get Twitter ID from session if user is returning (stored during OAuth)
    const potentialTwitterId = req.session?.pendingTwitterId;
    
    // Check if this is a returning user by Twitter ID
    let existingUser = null;
    if (potentialTwitterId) {
      const users = await twitterService.getSocialUsers();
      existingUser = users.find(u => u.twitterId === potentialTwitterId);
    }
    
    // Get all active Twitter apps
    const activeApps = await twitterService.getActiveTwitterApps();
    
    if (activeApps.length === 0) {
      console.error('❌ [OAuth] No active Twitter apps found');
      return res.status(500).json({ success: false, error: 'No active Twitter app found. Please create and activate a Twitter app in the admin panel.' });
    }

    let selectedApp;
    
    // If returning user, use their previously linked app
    if (existingUser && existingUser.twitterAppId) {
      const userApp = activeApps.find(app => app.id === existingUser.twitterAppId);
      if (userApp) {
        selectedApp = { app: userApp, userCount: 0 }; // userCount not relevant for returning users
        console.log(`🔄 [OAuth] RETURNING USER - Using previously linked app "${userApp.appName}" (ID: ${userApp.id}) for user @${existingUser.username}`);
      }
    }
    
    // If no existing user or their app is inactive, find available app
    if (!selectedApp) {
      // Find app with lowest user count (under 15 users per app limit)
      const appUserCounts = await Promise.all(
        activeApps.map(async (app) => {
          const users = await twitterService.getUsersByApp(app.id);
          return { app, userCount: users.length };
        })
      );

      // Sort by user count, ascending
      appUserCounts.sort((a, b) => a.userCount - b.userCount);
      
      console.log('📊 [OAuth] App user counts:');
      appUserCounts.forEach(({ app, userCount }) => {
        console.log(`   - App "${app.appName}" (ID: ${app.id}): ${userCount}/15 users`);
      });

      // Find first app with less than 15 users
      selectedApp = appUserCounts.find(({ userCount }) => userCount < 15);
      
      if (!selectedApp) {
        console.error('❌ [OAuth] All Twitter apps have reached the 15 user limit');
        return res.status(500).json({ 
          success: false, 
          error: 'All Twitter apps have reached their user limit. Please add more Twitter apps in the admin panel or remove some users.' 
        });
      }

      console.log(`✅ [OAuth] NEW USER - Selected app "${selectedApp.app.appName}" (${selectedApp.userCount}/15 users)`);
    }

    // Generate OAuth URL using the production endpoint (isTestAuth = false)
    const result = await twitterService.generateOAuthUrl(selectedApp.app.id, false);
    
    if (!result.success || !result.authUrl) {
      console.error('❌ [OAuth] Failed to generate OAuth URL:', result.error);
      return res.status(500).json({ success: false, error: result.error || 'Failed to generate OAuth URL' });
    }

    console.log('🔗 [OAuth] OAuth URL generated successfully');
    res.json({ success: true, authUrl: result.authUrl });
  } catch (error) {
    console.error('❌ [OAuth] Error initiating OAuth:', error);
    res.status(500).json({ success: false, error: 'Failed to initiate OAuth. Please check the server logs.' });
  }
});

// ==================== HEALTH CHECK ====================

app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'Tasker API is running' });
});

// Serve frontend for all non-API routes (SPA fallback)
app.get('*', (req, res) => {
  if (!req.path.startsWith('/api') && !req.path.startsWith('/auth')) {
    res.sendFile(path.join(__dirname, '../dist/index.html'));
  }
});

// Start server
async function startServer() {
  try {
    // Initialize default admin
    await initializeDefaultAdmin();

    app.listen(PORT, () => {
      console.log(`✅ Tasker server running on port ${PORT}`);
      console.log(`🔗 API: http://localhost:${PORT}/api`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
