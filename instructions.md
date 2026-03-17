# Startup Contacts PWA — Instructions

## Overview
The **Startup Contacts** app is the digital operating system for the Venture Club Münster (VCM) trade show. It combines ticketing, recruiting, and event management in a Progressive Web App accessible on Android & iOS.

---

## Tech Stack
| Layer | Technology |
|---|---|
| Frontend | React / Next.js 14 (App Router) |
| PWA | `next-pwa` (service worker + manifest) |
| Auth | Supabase Magic Links (passwordless, persistent session via cookie) |
| Database | Supabase (PostgreSQL) — users, tickets, workshops, scans |
| CMS | Sanity.io — schedule, speakers, partners, global content |
| Payments | Stripe (future integration for ticket purchases) |

---

## User Personas & Navigation

### 1. Visitor / User
**Bottom Bar Tabs:**
| Tab | Description |
|---|---|
| **Schedule** | Timetable of all events on the trade show day. Filterable by stage and format type. Content managed via Sanity. |
| **Information** | List of partners, exhibitors, and speakers. Filterable. Content managed via Sanity. |
| **Workshops** | List of all workshops. Bookable with one click. Content managed via Sanity. |
| **Profile** | Standard profile page (name, university, CV, afterparty RSVP). |

### 2. Exhibitor
**Bottom Bar Tabs:**
| Tab | Description |
|---|---|
| **Bewerber** | List of all applicants with ability to accept/reject. |
| **Profile** | Standard profile page. |

---

## Authentication Flow

1. **No explicit login page** — users arrive at a landing screen:
   > *"No account detected. Open the link you received by mail to login."*
2. User clicks a **magic link** sent to their email → redirected to `/auth/callback`
3. On first login, a **persistent session cookie** is stored so the user never needs to log in again
4. The app checks the cookie on every visit; if valid, auto-redirects to the appropriate dashboard
5. User role (`visitor` or `exhibitor`) is determined from the Supabase `profiles` table

---

## Data Sources

### Supabase (PostgreSQL)
- `profiles` — user data (name, email, role, university, cv_url, afterparty_rsvp)
- `workshop_bookings` — which user booked which workshop
- `applicants` — visitor applications visible to exhibitors
- `scans` — badge scan records

### Sanity.io (CMS)
- `schedule` — time, location, title, category, speaker reference
- `speaker` — name, photo, LinkedIn, bio
- `partner` — company name, logo, description, booth number, category
- `workshop` — title, description, capacity, time, host
- `globalContent` — T&C, privacy policy, FAQs, emergency info

---

## Project Structure
```
SC-PWA2/
├── public/
│   ├── manifest.json          # PWA manifest
│   ├── icons/                 # App icons (192x192, 512x512)
│   └── sw.js                  # Service worker (generated)
├── src/
│   ├── app/
│   │   ├── layout.tsx         # Root layout
│   │   ├── page.tsx           # Login / landing page
│   │   ├── auth/
│   │   │   └── callback/
│   │   │       └── route.ts   # Magic link callback
│   │   └── (dashboard)/
│   │       ├── layout.tsx     # Dashboard layout with bottom bar
│   │       ├── schedule/
│   │       │   └── page.tsx   # Schedule page (Visitor)
│   │       ├── information/
│   │       │   └── page.tsx   # Partners/Speakers (Visitor)
│   │       ├── workshops/
│   │       │   └── page.tsx   # Workshops list (Visitor)
│   │       ├── profile/
│   │       │   └── page.tsx   # Profile page (shared)
│   │       └── applicants/
│   │           └── page.tsx   # Bewerber page (Exhibitor)
│   ├── components/
│   │   ├── BottomBar.tsx      # Role-based bottom navigation
│   │   ├── ScheduleCard.tsx   # Schedule event card
│   │   ├── WorkshopCard.tsx   # Workshop card with booking
│   │   ├── PartnerCard.tsx    # Partner/exhibitor card
│   │   ├── SpeakerCard.tsx    # Speaker card
│   │   ├── ApplicantCard.tsx  # Applicant card for exhibitors
│   │   └── FilterBar.tsx      # Reusable filter bar
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── client.ts      # Browser Supabase client
│   │   │   ├── server.ts      # Server Supabase client
│   │   │   └── middleware.ts  # Auth middleware helper
│   │   └── sanity/
│   │       ├── client.ts      # Sanity client
│   │       └── queries.ts     # GROQ queries
│   └── types/
│       └── index.ts           # TypeScript interfaces
├── sanity/
│   ├── schemas/
│   │   ├── schedule.ts
│   │   ├── speaker.ts
│   │   ├── partner.ts
│   │   ├── workshop.ts
│   │   └── globalContent.ts
│   └── sanity.config.ts
├── middleware.ts               # Next.js middleware (auth guard)
├── next.config.js
├── .env.local.example
├── package.json
└── tsconfig.json
```

---

## Environment Variables
```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Sanity
NEXT_PUBLIC_SANITY_PROJECT_ID=your-project-id
NEXT_PUBLIC_SANITY_DATASET=production
NEXT_PUBLIC_SANITY_API_VERSION=2024-01-01

# App
NEXT_PUBLIC_APP_URL=https://app.startupcontacts.de
```

---

## Getting Started
```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.local.example .env.local
# Fill in your Supabase and Sanity credentials

# Run development server
npm run dev

# Build for production
npm run build && npm start
```

---

## Supabase Database Setup (SQL)
Run this in the Supabase SQL editor:

```sql
-- Profiles table
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT NOT NULL,
  full_name TEXT,
  role TEXT NOT NULL DEFAULT 'visitor' CHECK (role IN ('visitor', 'exhibitor', 'admin')),
  university TEXT,
  cv_url TEXT,
  afterparty_rsvp BOOLEAN DEFAULT false,
  company TEXT,
  booth_number TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Workshop bookings
CREATE TABLE workshop_bookings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  workshop_id TEXT NOT NULL, -- Sanity document ID
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, workshop_id)
);

-- Applicants (visitors applying to exhibitor workshops/jobs)
CREATE TABLE applicants (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  visitor_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  exhibitor_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(visitor_id, exhibitor_id)
);

-- Badge scans
CREATE TABLE scans (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  scanner_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  scanned_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE workshop_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE applicants ENABLE ROW LEVEL SECURITY;
ALTER TABLE scans ENABLE ROW LEVEL SECURITY;

-- Profiles: users can read all, update own
CREATE POLICY "Public profiles are viewable by everyone" ON profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

-- Workshop bookings: users can manage own
CREATE POLICY "Users can view own bookings" ON workshop_bookings FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own bookings" ON workshop_bookings FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own bookings" ON workshop_bookings FOR DELETE USING (auth.uid() = user_id);

-- Applicants: visitors can apply, exhibitors can view their applicants
CREATE POLICY "Visitors can view own applications" ON applicants FOR SELECT USING (auth.uid() = visitor_id);
CREATE POLICY "Exhibitors can view their applicants" ON applicants FOR SELECT USING (auth.uid() = exhibitor_id);
CREATE POLICY "Visitors can create applications" ON applicants FOR INSERT WITH CHECK (auth.uid() = visitor_id);
CREATE POLICY "Exhibitors can update applicant status" ON applicants FOR UPDATE USING (auth.uid() = exhibitor_id);

-- Scans
CREATE POLICY "Users can view own scans" ON scans FOR SELECT USING (auth.uid() = scanner_id);
CREATE POLICY "Users can create scans" ON scans FOR INSERT WITH CHECK (auth.uid() = scanner_id);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

---

## GDPR & Security Notes
- CVs stored encrypted in Supabase Storage with restricted access
- Personal data in Supabase, editorial data in Sanity (data separation)
- Explicit opt-in for sharing recruiting data during personalization
- Magic link sessions use secure, HttpOnly cookies
- Row Level Security (RLS) enforced on all tables

---

## Future Enhancements
- Stripe integration for ticket purchases & holding area
- Push notifications for upcoming workshops
- Gamification level system (Visitor → Co-Creator → Builder)
- Badge scanning via camera
- Afterparty RSVP management
