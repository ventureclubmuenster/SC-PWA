-- Content tables for CMS (replacing Sanity)

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
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Disable RLS on content tables (public read, CMS API handles write auth)
ALTER TABLE speakers DISABLE ROW LEVEL SECURITY;
ALTER TABLE partners DISABLE ROW LEVEL SECURITY;
ALTER TABLE workshops DISABLE ROW LEVEL SECURITY;
ALTER TABLE schedule_items DISABLE ROW LEVEL SECURITY;

-- Storage: Create a public bucket named "cms-images" in Supabase dashboard
-- Storage > New bucket > Name: "cms-images" > Public: ON
