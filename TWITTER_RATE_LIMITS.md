# Twitter API Rate Limits (2025)

## Overview
This document outlines Twitter's (X) API rate limiting policies relevant to the Tasker automation platform, based on research conducted on October 27, 2025.

## Key Findings

### 1. **Accounts Per App**
- **No Hard Limit**: Twitter does not specify a maximum number of OAuth-authenticated users per app
- **Practical Consideration**: Rate limits are primarily usage-based, not account-count based
- **Best Practice**: Distribute users across multiple apps to maximize total throughput

### 2. **Rate Limits by Tier**

#### **Free Tier**
- **Monthly Limit**: 1,500 posts per month **per app** (shared across all users)
- **Daily Average**: ~50 posts per day
- **Critical Note**: The 1,500 posts/month limit is app-level, NOT per-user
  - Even with 100 authenticated users, your app can only post 1,500 tweets total per month
  - **No read access** - write-only (posting) functionality
- **Best for**: Testing and small bots with <50 posts/day

#### **Basic Tier** ($100/month)
- **Monthly Limit**: 50,000 posts per month at app level
- **Daily Average**: ~1,667 posts per day
- **Read Access**: 10,000 tweets/month
- **Best for**: Medium to large automation (50-100 accounts per app)

#### **Enterprise Tier** (Custom Pricing)
- **Per User**: 300 posts per 3-hour window
- **Higher limits** negotiated with Twitter directly
- **Best for**: Large-scale automation (50+ accounts)

### 3. **Authentication Method (OAuth 2.0 PKCE)**

#### **Current Implementation: OAuth 2.0 with PKCE**
- Tasker uses **OAuth 2.0 Authorization Code Flow with PKCE** (Proof Key for Code Exchange)
- Provides secure user-context authentication without client secrets
- Each authenticated user gets their own access/refresh token
- Rate limits are **per-user** when using user-context tokens
- **App-level limits** still apply (e.g., 1,500 posts/month for Free tier total across all users)

#### **Rate Limit Behavior**
- **Per-User Tokens**: Each user's token has its own rate limit bucket
- **App-Level Caps**: Monthly/daily limits are still shared across all app users
- **Example**: On Free tier with 10 users:
  - Each user can post independently
  - But total posts across all 10 users cannot exceed 1,500/month
  - Once app hits 1,500 posts, all users are rate-limited until reset

### 4. **Rate Limit Windows**
- **Posting Endpoints**: 24-hour rolling window (Free/Basic)
- **Reading Endpoints**: 15-minute rolling window
- **Enterprise**: Some endpoints use 3-hour windows

### 5. **Monitoring Rate Limits**
Check these HTTP response headers on every API call:
- `x-rate-limit-limit`: Total requests allowed
- `x-rate-limit-remaining`: Requests left in current window
- `x-rate-limit-reset`: Unix timestamp when limit resets

### 6. **Error Handling**
- **HTTP 429**: "Too Many Requests" - rate limit exceeded
- **Best Practice**: Implement exponential backoff when hitting 429 errors

## Recommendations for Tasker

### Random App Assignment Strategy
When authenticating new users, consider these factors:

1. **Track Posts Per App**
   - Monitor how many tweets each app has posted in the last 24 hours
   - Avoid assigning new users to apps approaching their daily limit

2. **Distribute Evenly**
   - Aim for roughly equal users per app (e.g., 50-100 users per app on Basic tier)
   - This maximizes total throughput while staying under per-app limits

3. **Consider Tier Limits**
   - **Free Tier**: 5-10 users max per app (1,500 posts/month total = ~150 posts per user if evenly distributed)
   - **Basic Tier**: 50-100 users per app (50,000 posts/month total = ~500-1,000 posts per user)
   - **Enterprise**: 100+ users per app feasible

4. **Implement Smart Rotation**
   - When bulk posting, rotate between apps to distribute load
   - Track app usage in real-time to avoid hitting limits
   - Consider time zones - reset times may vary

### Task Execution Frequency

#### **Single Posts**
- **Free Tier**: Max 1,500 posts/month per app (~50/day) → Limit to 2-3 posts per hour
- **Basic Tier**: Max 50,000 posts/month per app (~1,667/day) → Can sustain ~70 posts/hour

#### **Bulk Operations**
- Add delays between batches (recommended: 2-5 seconds)
- Distribute across multiple apps for better throughput
- Monitor `x-rate-limit-remaining` header before each batch

#### **Token Refresh**
- OAuth token refresh has separate rate limits
- Safe to refresh tokens once every 1-2 hours as needed
- Batch refresh operations to minimize API calls

## Implementation Checklist

- [x] Use OAuth 2.0 PKCE for secure user-context authentication
- [x] Track rate limit headers in tweet history
- [x] Implement intelligent app selection during authentication
- [ ] Add real-time rate limit monitoring to admin dashboard (track monthly/daily usage per app)
- [ ] Implement automatic app rotation when limits are reached
- [ ] Add alerts when apps approach their monthly/daily limits
- [ ] Store rate limit data in database for analytics
- [ ] Display current usage vs limits in the admin panel for each app

## References
- Twitter API Rate Limits: https://developer.x.com/en/docs/x-api/rate-limits
- OAuth 2.0 Limits: https://developer.x.com/en/docs/authentication/oauth-2-0
- POST /2/tweets Endpoint: https://developer.x.com/en/docs/twitter-api/tweets/manage-tweets/api-reference/post-tweets

---

**Last Updated**: October 27, 2025  
**Research Source**: Twitter/X Developer Documentation & Community Forums
