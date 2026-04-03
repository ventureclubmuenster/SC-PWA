export type UserRole = 'visitor' | 'exhibitor' | 'admin';
export type AttendeeRole = 'student' | 'entrepreneur' | 'other';

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  first_name: string | null;
  last_name: string | null;
  age: number | null;
  attendee_role: AttendeeRole | null;
  ticket_id: string | null;
  role: UserRole;
  university: string | null;
  cv_url: string | null;
  afterparty_rsvp: boolean;
  company: string | null;
  booth_number: string | null;
  privacy_consent: boolean;
  terms_consent: boolean;
  privacy_consent_at: string | null;
  terms_consent_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface WorkshopBooking {
  id: string;
  user_id: string;
  workshop_id: string;
  status: 'pending' | 'approved' | 'accepted' | 'rejected';
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

// Content types (Supabase)
export interface Speaker {
  id: string;
  name: string;
  photo_url: string | null;
  linkedin: string | null;
  bio: string | null;
  created_at: string;
}

export interface Partner {
  id: string;
  name: string;
  logo_url: string | null;
  description: string | null;
  booth_number: string | null;
  category: 'gold' | 'silver' | 'bronze';
  website: string | null;
  created_at: string;
}

export interface ContentWorkshop {
  id: string;
  title: string;
  description: string | null;
  capacity: number;
  time: string;
  end_time: string | null;
  location: string | null;
  host: string;
  host_logo_url: string | null;
  has_waiting_list: boolean;
  cv_required: boolean;
  exhibitor_id: string | null;
  created_at: string;
}

export interface ScheduleItem {
  id: string;
  title: string;
  time: string;
  end_time: string | null;
  location: string;
  category: 'keynote' | 'workshop' | 'podcast' | 'event';
  description: string | null;
  speaker_id: string | null;
  speaker?: Speaker | null;
  workshop_id: string | null;
  created_at: string;
}

export interface Ticket {
  id: string;
  ticket_id: string;
  email: string;
  status: 'created' | 'assigned' | 'validated';
  token_hash: string | null;
  token_expires_at: string | null;
  claimed_by: string | null;
  all_data: Record<string, unknown>;
  created_at: string;
  // Transfer fields
  transfer_status: 'pending' | 'completed' | 'revoked' | null;
  transfer_to_email: string | null;
  transfer_token_hash: string | null;
  transfer_token_expires_at: string | null;
  transferred_from_ticket_id: string | null;
  // Activation fields
  activated: boolean;
  activated_at: string | null;
  activated_by_email: string | null;
}

export interface VerificationCode {
  id: string;
  email: string;
  code_hash: string;
  expires_at: string;
  used: boolean;
  type: 'personalize' | 'login' | 'transfer';
  ticket_token_hash: string | null;
  created_at: string;
}
