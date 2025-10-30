import { pgTable, serial, text, integer, boolean, timestamp } from 'drizzle-orm/pg-core';
import { createInsertSchema } from 'drizzle-zod';

// Admin Users Table
export const adminUsers = pgTable('admin_users', {
  id: serial('id').primaryKey(),
  username: text('username').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  email: text('email'),
  role: text('role').notNull().default('admin'),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  lastLoginAt: timestamp('last_login_at'),
});

// Twitter Apps Table - Manage multiple Twitter OAuth applications
export const twitterApps = pgTable('twitter_apps', {
  id: serial('id').primaryKey(),
  appName: text('app_name').notNull(),
  clientId: text('client_id').notNull(),
  clientSecret: text('client_secret').notNull(),
  callbackUrl: text('callback_url').notNull(),
  redirectUrl: text('redirect_url'), // Post-OAuth redirect URL
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Social Users Table - Authenticated Twitter users
export const socialUsers = pgTable('social_users', {
  id: serial('id').primaryKey(),
  username: text('username').notNull().unique(),
  twitterId: text('twitter_id').notNull().unique(),
  accessToken: text('access_token'),
  refreshToken: text('refresh_token'),
  followersCount: integer('followers_count'),
  isActive: boolean('is_active').default(true),
  tokenExpiresAt: timestamp('token_expires_at'),
  lastActive: timestamp('last_active'),
  twitterAppId: integer('twitter_app_id').references(() => twitterApps.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Tweet History Table - Track all tweet activity
export const tweetHistory = pgTable('tweet_history', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => socialUsers.id),
  username: text('username').notNull(),
  tweetText: text('tweet_text').notNull(),
  tweetId: text('tweet_id'),
  postedAt: timestamp('posted_at').defaultNow().notNull(),
  success: boolean('success').notNull(),
  errorMessage: text('error_message'),
  tweetType: text('tweet_type').default('single'), // single, bulk, test, general
  batchId: text('batch_id'),
  appId: integer('app_id').references(() => twitterApps.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// App Settings Table - Store application configuration
export const appSettings = pgTable('app_settings', {
  id: serial('id').primaryKey(),
  key: text('key').notNull().unique(),
  value: text('value').notNull(),
  description: text('description'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Landing Page Configuration - Admin-controlled content for user-facing page
export const landingPageConfig = pgTable('landing_page_config', {
  id: serial('id').primaryKey(),
  title: text('title').notNull().default('Join the Waitlist'),
  subtitle: text('subtitle').notNull().default('Connect your Twitter account to get started'),
  description: text('description').default('Be among the first to access our platform'),
  buttonText: text('button_text').notNull().default('Join Waitlist'),
  successMessage: text('success_message').notNull().default('You\'ve been enrolled in the waitlist!'),
  backgroundColor: text('background_color').default('#0f172a'),
  primaryColor: text('primary_color').default('#8b5cf6'),
  logoUrl: text('logo_url'),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Type exports
export type AdminUser = typeof adminUsers.$inferSelect;
export type InsertAdminUser = typeof adminUsers.$inferInsert;
export type TwitterApp = typeof twitterApps.$inferSelect;
export type InsertTwitterApp = typeof twitterApps.$inferInsert;
export type SocialUser = typeof socialUsers.$inferSelect;
export type InsertSocialUser = typeof socialUsers.$inferInsert;
export type TweetHistory = typeof tweetHistory.$inferSelect;
export type InsertTweetHistory = typeof tweetHistory.$inferInsert;
export type AppSetting = typeof appSettings.$inferSelect;
export type InsertAppSetting = typeof appSettings.$inferInsert;
export type LandingPageConfig = typeof landingPageConfig.$inferSelect;
export type InsertLandingPageConfig = typeof landingPageConfig.$inferInsert;

// Validation schemas
export const insertAdminUserSchema = createInsertSchema(adminUsers).omit({
  id: true,
  createdAt: true,
  lastLoginAt: true,
});

export const insertTwitterAppSchema = createInsertSchema(twitterApps).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertSocialUserSchema = createInsertSchema(socialUsers).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertTweetHistorySchema = createInsertSchema(tweetHistory).omit({
  id: true,
  createdAt: true,
  postedAt: true,
});

export const insertAppSettingSchema = createInsertSchema(appSettings).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertLandingPageConfigSchema = createInsertSchema(landingPageConfig).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
