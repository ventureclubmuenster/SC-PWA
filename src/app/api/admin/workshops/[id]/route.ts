import { NextResponse } from 'next/server';
import { verifyCmsSession } from '@/lib/admin/auth';
import { createAdminClient } from '@/lib/supabase/admin';

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await verifyCmsSession())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const supabase = createAdminClient();
  const body = await request.json();
  const { data, error } = await supabase
    .from('workshops')
    .update(body)
    .eq('id', id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Auto-update the corresponding schedule_items entry
  await supabase
    .from('schedule_items')
    .update({
      title: data.title,
      time: data.time,
      end_time: data.end_time,
      location: data.location || 'TBD',
      description: data.description,
    })
    .eq('workshop_id', id);

  return NextResponse.json(data);
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await verifyCmsSession())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const supabase = createAdminClient();

  // schedule_items with workshop_id will be cascade-deleted
  const { error } = await supabase.from('workshops').delete().eq('id', id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
