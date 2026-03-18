-- Content tables for admin panel (replacing Sanity)

CREATE TABLE speakers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  photo_url TEXT,
  linkedin TEXT,
  bio TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE partners (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  logo_url TEXT,
  description TEXT,
  booth_number TEXT,
  category TEXT NOT NULL CHECK (category IN ('gold', 'silver', 'bronze')),
  website TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE workshops (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  capacity INTEGER NOT NULL,
  time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ,
  location TEXT,
  host TEXT NOT NULL,
  host_logo_url TEXT,
  has_waiting_list BOOLEAN DEFAULT FALSE,
  cv_required BOOLEAN DEFAULT FALSE,
  exhibitor_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE schedule_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ,
  location TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('workshop', 'main-stage', 'panel', 'networking')),
  description TEXT,
  speaker_id UUID REFERENCES speakers(id) ON DELETE SET NULL,
  workshop_id UUID REFERENCES workshops(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Disable RLS on content tables (public read, CMS API handles write auth)
ALTER TABLE speakers DISABLE ROW LEVEL SECURITY;
ALTER TABLE partners DISABLE ROW LEVEL SECURITY;
ALTER TABLE workshops DISABLE ROW LEVEL SECURITY;
ALTER TABLE schedule_items DISABLE ROW LEVEL SECURITY;

-- Push notification subscriptions
CREATE TABLE push_subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  endpoint TEXT NOT NULL UNIQUE,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE push_subscriptions DISABLE ROW LEVEL SECURITY;

-- Notification send logs
CREATE TABLE notification_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  url TEXT,
  icon TEXT,
  badge TEXT,
  image TEXT,
  tag TEXT,
  renotify BOOLEAN DEFAULT FALSE,
  require_interaction BOOLEAN DEFAULT FALSE,
  silent BOOLEAN DEFAULT FALSE,
  vibrate TEXT,
  dir TEXT CHECK (dir IN ('auto', 'ltr', 'rtl')),
  lang TEXT,
  actions JSONB,
  timestamp TIMESTAMPTZ,
  sent_count INTEGER NOT NULL DEFAULT 0,
  failed_count INTEGER NOT NULL DEFAULT 0,
  total_subscribers INTEGER NOT NULL DEFAULT 0,
  errors JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE notification_logs DISABLE ROW LEVEL SECURITY;

-- Storage: Create a public bucket named "cms-images" in Supabase dashboard
-- Storage > New bucket > Name: "cms-images" > Public: ON

-- Storage: Create a private bucket named "cvs" in Supabase dashboard
-- Storage > New bucket > Name: "cvs" > Public: OFF
-- Add RLS policy: users can upload to their own folder (uid/) and read their own files

-- Add new columns to existing tables (run if tables already exist):
-- ALTER TABLE workshops ADD COLUMN has_waiting_list BOOLEAN DEFAULT FALSE;
-- ALTER TABLE workshops ADD COLUMN cv_required BOOLEAN DEFAULT FALSE;
-- ALTER TABLE workshops ADD COLUMN exhibitor_id UUID REFERENCES profiles(id) ON DELETE SET NULL;
-- ALTER TABLE schedule_items ADD COLUMN workshop_id UUID REFERENCES workshops(id) ON DELETE CASCADE;
-- ALTER TABLE workshop_bookings ADD COLUMN status TEXT DEFAULT 'approved' CHECK (status IN ('pending', 'approved', 'accepted', 'rejected'));
