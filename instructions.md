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
| Email | Resend — transactional email via `noreply@startup-contacts.de` |

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

### Primary: Auto-Login via Ticket Purchase
1. **No explicit login page** — users arrive at a landing screen:
   > *"No account detected. Open the link you received by mail to login."*
2. After ticket purchase, user receives a magic link → redirected to `/auth/callback`
3. On first login, a **persistent session cookie** is stored so the user never needs to log in again
4. The app checks the cookie on every visit; if valid, auto-redirects to the appropriate dashboard
5. User role (`visitor` or `exhibitor`) is determined from the Supabase `profiles` table

### Manual: Magic Link Login
For cases where the user has logged out, switched devices, or the session expired:

1. User navigates to landing page (`/`) and enters their **email address**
2. Click **"Anmelden"** → calls `supabase.auth.signInWithOtp({ email, emailRedirectTo: /auth/callback })`
3. Supabase sends a **magic link** to the email
4. UI shows confirmation: "Schaue in dein E-Mail-Postfach und bestätige deinen Login."
5. User clicks link in email → redirected to `/auth/callback` → session created → redirect to `/schedule`

**Security (all managed by Supabase):**
- Rate limiting on login requests
- Magic link expiry (default 60 minutes)
- Session cookies: secure, HttpOnly

### Profile Page: Logout
- **"Abmelden"** button on profile page → signs out current session, redirects to `/` for fresh login

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
SC-PWA/
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

## Email — Resend Integration

### Setup & Credentials
- **Package:** `resend` (^6.9.4) — install via `npm install resend`
- **API Key:** stored in `.env.local` as `RESEND_API_KEY`
- **Sender domain:** `startup-contacts.de` (verified in Resend dashboard)
- **Default sender address:** `noreply@startup-contacts.de`

### API Route
All emails are sent via the Next.js API route at:
```
POST /api/send-email
```
**File:** `src/app/api/send-email/route.ts`

The route uses the Resend SDK server-side (never expose the API key to the client).

### How to Send an Email

**Basic structure inside the route:**
```typescript
import { Resend } from 'resend';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const resend = new Resend(process.env.RESEND_API_KEY);

  const { data, error } = await resend.emails.send({
    from: 'SC-PWA <noreply@startup-contacts.de>',  // sender — must use verified domain
    to: ['empfaenger@example.com'],                  // recipient(s) — array of strings
    subject: 'Betreff der E-Mail',                   // subject line
    html: '<p>HTML-Inhalt der E-Mail</p>',           // HTML body
    // text: 'Plaintext fallback',                   // optional plaintext version
    // replyTo: 'reply@example.com',                 // optional reply-to address
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ id: data?.id });
}
```

**Calling the route from the frontend:**
```typescript
const res = await fetch('/api/send-email', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ to: 'user@example.com', subject: '...', html: '...' }),
});
```
> Note: pass dynamic values (`to`, `subject`, `html`) in the request body and read them in the route via `await request.json()`.

### Key Rules
1. **Always use the verified sender domain** `startup-contacts.de` — Resend will reject emails from unverified domains.
2. **Never call Resend from the client** — the API key must stay server-side only (API routes or Server Actions).
3. **`to` is always an array** — even for a single recipient: `to: ['user@example.com']`.
4. **Check `error` before using `data`** — Resend returns `{ data, error }`, one of which will be `null`.
5. **HTML is the primary body** — always provide at least a `html` field; add `text` as plaintext fallback for email clients that block HTML.

### Extending with React Email Templates (recommended for complex mails)
Install `@react-email/components` and create templates in `src/emails/`:
```typescript
import { Html, Body, Heading, Text } from '@react-email/components';

export function WelcomeEmail({ name }: { name: string }) {
  return (
    <Html>
      <Body>
        <Heading>Willkommen, {name}!</Heading>
        <Text>Dein Konto wurde erfolgreich erstellt.</Text>
      </Body>
    </Html>
  );
}
```
Then render it to HTML in the route:
```typescript
import { render } from '@react-email/render';
import { WelcomeEmail } from '@/emails/WelcomeEmail';

const html = await render(<WelcomeEmail name="Lucas" />);
await resend.emails.send({ from: '...', to: [...], subject: '...', html });
```

---

## Future Enhancements
- Stripe integration for ticket purchases & holding area
- Push notifications for upcoming workshops
- Gamification level system (Visitor → Co-Creator → Builder)
- Badge scanning via camera
- Afterparty RSVP management
