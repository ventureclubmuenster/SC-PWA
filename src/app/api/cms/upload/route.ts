import { NextResponse } from 'next/server';
import { verifyCmsSession } from '@/lib/cms/auth';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST(request: Request) {
  if (!(await verifyCmsSession())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get('file') as File | null;
  if (!file) {
    return NextResponse.json({ error: 'No file provided' }, { status: 400 });
  }

  const supabase = createAdminClient();
  const ext = file.name.split('.').pop();
  const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

  const { error } = await supabase.storage
    .from('cms-images')
    .upload(fileName, file, { contentType: file.type });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const { data: urlData } = supabase.storage
    .from('cms-images')
    .getPublicUrl(fileName);

  return NextResponse.json({ url: urlData.publicUrl });
}
