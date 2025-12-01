-- ===========================
-- SUBSCRIPTION DATABASE TABLES
-- ===========================
-- Run this in your Supabase SQL Editor

-- User Subscriptions Table
CREATE TABLE IF NOT EXISTS user_subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan TEXT NOT NULL DEFAULT 'free' CHECK (plan IN ('free', 'pro_monthly', 'pro_6month', 'pro_yearly')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'expired')),
  
  -- Purchase info
  purchase_token TEXT, -- Google Play / App Store receipt
  store TEXT CHECK (store IN ('google_play', 'app_store', 'manual')),
  
  -- Dates
  started_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id)
);

-- User Usage Tracking Table (for free tier limits)
CREATE TABLE IF NOT EXISTS user_usage (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Usage counters
  cards_created INTEGER DEFAULT 0,
  exports_used INTEGER DEFAULT 0,
  decks_created INTEGER DEFAULT 0,
  
  -- Reset tracking (for potential monthly reset of free limits)
  last_reset_at TIMESTAMPTZ DEFAULT NOW(),
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_usage ENABLE ROW LEVEL SECURITY;

-- Policies for user_subscriptions
CREATE POLICY "Users can view own subscription" ON user_subscriptions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own subscription" ON user_subscriptions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own subscription" ON user_subscriptions
  FOR UPDATE USING (auth.uid() = user_id);

-- Policies for user_usage
CREATE POLICY "Users can view own usage" ON user_usage
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own usage" ON user_usage
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own usage" ON user_usage
  FOR UPDATE USING (auth.uid() = user_id);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_user_id ON user_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_usage_user_id ON user_usage(user_id);

-- Function to auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
DROP TRIGGER IF EXISTS update_user_subscriptions_updated_at ON user_subscriptions;
CREATE TRIGGER update_user_subscriptions_updated_at
  BEFORE UPDATE ON user_subscriptions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_usage_updated_at ON user_usage;
CREATE TRIGGER update_user_usage_updated_at
  BEFORE UPDATE ON user_usage
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ===========================
-- OPTIONAL: Admin functions
-- ===========================

-- Function to grant Pro subscription (for manual upgrades or promotions)
CREATE OR REPLACE FUNCTION grant_pro_subscription(
  target_user_id UUID,
  plan_type TEXT DEFAULT 'pro_monthly',
  duration_days INTEGER DEFAULT 30
)
RETURNS void AS $$
BEGIN
  INSERT INTO user_subscriptions (user_id, plan, status, store, expires_at)
  VALUES (
    target_user_id,
    plan_type,
    'active',
    'manual',
    NOW() + (duration_days || ' days')::INTERVAL
  )
  ON CONFLICT (user_id) 
  DO UPDATE SET
    plan = plan_type,
    status = 'active',
    store = 'manual',
    expires_at = NOW() + (duration_days || ' days')::INTERVAL,
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to reset free user limits (if you want monthly reset)
CREATE OR REPLACE FUNCTION reset_free_user_limits(target_user_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE user_usage
  SET 
    cards_created = 0,
    exports_used = 0,
    last_reset_at = NOW()
  WHERE user_id = target_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
