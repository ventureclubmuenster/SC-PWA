import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM = 'Startup Contacts <noreply@startup-contacts.de>';

export async function sendEmail(options: {
  to: string;
  subject: string;
  html: string;
}) {
  return resend.emails.send({
    from: FROM,
    to: [options.to],
    subject: options.subject,
    html: options.html,
  });
}

export function buildOrderConfirmationHtml(email: string, ticketCount: number) {
  return `
<!DOCTYPE html>
<html lang="de">
<head><meta charset="UTF-8" /></head>
<body style="font-family: Arial, sans-serif; color: #1a1a1a; max-width: 600px; margin: 0 auto; padding: 24px;">
  <h1 style="font-size: 24px; margin-bottom: 16px;">Vielen Dank für deine Bestellung! 🎉</h1>
  <p>Hallo,</p>
  <p>
    wir haben deine Bestellung über
    <strong>${ticketCount} Ticket${ticketCount !== 1 ? 's' : ''}</strong>
    erfolgreich erhalten.
  </p>
  <p>
    Du erhältst in Kürze eine separate E-Mail mit deinem Magic-Link,
    über den du dich in der Startup Contacts App anmelden kannst.
  </p>
  <p>Wir freuen uns auf dich!</p>
  <br />
  <p style="color: #666; font-size: 14px;">
    Dein Startup Contacts Team<br />
    Venture Club Münster
  </p>
</body>
</html>`.trim();
}
