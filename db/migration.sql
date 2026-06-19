-- Migration: Account Management System Upgrades
-- Description: Adds profile, social links, privacy preferences, 2FA configurations, and session management schemas.

-- 1. Extend the users table with new fields
ALTER TABLE users 
  ADD COLUMN IF NOT EXISTS display_name VARCHAR(255),
  ADD COLUMN IF NOT EXISTS bio TEXT,
  ADD COLUMN IF NOT EXISTS social_links JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS privacy_controls JSONB DEFAULT '{"profile_visibility": "public", "activity_status": true, "search_indexing": true}'::jsonb,
  ADD COLUMN IF NOT EXISTS notification_preferences JSONB DEFAULT '{"email_alerts": true, "sms_alerts": false, "push_alerts": true}'::jsonb,
  ADD COLUMN IF NOT EXISTS two_factor_secret VARCHAR(255),
  ADD COLUMN IF NOT EXISTS two_factor_recovery_codes TEXT[] DEFAULT '{}'::text[];

-- Add indexes for performance optimization
CREATE INDEX IF NOT EXISTS idx_users_display_name ON users (display_name);

-- 2. Ensure sessions table is structured properly for session tracking and revocation
CREATE TABLE IF NOT EXISTS sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_type VARCHAR(50) NOT NULL DEFAULT 'user', -- 'user' or 'organization'
  user_id INT NOT NULL, -- references users(id) or orgs(id)
  device_fingerprint VARCHAR(255),
  ip_address VARCHAR(45) NOT NULL,
  country VARCHAR(100) DEFAULT '',
  city VARCHAR(100) DEFAULT '',
  user_agent TEXT NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  last_seen_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Add foreign key and indexes for session lookups and joins
CREATE INDEX IF NOT EXISTS idx_sessions_user_account ON sessions (user_id, account_type);
CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON sessions (expires_at);

-- 3. Rollback script (For reference and clean architecture rollback)
-- ALTER TABLE users 
--   DROP COLUMN IF EXISTS display_name,
--   DROP COLUMN IF EXISTS bio,
--   DROP COLUMN IF EXISTS social_links,
--   DROP COLUMN IF EXISTS privacy_controls,
--   DROP COLUMN IF EXISTS notification_preferences,
--   DROP COLUMN IF EXISTS two_factor_secret,
--   DROP COLUMN IF EXISTS two_factor_recovery_codes;
-- DROP TABLE IF EXISTS sessions;

-- 4. Recommend database indexes for high-performance Vote & Team query paths
-- Create indexes on polls table
CREATE INDEX IF NOT EXISTS idx_polls_admin_id ON polls (admin_id);
CREATE INDEX IF NOT EXISTS idx_polls_status ON polls (status);
CREATE INDEX IF NOT EXISTS idx_polls_visibility ON polls (visibility);

-- Create indexes on votes table
CREATE INDEX IF NOT EXISTS idx_votes_poll_id ON votes (poll_id);
CREATE INDEX IF NOT EXISTS idx_votes_voter_id ON votes (voter_id);

-- Create indexes on team lookup tables
CREATE INDEX IF NOT EXISTS idx_team_members_team_id ON team_members (team_id);
CREATE INDEX IF NOT EXISTS idx_team_members_user_id ON team_members (user_id);
