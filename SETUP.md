# Tasker Setup Guide

## Prerequisites

- Node.js 18+ installed
- PostgreSQL database available
- Twitter Developer account with OAuth 2.0 app

## Installation Steps

### 1. Install Dependencies

```bash
cd tasker
npm install
```

### 2. Environment Configuration

Create a `.env` file:

```env
DATABASE_URL=postgresql://username:password@host:port/database
SESSION_SECRET=your_random_secret_key_here
CUSTOM_DOMAIN=yourdomain.com
NODE_ENV=development
PORT=5001
```

### 3. Database Setup

Push the database schema:

```bash
npm run db:push
```

This will create all required tables:
- `admin_users` - Admin authentication
- `twitter_apps` - Twitter OAuth apps
- `social_users` - Authenticated Twitter users
- `tweet_history` - Tweet activity log
- `app_settings` - Application settings
- `session` - Express session store

### 4. Start Development Server

```bash
npm run dev
```

The server will start on port 5001 (or your configured PORT).

### 5. Access the Application

Open your browser to:
- **Local**: http://localhost:5001
- **Production**: https://yourdomain.com

Default admin credentials:
- **Username**: admin
- **Password**: admin123

## Twitter App Configuration

1. Go to [Twitter Developer Portal](https://developer.twitter.com/en/portal/dashboard)
2. Create a new app or use existing
3. Enable OAuth 2.0
4. Set callback URL: `https://yourdomain.com/auth/twitter/callback/1`
5. Enable permissions: `tweet.read`, `tweet.write`, `users.read`, `offline.access`
6. Copy Client ID and Client Secret

## Add Twitter App in Tasker

1. Login to Tasker admin panel
2. Navigate to "Twitter Apps"
3. Click "Add App"
4. Fill in:
   - App Name: Your app name
   - Client ID: From Twitter Developer Portal
   - Client Secret: From Twitter Developer Portal
   - Callback URL: `https://yourdomain.com/auth/twitter/callback/1`
   - Redirect URL (optional): Where to redirect after successful auth

## Authenticate Users

1. Go to "Users" page
2. Click "Add User (OAuth)"
3. New window opens with Twitter authorization
4. User authorizes the app
5. User appears in your authenticated users list

## Post Tweets

1. Go to "Users" page
2. Select a user from dropdown
3. Write tweet text (max 280 characters)
4. Click "Post Tweet"

## Production Deployment

1. Set `NODE_ENV=production` in `.env`
2. Configure `CUSTOM_DOMAIN` to your production domain
3. Update Twitter app callback URLs to production domain
4. Use a strong `SESSION_SECRET`
5. Run `npm run build` to build frontend
6. Use a process manager like PM2 to run the server

## Security Considerations

- Never commit `.env` file to version control
- Use strong session secrets in production
- Enable HTTPS in production
- Regularly rotate Twitter app credentials
- Implement rate limiting for API endpoints
- Monitor tweet activity for abuse

## Troubleshooting

### OAuth Callback Fails

- Verify callback URL matches exactly in Twitter Developer Portal
- Check `CUSTOM_DOMAIN` environment variable
- Ensure app is active in Tasker

### Tweets Not Posting

- Check user token hasn't expired
- Verify user has correct permissions
- Check Twitter API rate limits
- Review tweet_history table for error messages

### Database Connection Issues

- Verify `DATABASE_URL` is correct
- Ensure PostgreSQL is running
- Check database user has correct permissions
- Run `npm run db:push` to sync schema
