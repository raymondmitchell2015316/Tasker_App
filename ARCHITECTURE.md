# Tasker Architecture Documentation

## 📁 Project Structure

```
tasker/
├── client/                    # Frontend React application
│   ├── src/
│   │   ├── components/        # Reusable React components
│   │   │   └── Layout.tsx     # Main layout with navigation
│   │   ├── pages/             # Page components
│   │   │   ├── Login.tsx      # Admin login page
│   │   │   ├── Dashboard.tsx  # Main dashboard
│   │   │   ├── TwitterApps.tsx # Twitter app management
│   │   │   └── Users.tsx      # User management & tweet posting
│   │   ├── utils/             # Utility functions
│   │   ├── App.tsx            # Main app component with routing
│   │   ├── main.tsx           # React entry point
│   │   └── index.css          # Global styles
│   └── index.html             # HTML entry point
├── server/                    # Backend Express server
│   ├── index.ts               # Main server file with routes
│   ├── auth.ts                # Authentication logic
│   ├── twitter.ts             # Twitter OAuth & posting service
│   └── db.ts                  # Database connection
├── shared/                    # Shared code between client/server
│   └── schema.ts              # Drizzle database schema
├── public/                    # Static assets
├── package.json               # Dependencies & scripts
├── tsconfig.json              # TypeScript configuration
├── vite.config.ts             # Vite bundler configuration
├── drizzle.config.ts          # Drizzle ORM configuration
├── .env                       # Environment variables (not committed)
├── .env.example               # Environment variables template
├── .gitignore                 # Git ignore rules
├── start.sh                   # Quick start script
├── README.md                  # Project overview
├── SETUP.md                   # Setup instructions
├── FEATURES.md                # Feature documentation
└── ARCHITECTURE.md            # This file
```

---

## 🏗️ System Architecture

### High-Level Overview

```
┌─────────────┐         ┌─────────────┐         ┌─────────────┐
│   Browser   │ ◄─────► │   Express   │ ◄─────► │ PostgreSQL  │
│  (React)    │  HTTP   │   Server    │   SQL   │  Database   │
└─────────────┘         └─────────────┘         └─────────────┘
                              │
                              │ OAuth 2.0
                              ▼
                        ┌─────────────┐
                        │   Twitter   │
                        │     API     │
                        └─────────────┘
```

---

## 🔄 Data Flow

### 1. Admin Authentication Flow

```
User enters credentials
    │
    ▼
POST /api/auth/login
    │
    ▼
Server validates with bcrypt
    │
    ▼
Create session with admin ID
    │
    ▼
Return success + user data
    │
    ▼
Frontend stores auth state
```

### 2. Twitter OAuth Flow (PKCE)

```
User clicks "Add User"
    │
    ▼
GET /api/auth/twitter/url
    │
    ├─► Select random active Twitter app
    ├─► Generate code_verifier (32 random bytes)
    ├─► Generate code_challenge (SHA256 of verifier)
    ├─► Generate unique state parameter
    ├─► Store verifier in database (temporary)
    └─► Build OAuth URL
    │
    ▼
Return auth URL to frontend
    │
    ▼
Open Twitter OAuth in popup
    │
    ▼
User authorizes on Twitter
    │
    ▼
Twitter redirects to callback
    │
    ▼
GET /auth/twitter/callback/:appId?code=xxx&state=yyy
    │
    ├─► Retrieve stored code_verifier
    ├─► Exchange code for tokens (POST to Twitter)
    ├─► Fetch user profile from Twitter
    ├─► Store user + tokens in database
    └─► Clean up temporary verifier
    │
    ▼
Display success page
    │
    ▼
User data now in database
```

### 3. Tweet Posting Flow

```
User selects account & writes tweet
    │
    ▼
POST /api/tweets
    │
    ├─► Verify admin authentication
    ├─► Lookup user in database
    ├─► Retrieve access token
    └─► POST to Twitter API
    │
    ▼
Twitter processes tweet
    │
    ▼
Record result in tweet_history
    │
    ▼
Return success/failure to frontend
```

---

## 🗄️ Database Schema

### Tables & Relationships

```sql
┌──────────────────┐
│   admin_users    │
├──────────────────┤
│ id (PK)          │
│ username         │
│ password_hash    │
│ email            │
│ role             │
│ is_active        │
│ created_at       │
│ last_login_at    │
└──────────────────┘

┌──────────────────┐
│  twitter_apps    │◄──────────────┐
├──────────────────┤               │
│ id (PK)          │               │ FK (twitter_app_id)
│ app_name         │               │
│ client_id        │               │
│ client_secret    │         ┌─────────────────┐
│ callback_url     │         │  social_users   │
│ redirect_url     │         ├─────────────────┤
│ is_active        │         │ id (PK)         │
│ created_at       │         │ username        │
│ updated_at       │         │ twitter_id      │
└──────────────────┘         │ access_token    │
                             │ refresh_token   │
                             │ followers_count │
┌──────────────────┐         │ is_active       │
│  tweet_history   │◄────────│ token_expires_at│
├──────────────────┤         │ last_active     │
│ id (PK)          │         │ twitter_app_id  │
│ user_id (FK)     │         │ created_at      │
│ username         │         │ updated_at      │
│ tweet_text       │         └─────────────────┘
│ tweet_id         │
│ posted_at        │
│ success          │
│ error_message    │
│ tweet_type       │
│ batch_id         │
│ app_id (FK)      │
│ created_at       │
└──────────────────┘

┌──────────────────┐
│  app_settings    │
├──────────────────┤
│ id (PK)          │
│ key (unique)     │
│ value            │
│ description      │
│ created_at       │
│ updated_at       │
└──────────────────┘
```

---

## 🔐 Security Architecture

### Authentication Layers

1. **Admin Layer** (Express Session)
   - bcrypt password hashing
   - Secure session cookies
   - Session stored in PostgreSQL
   - 30-day session expiration

2. **API Layer** (requireAuth middleware)
   - Checks session for userId
   - 401 Unauthorized if not authenticated
   - Applied to all sensitive endpoints

3. **OAuth Layer** (PKCE)
   - Proof Key for Code Exchange
   - SHA256 code challenge
   - State parameter for CSRF protection
   - Temporary verifier storage

### Token Security

- **Access Tokens**: Stored encrypted in database
- **Refresh Tokens**: Stored encrypted, used for renewal
- **Code Verifiers**: Temporary, deleted after use
- **Session Secrets**: Environment variable, never committed

---

## 📡 API Endpoints

### Authentication

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/login` | No | Admin login |
| POST | `/api/auth/logout` | No | Admin logout |
| GET | `/api/auth/session` | No | Check session status |

### Twitter Apps

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/twitter-apps` | Yes | List all Twitter apps |
| POST | `/api/twitter-apps` | Yes | Create new Twitter app |
| PUT | `/api/twitter-apps/:id` | Yes | Update Twitter app |
| DELETE | `/api/twitter-apps/:id` | Yes | Delete Twitter app |

### OAuth

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/auth/twitter/url` | No | Generate OAuth URL |
| GET | `/auth/twitter/callback/:appId` | No | OAuth callback handler |

### Users & Tweets

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/users` | Yes | List authenticated users |
| POST | `/api/tweets` | Yes | Post tweet for user |

### Health

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/health` | No | Server health check |

---

## 🎨 Frontend Architecture

### Component Hierarchy

```
App.tsx (Root)
  │
  ├─► Login.tsx (if not authenticated)
  │
  └─► Layout.tsx (if authenticated)
        │
        ├─► Sidebar Navigation
        │
        └─► Page Routes
              ├─► Dashboard.tsx
              ├─► TwitterApps.tsx
              └─► Users.tsx
```

### State Management

- **Authentication State**: Local React state + session check
- **API Data**: Fetched on component mount, stored in local state
- **Forms**: Controlled components with React state
- **No Global State**: Simple app, no Redux/Context needed

### Routing

Using **Wouter** (lightweight React router):
- `/` → Dashboard
- `/twitter-apps` → Twitter Apps Management
- `/users` → User Management & Tweet Posting

---

## 🔧 Build & Development

### Development Mode

```bash
npm run dev
```

Starts:
- Express server on port 5001
- Vite dev server with HMR
- API proxy (`/api` → `http://localhost:5001`)

### Production Build

```bash
npm run build
```

Outputs:
- Compiled React app in `dist/`
- Server runs Express with static file serving

### Database Management

```bash
# Push schema changes to database
npm run db:push

# Open Drizzle Studio (database GUI)
npm run db:studio
```

---

## 🚀 Deployment Considerations

### Environment Variables

**Required**:
- `DATABASE_URL` - PostgreSQL connection string
- `SESSION_SECRET` - Strong random secret for sessions
- `NODE_ENV` - `production` or `development`

**Optional**:
- `CUSTOM_DOMAIN` - Custom domain for OAuth callbacks
- `PORT` - Server port (default: 5001)

### Production Checklist

- [ ] Set strong `SESSION_SECRET`
- [ ] Enable HTTPS
- [ ] Configure `CUSTOM_DOMAIN`
- [ ] Update Twitter app callback URLs
- [ ] Set up database backups
- [ ] Configure logging
- [ ] Set up monitoring
- [ ] Enable CORS properly
- [ ] Implement rate limiting
- [ ] Set up error tracking (Sentry, etc.)

### Scaling Considerations

**Horizontal Scaling**:
- Sessions stored in database (not memory)
- Stateless server design
- Load balancer compatible

**Vertical Scaling**:
- Connection pooling (PostgreSQL)
- Efficient queries (Drizzle ORM)
- Indexed columns for performance

---

## 🛠️ Technology Choices

### Why These Technologies?

**TypeScript**: Type safety, better DX, fewer runtime errors

**Drizzle ORM**: Type-safe queries, SQL-like syntax, great performance

**Express**: Mature, simple, extensive middleware ecosystem

**React + Vite**: Fast development, excellent DX, modern tooling

**Wouter**: Lightweight routing (1KB vs React Router's 15KB)

**PostgreSQL**: Reliable, feature-rich, perfect for relational data

**Neon**: Serverless PostgreSQL, auto-scaling, generous free tier

---

## 📊 Performance Optimization

### Backend

- Database connection pooling
- Prepared statements (Drizzle)
- Indexed columns (username, twitter_id, etc.)
- Session cleanup job (optional)

### Frontend

- Code splitting (Vite automatic)
- Lazy loading routes
- Minimal dependencies
- Efficient re-renders
- CSS-in-JS (no external stylesheets)

---

## 🔍 Monitoring & Debugging

### Logging Strategy

**Server Logs**:
- OAuth flow steps
- Token exchange results
- Tweet posting attempts
- Error messages with context

**Database Logs**:
- `tweet_history` table tracks all attempts
- Error messages stored for debugging
- Timestamps for all operations

### Debug Mode

Enable detailed logging:
```typescript
// Add to server/index.ts
if (process.env.DEBUG) {
  console.log('Debug mode enabled');
}
```

---

## 🧪 Testing Strategy (Future)

### Unit Tests
- Auth functions (bcrypt, sessions)
- Twitter service methods
- Database queries

### Integration Tests
- OAuth flow end-to-end
- API endpoints
- Database operations

### E2E Tests
- Complete user journeys
- Tweet posting flow
- Admin panel operations

---

**Built with modern best practices for scalability, security, and maintainability.**
