import { createAdminClient } from '@/lib/supabase/admin';
import { verifyCmsSession } from '@/lib/admin/auth';
import { NextResponse } from 'next/server';

export async function GET() {
  const valid = await verifyCmsSession();
  if (!valid) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const supabase = createAdminClient();

  // Total users and ticket validation (users with full_name = validated ticket)
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, full_name, created_at, updated_at')
    .order('created_at', { ascending: true });

  const allProfiles = profiles || [];

  // Build daily registration and active user data for the last 14 days
  const now = new Date();
  const days: { date: string; registrations: number; activeUsers: number; validatedTickets: number }[] = [];

  for (let i = 13; i >= 0; i--) {
    const day = new Date(now);
    day.setDate(day.getDate() - i);
    const dayStr = day.toISOString().split('T')[0];
    const nextDay = new Date(day);
    nextDay.setDate(nextDay.getDate() + 1);

    const registrations = allProfiles.filter((p) => {
      const d = p.created_at?.split('T')[0];
      return d === dayStr;
    }).length;

    const activeUsers = allProfiles.filter((p) => {
      const d = p.updated_at?.split('T')[0];
      return d === dayStr;
    }).length;

    const validatedTickets = allProfiles.filter((p) => {
      const d = p.created_at?.split('T')[0];
      return d && d <= dayStr && p.full_name;
    }).length;

    days.push({ date: dayStr, registrations, activeUsers, validatedTickets });
  }

  const totalUsers = allProfiles.length;
  const totalValidated = allProfiles.filter((p) => p.full_name).length;

  // Ticket status distribution from tickets table
  const { data: tickets } = await supabase
    .from('tickets')
    .select('status');

  const allTickets = tickets || [];
  const ticketStatuses = {
    created: allTickets.filter((t) => t.status === 'created').length,
    assigned: allTickets.filter((t) => t.status === 'assigned').length,
    validated: allTickets.filter((t) => t.status === 'validated').length,
  };
  const totalTickets = allTickets.length;

  return NextResponse.json({ days, totalUsers, totalValidated, ticketStatuses, totalTickets });
}
