import crypto from 'crypto';
import fetch from 'node-fetch';
import { db } from './db';
import { 
  twitterApps, 
  socialUsers, 
  tweetHistory, 
  appSettings, 
  type TwitterApp,
  type InsertTwitterApp,
  type SocialUser,
  type InsertSocialUser,
  type InsertTweetHistory
} from '../shared/schema';
import { eq, and, isNotNull, desc } from 'drizzle-orm';

export class TwitterService {
  
  // ==================== TWITTER APP MANAGEMENT ====================
  
  async getTwitterApps(): Promise<TwitterApp[]> {
    return await db.select().from(twitterApps).orderBy(desc(twitterApps.createdAt));
  }

  async getActiveTwitterApps(): Promise<TwitterApp[]> {
    return await db
      .select()
      .from(twitterApps)
      .where(eq(twitterApps.isActive, true))
      .orderBy(desc(twitterApps.createdAt));
  }

  async getRandomActiveTwitterApp(): Promise<TwitterApp | null> {
    const apps = await this.getActiveTwitterApps();
    if (apps.length === 0) return null;
    return apps[Math.floor(Math.random() * apps.length)];
  }

  async createTwitterApp(data: InsertTwitterApp): Promise<TwitterApp> {
    const [app] = await db.insert(twitterApps).values(data).returning();
    return app;
  }

  async updateTwitterApp(id: number, data: Partial<InsertTwitterApp>): Promise<TwitterApp | undefined> {
    const [updated] = await db
      .update(twitterApps)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(twitterApps.id, id))
      .returning();
    return updated;
  }

  async deleteTwitterApp(id: number): Promise<boolean> {
    const result = await db.delete(twitterApps).where(eq(twitterApps.id, id));
    return result.rowCount !== null && result.rowCount > 0;
  }

  // ==================== OAUTH FLOW ====================
  
  async generateOAuthUrl(specificAppId?: number, isTestAuth: boolean = false): Promise<{ success: boolean; error?: string; authUrl?: string; appId?: string }> {
    try {
      // Get Twitter app
      let twitterApp: TwitterApp | null = null;
      
      if (specificAppId) {
        const apps = await this.getTwitterApps();
        twitterApp = apps.find(a => a.id === specificAppId) || null;
      } else {
        twitterApp = await this.getRandomActiveTwitterApp();
      }

      if (!twitterApp) {
        return { success: false, error: 'No active Twitter app found' };
      }

      // Generate PKCE parameters
      const codeVerifier = crypto.randomBytes(32).toString('base64url');
      const codeChallenge = crypto
        .createHash('sha256')
        .update(codeVerifier)
        .digest('base64url');
      
      // Use different state prefix for production vs test
      const statePrefix = isTestAuth ? 'test' : 'prod';
      const state = `${statePrefix}_${twitterApp.id}_${crypto.randomBytes(12).toString('base64url')}`;

      // Store code verifier with multiple keys for reliability
      const verifierKeyPrefix = isTestAuth ? 'x_oauth_test_verifier' : 'x_oauth_prod_verifier';
      await this.setSetting(`${verifierKeyPrefix}_${twitterApp.id}`, codeVerifier, isTestAuth ? 'PKCE verifier for test auth' : 'PKCE verifier for production auth');
      await this.setSetting(`x_oauth_verifier_${state}`, codeVerifier, 'PKCE verifier fallback');
      console.log(`[oauth] 🔐 ${isTestAuth ? 'TEST' : 'PRODUCTION'} - Stored code verifier for app ${twitterApp.id}, state: ${state}`);

      // Construct OAuth URL
      const params = new URLSearchParams({
        response_type: 'code',
        client_id: twitterApp.clientId,
        redirect_uri: twitterApp.callbackUrl,
        scope: 'tweet.read tweet.write users.read offline.access',
        state,
        code_challenge: codeChallenge,
        code_challenge_method: 'S256',
      });

      const authUrl = `https://twitter.com/i/oauth2/authorize?${params.toString()}`;

      return { 
        success: true, 
        authUrl,
        appId: `app_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`
      };
    } catch (error) {
      console.error('Error generating OAuth URL:', error);
      return { success: false, error: 'Failed to generate OAuth URL' };
    }
  }

  async handleOAuthCallback(
    code: string, 
    state: string, 
    appId: number
  ): Promise<{ success: boolean; error?: string; user?: SocialUser; isReturningUser?: boolean }> {
    try {
      console.log(`[oauth] 📥 OAuth callback received - appId: ${appId}, state: ${state}, code: ${code.substring(0, 20)}...`);
      
      // Get Twitter app
      const apps = await this.getTwitterApps();
      const twitterApp = apps.find(a => a.id === appId);
      
      if (!twitterApp) {
        console.log(`[oauth] ❌ Twitter app not found: ${appId}`);
        return { success: false, error: 'Twitter app not found' };
      }

      console.log(`[oauth] 🔍 Looking for verifier for app ${appId}, state: ${state}`);
      
      // Determine if this is a test or production OAuth based on state prefix
      const isTestAuth = state.startsWith('test_');
      const verifierKeyPrefix = isTestAuth ? 'x_oauth_test_verifier' : 'x_oauth_prod_verifier';
      
      // Try multiple verifier keys for reliability
      let verifierSetting = await this.getSetting(`${verifierKeyPrefix}_${appId}`);
      
      if (!verifierSetting) {
        console.log(`[oauth] ⚠️ App-specific verifier not found, trying state-based...`);
        verifierSetting = await this.getSetting(`x_oauth_verifier_${state}`);
      }
      
      if (!verifierSetting) {
        console.log(`[oauth] ⚠️ State-based verifier not found, trying legacy format...`);
        verifierSetting = await this.getSetting(`oauth_verifier_${state}`);
      }
      
      if (!verifierSetting) {
        console.log(`[oauth] ❌ Code verifier not found for app ${appId}, state: ${state}`);
        console.log(`[oauth] 📋 Listing all OAuth settings:`);
        const allSettings = await db.select().from(appSettings);
        console.log(`[oauth] Found ${allSettings.length} settings:`, allSettings.map(s => s.key).slice(0, 20));
        return { success: false, error: 'OAuth session expired - code verifier not found. Please try again.' };
      }

      console.log(`[oauth] ✅ Code verifier found for app ${appId}, state: ${state}`);
      const codeVerifier = verifierSetting.value;
      
      // Clean up ALL verifier keys to prevent token reuse and database buildup
      const keysToDelete = [
        `x_oauth_test_verifier_${appId}`,
        `x_oauth_prod_verifier_${appId}`,
        `x_oauth_verifier_${state}`,
        `oauth_verifier_${state}` // legacy format
      ];
      
      for (const key of keysToDelete) {
        try {
          const result = await db.delete(appSettings).where(eq(appSettings.key, key));
          if (result.rowCount && result.rowCount > 0) {
            console.log(`[oauth] 🗑️ Cleaned up verifier key: ${key}`);
          }
        } catch (error) {
          console.log(`[oauth] ⚠️ Failed to clean up verifier key ${key}:`, error);
        }
      }

      // Exchange code for tokens
      const tokenResponse = await fetch('https://api.twitter.com/2/oauth2/token', {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${Buffer.from(`${twitterApp.clientId}:${twitterApp.clientSecret}`).toString('base64')}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          code,
          grant_type: 'authorization_code',
          client_id: twitterApp.clientId,
          redirect_uri: twitterApp.callbackUrl,
          code_verifier: codeVerifier,
        }),
      });

      const tokenData: any = await tokenResponse.json();

      if (!tokenData.access_token) {
        return { success: false, error: 'Failed to get access token' };
      }

      // Get user profile
      const profileResponse = await fetch('https://api.twitter.com/2/users/me?user.fields=public_metrics', {
        headers: {
          'Authorization': `Bearer ${tokenData.access_token}`,
        },
      });

      const profileData: any = await profileResponse.json();

      if (!profileData.data) {
        return { success: false, error: 'Failed to get user profile' };
      }

      // Calculate token expiration
      const expiresIn = tokenData.expires_in || 7200;
      const tokenExpiresAt = new Date(Date.now() + expiresIn * 1000);

      // Create or update social user
      const existingUser = await db
        .select()
        .from(socialUsers)
        .where(eq(socialUsers.twitterId, profileData.data.id))
        .limit(1);

      let user: SocialUser;
      const isReturningUser = existingUser.length > 0;

      if (isReturningUser) {
        // Update existing user - KEEP their original app assignment
        const keepOriginalApp = existingUser[0].twitterAppId === twitterApp.id;
        
        console.log(`[oauth] 🔄 EXISTING USER DETECTED - Updating details for @${profileData.data.username} (ID: ${profileData.data.id})`);
        console.log(`[oauth] 📊 Previous data - App: ${existingUser[0].twitterAppId}, Followers: ${existingUser[0].followersCount}, Last Active: ${existingUser[0].lastActive}`);
        console.log(`[oauth] 📊 Auth via App: ${twitterApp.id}, Followers: ${profileData.data.public_metrics?.followers_count || 0}`);
        
        if (keepOriginalApp) {
          console.log(`[oauth] ✅ User authenticated with their original app - No app reassignment needed`);
        } else {
          console.log(`[oauth] ⚠️ User authenticated with different app ${twitterApp.id}, but keeping original app ${existingUser[0].twitterAppId}`);
        }
        
        [user] = await db
          .update(socialUsers)
          .set({
            username: profileData.data.username, // Update username in case they changed it
            accessToken: tokenData.access_token,
            refreshToken: tokenData.refresh_token,
            tokenExpiresAt,
            followersCount: profileData.data.public_metrics?.followers_count || 0,
            lastActive: new Date(),
            // DO NOT update twitterAppId - keep user's original app assignment
            isActive: true, // Reactivate if they were deactivated
            updatedAt: new Date(),
          })
          .where(eq(socialUsers.id, existingUser[0].id))
          .returning();
        
        console.log(`[oauth] ✅ User details updated successfully - Welcome back @${user.username}! (Staying with App ${user.twitterAppId})`);
      } else {
        // Create new user
        console.log(`[oauth] 🆕 NEW USER DETECTED - Creating account for @${profileData.data.username} (ID: ${profileData.data.id})`);
        console.log(`[oauth] 📊 Followers: ${profileData.data.public_metrics?.followers_count || 0}, App: ${twitterApp.id}`);
        
        [user] = await db
          .insert(socialUsers)
          .values({
            username: profileData.data.username,
            twitterId: profileData.data.id,
            accessToken: tokenData.access_token,
            refreshToken: tokenData.refresh_token,
            tokenExpiresAt,
            followersCount: profileData.data.public_metrics?.followers_count || 0,
            twitterAppId: twitterApp.id,
            isActive: true,
            lastActive: new Date(),
          })
          .returning();
        
        console.log(`[oauth] ✅ New user account created successfully - Welcome @${user.username}!`);
      }

      // Clean up verifier
      await this.deleteSetting(`oauth_verifier_${state}`);

      return { success: true, user, isReturningUser };
    } catch (error) {
      console.error('Error in OAuth callback:', error);
      return { success: false, error: 'OAuth callback failed' };
    }
  }

  // ==================== TWEET POSTING ====================
  
  async postTweetWithApp(appId: number, tweetText: string, username?: string): Promise<{ success: boolean; tweetId?: string; error?: string; message?: string }> {
    try {
      // Get user from specific app or any user from that app
      const users = username
        ? await db.select().from(socialUsers).where(and(eq(socialUsers.username, username), eq(socialUsers.twitterAppId, appId))).limit(1)
        : await db.select().from(socialUsers)
            .where(and(
              eq(socialUsers.twitterAppId, appId),
              eq(socialUsers.isActive, true),
              isNotNull(socialUsers.accessToken)
            ))
            .limit(1);

      if (users.length === 0) {
        return { success: false, error: 'No active users found for this app', message: 'No active users found for this app' };
      }

      const user = users[0];

      const response = await fetch('https://api.twitter.com/2/tweets', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${user.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text: tweetText }),
      });

      const data: any = await response.json();

      if (data.data?.id) {
        // Record success
        await this.recordTweet({
          userId: user.id,
          username: user.username,
          tweetText,
          tweetId: data.data.id,
          success: true,
          tweetType: 'single',
          appId: user.twitterAppId,
        });

        return { success: true, tweetId: data.data.id, message: `Tweet posted by @${user.username}` };
      } else {
        // Record failure
        await this.recordTweet({
          userId: user.id,
          username: user.username,
          tweetText,
          tweetId: null,
          success: false,
          errorMessage: data.detail || 'Unknown error',
          tweetType: 'single',
          appId: user.twitterAppId,
        });

        return { success: false, error: data.detail || 'Failed to post tweet' };
      }
    } catch (error) {
      console.error('Error posting tweet with app:', error);
      return { success: false, error: 'Failed to post tweet' };
    }
  }
  
  async postTweet(username: string, tweetText: string, quoteTweetUrl?: string): Promise<{ success: boolean; tweetId?: string; error?: string }> {
    try {
      const [user] = await db
        .select()
        .from(socialUsers)
        .where(eq(socialUsers.username, username))
        .limit(1);

      if (!user || !user.accessToken) {
        return { success: false, error: 'User not found or not authenticated' };
      }

      // Prepare tweet payload
      const tweetPayload: any = { text: tweetText };

      // Extract tweet ID from quote URL if provided
      if (quoteTweetUrl) {
        const tweetIdMatch = quoteTweetUrl.match(/status\/(\d+)/);
        if (tweetIdMatch && tweetIdMatch[1]) {
          tweetPayload.quote_tweet_id = tweetIdMatch[1];
          console.log(`[post-tweet] 🔁 Quote tweet ID: ${tweetIdMatch[1]}`);
        } else {
          console.log(`[post-tweet] ⚠️ Invalid quote tweet URL format: ${quoteTweetUrl}`);
        }
      }

      const response = await fetch('https://api.twitter.com/2/tweets', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${user.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(tweetPayload),
      });

      const data: any = await response.json();

      if (data.data?.id) {
        // Record success
        await this.recordTweet({
          userId: user.id,
          username: user.username,
          tweetText,
          tweetId: data.data.id,
          success: true,
          tweetType: 'single',
          appId: user.twitterAppId,
        });

        return { success: true, tweetId: data.data.id };
      } else {
        // Record failure
        await this.recordTweet({
          userId: user.id,
          username: user.username,
          tweetText,
          success: false,
          errorMessage: data.detail || 'Unknown error',
          tweetType: 'single',
          appId: user.twitterAppId,
        });

        return { success: false, error: data.detail || 'Failed to post tweet' };
      }
    } catch (error) {
      console.error('Error posting tweet:', error);
      return { success: false, error: 'Failed to post tweet' };
    }
  }

  async recordTweet(data: InsertTweetHistory): Promise<void> {
    await db.insert(tweetHistory).values(data);
  }

  // ==================== USER MANAGEMENT ====================
  
  async getSocialUsers(): Promise<SocialUser[]> {
    const results = await db
      .select({
        id: socialUsers.id,
        username: socialUsers.username,
        twitterId: socialUsers.twitterId,
        accessToken: socialUsers.accessToken,
        refreshToken: socialUsers.refreshToken,
        followersCount: socialUsers.followersCount,
        isActive: socialUsers.isActive,
        lastActive: socialUsers.lastActive,
        twitterAppId: socialUsers.twitterAppId,
        createdAt: socialUsers.createdAt,
        appName: twitterApps.appName,
      })
      .from(socialUsers)
      .leftJoin(twitterApps, eq(socialUsers.twitterAppId, twitterApps.id))
      .orderBy(desc(socialUsers.createdAt));
    
    return results as any;
  }

  async getUsersByApp(appId: number): Promise<SocialUser[]> {
    return await db
      .select()
      .from(socialUsers)
      .where(eq(socialUsers.twitterAppId, appId));
  }

  async deleteUser(userId: number): Promise<boolean> {
    const result = await db.delete(socialUsers).where(eq(socialUsers.id, userId));
    return result.rowCount !== null && result.rowCount > 0;
  }
  
  async deleteUserByUsername(username: string): Promise<boolean> {
    const result = await db.delete(socialUsers).where(eq(socialUsers.username, username));
    return result.rowCount !== null && result.rowCount > 0;
  }

  async refreshUserToken(username: string): Promise<{ success: boolean; error?: string }> {
    try {
      const [user] = await db
        .select()
        .from(socialUsers)
        .where(eq(socialUsers.username, username))
        .limit(1);

      if (!user || !user.refreshToken) {
        return { success: false, error: 'User not found or no refresh token available' };
      }

      const [app] = await db
        .select()
        .from(twitterApps)
        .where(eq(twitterApps.id, user.twitterAppId || 0))
        .limit(1);

      if (!app) {
        return { success: false, error: 'Twitter app not found' };
      }

      // Refresh the access token using the refresh token
      const tokenResponse = await fetch('https://api.twitter.com/2/oauth2/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': `Basic ${Buffer.from(`${app.clientId}:${app.clientSecret}`).toString('base64')}`,
        },
        body: new URLSearchParams({
          grant_type: 'refresh_token',
          refresh_token: user.refreshToken,
        }).toString(),
      });

      const tokenData: any = await tokenResponse.json();

      if (tokenData.access_token) {
        // Update tokens
        await db
          .update(socialUsers)
          .set({
            accessToken: tokenData.access_token,
            refreshToken: tokenData.refresh_token || user.refreshToken,
            lastActive: new Date(),
          })
          .where(eq(socialUsers.username, username));

        return { success: true };
      } else {
        return { success: false, error: tokenData.error_description || 'Failed to refresh token' };
      }
    } catch (error) {
      console.error('Error refreshing token:', error);
      return { success: false, error: 'Failed to refresh token' };
    }
  }

  async getTweetHistory(): Promise<any[]> {
    return await db
      .select()
      .from(tweetHistory)
      .orderBy(desc(tweetHistory.postedAt))
      .limit(100);
  }

  // ==================== SETTINGS ====================
  
  async getSetting(key: string) {
    const [setting] = await db
      .select()
      .from(appSettings)
      .where(eq(appSettings.key, key))
      .limit(1);
    return setting;
  }

  async setSetting(key: string, value: string, description?: string) {
    const existing = await this.getSetting(key);
    
    if (existing) {
      const [updated] = await db
        .update(appSettings)
        .set({ value, updatedAt: new Date() })
        .where(eq(appSettings.key, key))
        .returning();
      return updated;
    } else {
      const [created] = await db
        .insert(appSettings)
        .values({ key, value, description })
        .returning();
      return created;
    }
  }

  async deleteSetting(key: string) {
    await db.delete(appSettings).where(eq(appSettings.key, key));
  }
}

export const twitterService = new TwitterService();
