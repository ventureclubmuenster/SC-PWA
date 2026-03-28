import { NextRequest, NextResponse } from 'next/server';
import { sendEmail } from '@/lib/email';

export async function POST(request: NextRequest) {
  const { to, subject, html } = (await request.json()) as {
    to?: string;
    subject?: string;
    html?: string;
  };

  if (!to || !subject || !html) {
    return NextResponse.json(
      { error: 'Missing required fields: to, subject, html' },
      { status: 400 },
    );
  }

  const { data, error } = await sendEmail({ to, subject, html });

  if (error) {
    console.error('[send-email] Resend error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ id: data?.id });
}
