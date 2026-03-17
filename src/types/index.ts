export type UserRole = 'visitor' | 'exhibitor' | 'admin';

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  role: UserRole;
  university: string | null;
  cv_url: string | null;
  afterparty_rsvp: boolean;
  company: string | null;
  booth_number: string | null;
  created_at: string;
  updated_at: string;
}

export interface WorkshopBooking {
  id: string;
  user_id: string;
  workshop_id: string;
  created_at: string;
}

export interface Applicant {
  id: string;
  visitor_id: string;
  exhibitor_id: string;
  status: 'pending' | 'accepted' | 'rejected';
  created_at: string;
  visitor?: Profile;
}

export interface Scan {
  id: string;
  scanner_id: string;
  scanned_id: string;
  created_at: string;
}

// Sanity types
export interface SanityScheduleItem {
  _id: string;
  title: string;
  time: string;
  endTime?: string;
  location: string;
  category: 'workshop' | 'main-stage' | 'panel' | 'networking';
  speaker?: SanitySpeaker;
  description?: string;
}

export interface SanitySpeaker {
  _id: string;
  name: string;
  photo?: string;
  linkedin?: string;
  bio?: string;
}

export interface SanityPartner {
  _id: string;
  name: string;
  logo?: string;
  description?: string;
  boothNumber?: string;
  category: 'gold' | 'silver' | 'bronze';
  website?: string;
}

export interface SanityWorkshop {
  _id: string;
  title: string;
  description?: string;
  capacity: number;
  time: string;
  endTime?: string;
  location: string;
  host: string;
  hostLogo?: string;
}
