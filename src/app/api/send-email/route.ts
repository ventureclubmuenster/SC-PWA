import { Resend } from 'resend';
import { NextResponse } from 'next/server';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST() {
  const { data, error } = await resend.emails.send({
    from: 'SC-PWA <noreply@startup-contacts.de>',
    to: ['lucas.nasch@ventureclub-muenster.de'],
    subject: 'Hallo von SC-PWA',
    html: '<p>Diese E-Mail wurde über die SC-PWA App gesendet.</p>',
  });

  if (error) {
    console.error('[send-email] Resend error:', error);
    return NextResponse.json({ error: error.message, name: error.name }, { status: 500 });
  }

  return NextResponse.json({ id: data?.id });
}
