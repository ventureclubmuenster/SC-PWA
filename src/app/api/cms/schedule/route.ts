import { NextResponse } from 'next/server';
import { verifyCmsSession } from '@/lib/cms/auth';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET() {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('schedule_items')
    .select('*, speaker:speaker_id(id, name, photo_url, linkedin, bio)')
    .order('time');

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(request: Request) {
  if (!(await verifyCmsSession())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createAdminClient();
  const body = await request.json();
  const { data, error } = await supabase
    .from('schedule_items')
    .insert(body)
    .select('*, speaker:speaker_id(id, name, photo_url, linkedin, bio)')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
