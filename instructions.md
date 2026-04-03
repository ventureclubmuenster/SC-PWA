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
| **Info** | List of partners, exhibitors, and speakers. Filterable. Content managed via Sanity. |
| **Home** | Central home page. Uses SC Logo as icon in the nav bar. |
| **Ticket** | QR code entry pass with ticket info. |
| **Lageplan** | Floor plan / venue map. |

**Workshops** are accessible via the Profile page (not in the bottom nav).
**Profile** is accessible via the profile button in the TopBar (top right).

### 2. Exhibitor
**Bottom Bar Tabs:**
| Tab | Description |
|---|---|
| **Bewerber** | List of all applicants with ability to accept/reject. |
| **Lageplan** | Floor plan / venue map. |

**Profile** is accessible via the TopBar profile button (top right).

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

## Proxy Architecture

All incoming requests pass through the **proxy** (`src/proxy.ts`), which acts as the central auth and routing gate. The Next.js middleware entry point (`src/middleware.ts`) delegates directly to the proxy.

### Request Flow
1. Request enters Next.js middleware → calls `proxy(request)` from `src/proxy.ts`
2. Proxy inspects the pathname and decides how to handle the request:

| Route Pattern | Behavior |
|---|---|
| `/admin/dashboard/*` | Verify `cms_session` cookie (SHA-256 hash of `CMS_PASSWORD`). Redirect to `/admin` if invalid. |
| `/admin/*`, `/api/admin/*` | Bypass main app auth entirely (admin panel has its own password auth). |
| `/api/webhooks/*` | Bypass auth (verified via HMAC in the route handlers). |
| `/claim/*`, `/api/tickets/*` | Bypass auth (ticket claim flow handles auth internally). |
| Everything else | Delegate to `updateSession(request)` from `src/lib/supabase/middleware.ts`. |

### Session Management (`updateSession`)
The `updateSession()` function in `src/lib/supabase/middleware.ts`:
- Creates a Supabase server client to validate/refresh the session cookie
- If **no user** and route is a protected page → redirect to `/?next=<return_url>`
- If **user exists** and route is `/` (login page) → redirect to `/home` (or `?next` param)
- In **development mode** (`NODE_ENV === 'development'`): skips auth and redirects `/` to `/home`

### Matcher Config
The proxy only runs on relevant routes. Static assets are excluded:
```typescript
matcher: [
  '/((?!_next/static|_next/image|favicon.ico|icons|manifest.json|sw.js|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
]
```

### Admin Authentication (separate from Supabase)
- Password-based login via `POST /api/admin/auth`
- Session stored as `cms_session` cookie (SHA-256 hash of password, max-age: 7 days)
- Managed by `src/lib/admin/auth.ts`

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
│   ├── middleware.ts           # Next.js middleware entry (delegates to proxy)
│   ├── proxy.ts               # Auth/routing proxy — central request gate
│   ├── app/
│   │   ├── layout.tsx         # Root layout (AuthProvider + ThemeProvider)
│   │   ├── page.tsx           # Login / landing page
│   │   ├── globals.css        # Theme & CSS variables
│   │   ├── auth/
│   │   │   └── callback/
│   │   │       └── route.ts   # Magic link callback (PKCE)
│   │   ├── claim/
│   │   │   └── page.tsx       # Ticket claim flow (token-based)
│   │   ├── transfer/          # Ticket transfer flow
│   │   ├── (dashboard)/
│   │   │   ├── layout.tsx     # Dashboard layout (TopBar + BottomBar)
│   │   │   ├── home/page.tsx  # Home / intro page
│   │   │   ├── schedule/page.tsx   # Schedule (Visitor)
│   │   │   ├── information/page.tsx # Partners/Speakers (Visitor)
│   │   │   ├── workshops/page.tsx   # Workshops list (Visitor)
│   │   │   ├── ticket/page.tsx      # QR ticket page
│   │   │   ├── lageplan/page.tsx    # Floor plan / venue map
│   │   │   ├── profile/page.tsx     # Profile page (shared)
│   │   │   └── applicants/page.tsx  # Bewerber page (Exhibitor)
│   │   ├── (events)/          # Event discovery route group
│   │   ├── admin/             # CMS admin panel (password-protected)
│   │   ├── cms/               # CMS content management
│   │   └── api/
│   │       ├── admin/         # Admin API (auth, analytics, CRUD)
│   │       ├── auth/          # Auth API (login, verify-code)
│   │       ├── tickets/       # Ticket API (claim, personalize, transfer, verify)
│   │       ├── webhooks/      # Webhook endpoints (orders, tickets — HMAC verified)
│   │       ├── push-subscription/ # Push notification subscription
│   │       └── send-email/    # Resend email API
│   ├── components/
│   │   ├── AuthProvider.tsx   # Token lifecycle + cross-tab sync
│   │   ├── DataProvider.tsx   # User context + demo profile (dev mode)
│   │   ├── TopBar.tsx         # Top bar with logo and profile button
│   │   ├── BottomBar.tsx      # Role-based bottom navigation
│   │   ├── FilterBar.tsx      # Reusable filter bar
│   │   ├── PageHeader.tsx     # Page header component
│   │   └── ...                # Additional UI components
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── client.ts      # Browser Supabase client (singleton)
│   │   │   ├── server.ts      # Server Supabase client
│   │   │   ├── admin.ts       # Admin client (service role, bypasses RLS)
│   │   │   └── middleware.ts  # updateSession() — Supabase session refresh helper
│   │   ├── admin/
│   │   │   └── auth.ts        # CMS admin auth (password-based, SHA-256)
│   │   ├── email.ts           # Email helpers
│   │   └── ticket-claims.ts   # Ticket claim token logic
│   └── types/
│       └── index.ts           # TypeScript interfaces
├── supabase/
│   ├── migration.sql          # Base schema migration
│   └── ...                    # Additional migrations & seed data
├── next.config.ts
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
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Sanity
NEXT_PUBLIC_SANITY_PROJECT_ID=your-project-id
NEXT_PUBLIC_SANITY_DATASET=production
NEXT_PUBLIC_SANITY_API_VERSION=2024-01-01

# App
NEXT_PUBLIC_APP_URL=https://app.startupcontacts.de

# Email (Resend)
RESEND_API_KEY=your-resend-api-key

# Admin CMS
CMS_PASSWORD=your-cms-password

# Webhooks
ORDER_WEBHOOK_HMAC_SECRET=your-hmac-secret
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

## Development Mode — Demo Data

When running locally with `npm run dev`, the app operates without Supabase authentication. The proxy (`src/proxy.ts`) delegates to `updateSession()` in `src/lib/supabase/middleware.ts`, which skips auth checks in development and redirects unauthenticated users directly to `/home`.

Since there is no authenticated user, the `DataProvider` (`src/components/DataProvider.tsx`) injects a **demo profile** automatically so that all features — including the QR code on the ticket page — work without needing to log in.

### Demo Profile Details
| Field | Value |
|---|---|
| Name | Demo User |
| Email | demo@startup-contacts.de |
| Role | visitor |
| University | Universität Münster |
| Attendee Role | student |
| Ticket ID | DEMO-TICKET-001 |

This demo profile is **only active** when `NODE_ENV === 'development'` and no real user is authenticated. It has no effect in production builds.

### What works in demo mode
- **Ticket page:** QR code is generated from the demo profile ID
- **Profile page:** Shows demo user data (read-only — saves will fail without a real Supabase user)
- **Schedule, Information, Workshops:** Load from Supabase as normal (public data, no auth required)

### What does NOT work in demo mode
- Saving profile changes (no real user in Supabase)
- Workshop bookings (require a real `user_id`)
- Applicant features (require real exhibitor/visitor relationships)

---

## App Layout Architecture

The dashboard uses a layered card-on-gradient layout:

### Structure
1. **Fixed gradient background** (`fixed inset-0 z-0 top-bar-gradient`) — always visible behind everything, never scrolls. Vertical gradient from CI orange (`#f76c07`) at top to CI red (`#fe281f`) at bottom.
2. **TopBar** (`fixed z-40`) — transparent, sits on the gradient. Shows SC Logo + "SC-PWA-v1" on the left, notification bell + profile button on the right. Profile button links to `/profile`.
3. **Main content card** (`mt-20 rounded-t-3xl`) — white/dark card with rounded top corners that slides over the gradient. All page content renders inside this card.
4. **BottomBar** (`fixed z-50`) — floating pill-shaped navigation bar at the bottom.

### Pull-to-refresh
The `body` background is set to the gradient start color (`#f76c07`) so that when the user pulls down to refresh on mobile, the orange gradient background remains visible behind the main content card.

### Key files
- `src/app/(dashboard)/layout.tsx` — assembles the layers
- `src/components/TopBar.tsx` — top bar with logo, title, and action buttons
- `src/components/BottomBar.tsx` — bottom navigation with role-based tabs
- `src/app/globals.css` — `.top-bar-gradient` class defines the gradient

### CI Brand Colors
- **Orange:** `#f76c07`
- **Red:** `#fe281f`
- Used in the background gradient (vertical: orange top → red bottom) and the SC logo

---

## Design System — CSS Variables

All colors, radii, and visual tokens are defined as CSS custom properties in `src/app/globals.css`. Both dark mode (`:root, .dark`) and light mode (`.light`) have their own set of values. Changing a variable in one place updates the entire app.

### Color Variables

| Variable | Dark Mode | Light Mode | Purpose |
|---|---|---|---|
| `--background` | `#121212` | `#F4F4F5` | Page background |
| `--foreground` | `#EDEBE8` | `#1A1A1A` | Primary text (warm beige in dark, soft dark in light) |
| `--foreground-pure` | `#F5F5F5` | `#111111` | Pure white/black fallback when needed |
| `--highlight` | `#EDEBE8` | `#3A3A3A` | Active states: nav tabs, filter pills, buttons |
| `--highlight-text` | `#1A1A1A` | `#EDEBE8` | Text color on highlight backgrounds |
| `--accent` | `#FF5E00` | `#FF5E00` | Brand orange (gradient start) |
| `--accent-mid` | `#FF7A1A` | `#FF7A1A` | Gradient midpoint |
| `--accent-end` | `#FF9233` | `#FF9233` | Gradient end |
| `--surface-1/2/3` | `#1A/#22/#2A` | `#FFF/#F0/#E8` | Elevation layers |
| `--card` | `#1A1A1A` | `#FFFFFF` | Card backgrounds |
| `--ticket-card` | `#EDEBE8` | `#FFFFFF` | Ticket card background |
| `--ticket-text` | `#4A4A4A` | `#3A3A3A` | Text on ticket card |
| `--ticket-muted` | `#9A9A96` | `#9A9A96` | Muted text on ticket card |
| `--selected-bg` | `#EDEBE8` | `#3A3A3A` | Selected option background (e.g. role buttons) |
| `--selected-text` | `#1A1A1A` | `#EDEBE8` | Selected option text |
| `--muted` | `#888888` | `#71717A` | Secondary/muted text |
| `--border` | `rgba(255,255,255,0.07)` | `rgba(0,0,0,0.06)` | Borders & dividers |

### Status Colors (semantic)

| Variable | Dark Mode | Light Mode | Purpose |
|---|---|---|---|
| `--status-success` / `--status-success-bg` | `#4ade80` | `#16a34a` | Active, accepted, booked |
| `--status-error` / `--status-error-bg` | `#f87171` | `#dc2626` | Errors, rejected, delete |
| `--status-warning` / `--status-warning-bg` | `#fbbf24` | `#d97706` | Pending, waiting list |
| `--status-info` / `--status-info-bg` | `#60a5fa` | `#2563eb` | CV required, info badges |

### Radius Variables

| Variable | Value | Purpose |
|---|---|---|
| `--radius-card` | `24px` | Card border radius |
| `--radius-inner` | `16px` | Inner elements, buttons, inputs |
| `--radius-pill` | `20px` | Pill-shaped elements: filter pills, badges, nav bar, status tags |

### Key CSS Classes

| Class | Description |
|---|---|
| `.pill` | Applies `border-radius: var(--radius-pill)` — use on badges, filter buttons, nav elements |
| `.selected-state` | Applies `--selected-bg` + `--selected-text` — for role toggles, option buttons |
| `.btn-dark` | Uses `--highlight` background and `--highlight-text` color |
| `.btn-primary` | Orange gradient with `--highlight` text |
| `.card-clean` | Standard card with `--surface-1` background and border |
| `.text-subtitle` | Muted uppercase label style |

### Ticket Page Layout

The ticket page (`src/app/(dashboard)/ticket/page.tsx`) uses the standard layout (gradient background + white content card):
- **Ticket card** uses `--ticket-card` / `--ticket-text` / `--ticket-muted` for the beige card with QR code
- **Wallet buttons** (Apple Wallet, Google Wallet) placed below the card — functionality TBD
- **Title** uses standard `PageHeader` component inside the main content card

### How to Customize

To adjust the overall tone of the app, edit these key variables in `src/app/globals.css`:
- **Softer/warmer whites:** Change `--highlight` and `--foreground` in dark mode
- **Less contrast in light mode:** Change `--highlight` (currently `#3A3A3A`, increase for softer)
- **Pill roundness:** Change `--radius-pill` (14px = square-ish, 20px = current, 100px = fully round)
- **Accent color:** Change `--accent`, `--accent-mid`, `--accent-end` together

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
