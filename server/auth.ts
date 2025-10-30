import bcrypt from 'bcryptjs';
import type { Request, Response, NextFunction } from 'express';
import { db } from './db';
import { adminUsers } from '../shared/schema';
import { eq } from 'drizzle-orm';

// Middleware to require authentication
export function requireAuth(req: Request, res: Response, next: NextFunction) {
  console.log('[auth] Checking authentication:', {
    hasSession: !!req.session,
    adminId: req.session?.adminId,
    username: req.session?.username,
    sessionID: req.sessionID
  });
  
  if (!req.session || !req.session.adminId) {
    console.log('[auth] ❌ Authentication failed - no adminId in session');
    return res.status(401).json({ success: false, error: 'Authentication required' });
  }
  
  console.log('[auth] ✅ Authentication successful for user:', req.session.username);
  next();
}

// Create default admin user if none exists, or update password if it doesn't match
export async function initializeDefaultAdmin() {
  try {
    const [existingAdmin] = await db
      .select()
      .from(adminUsers)
      .where(eq(adminUsers.username, 'admin'))
      .limit(1);
    
    const passwordHash = await bcrypt.hash('admin123', 10);
    
    if (!existingAdmin) {
      // Create new admin user
      await db.insert(adminUsers).values({
        username: 'admin',
        passwordHash,
        email: 'admin@tasker.com',
        role: 'admin',
        isActive: true,
      });
      console.log('✅ Default admin user created (username: admin, password: admin123)');
    } else {
      // Check if stored password matches admin123
      const isCurrentPasswordValid = await bcrypt.compare('admin123', existingAdmin.passwordHash);
      
      if (!isCurrentPasswordValid) {
        // Update admin password to admin123
        await db
          .update(adminUsers)
          .set({ passwordHash })
          .where(eq(adminUsers.id, existingAdmin.id));
        console.log('✅ Admin password updated to admin123');
      } else {
        console.log('✅ Admin user already exists with correct password');
      }
    }
  } catch (error) {
    console.error('❌ Error initializing default admin:', error);
  }
}

// Authenticate admin user
export async function authenticateAdmin(username: string, password: string) {
  try {
    console.log('[authenticateAdmin] Looking up user:', username);
    const [user] = await db
      .select()
      .from(adminUsers)
      .where(eq(adminUsers.username, username))
      .limit(1);

    console.log('[authenticateAdmin] User lookup result:', {
      userFound: !!user,
      userId: user?.id,
      username: user?.username,
      isActive: user?.isActive,
      hasPasswordHash: !!user?.passwordHash
    });

    if (!user) {
      console.log('[authenticateAdmin] ❌ User not found');
      return { success: false, error: 'Invalid credentials' };
    }

    if (!user.isActive) {
      console.log('[authenticateAdmin] ❌ User is inactive');
      return { success: false, error: 'Invalid credentials' };
    }

    console.log('[authenticateAdmin] Comparing password...');
    const validPassword = await bcrypt.compare(password, user.passwordHash);
    console.log('[authenticateAdmin] Password valid:', validPassword);
    
    if (!validPassword) {
      console.log('[authenticateAdmin] ❌ Invalid password');
      return { success: false, error: 'Invalid credentials' };
    }

    // Update last login
    await db
      .update(adminUsers)
      .set({ lastLoginAt: new Date() })
      .where(eq(adminUsers.id, user.id));

    console.log('[authenticateAdmin] ✅ Authentication successful for user:', user.id);
    return { success: true, user };
  } catch (error) {
    console.error('[authenticateAdmin] ❌ Authentication error:', error);
    return { success: false, error: 'Authentication failed' };
  }
}
