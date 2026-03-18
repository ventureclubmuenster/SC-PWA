import { NextResponse } from 'next/server';
import { verifyCmsSession } from '@/lib/admin/auth';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET() {
  if (!(await verifyCmsSession())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('profiles')
    .select('id, full_name, email, company')
    .eq('role', 'exhibitor')
    .order('company');

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
