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

interface TicketClaimLink {
  ticketId: string;
  token: string;
  label: string;
}

export function buildOrderConfirmationHtml(
  email: string,
  ticketCount: number,
  claimLinks: TicketClaimLink[] = [],
) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://app.startup-contacts.de';

  const ticketButtons = claimLinks
    .map(
      (link, i) => `
    <tr>
      <td style="padding: 8px 0;">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
          <tr>
            <td style="background: #f8f8f8; border-radius: 12px; padding: 16px;">
              <p style="margin: 0 0 12px 0; font-size: 14px; color: #333;">
                <strong>Ticket ${i + 1}</strong>${link.label ? ` — ${link.label}` : ''}
              </p>
              <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="background: #1D1D1F; border-radius: 8px;">
                    <a href="${appUrl}/claim?token=${link.token}"
                       style="display: inline-block; padding: 12px 24px; color: #ffffff; font-size: 14px; font-weight: 600; text-decoration: none;">
                      Ticket aktivieren →
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </td>
    </tr>`,
    )
    .join('\n');

  const ticketSection =
    claimLinks.length > 0
      ? `
  <p style="margin-top: 24px; font-weight: 600; font-size: 16px;">Deine Tickets:</p>
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
    ${ticketButtons}
  </table>
  <p style="font-size: 13px; color: #888; margin-top: 16px;">
    Jeder Link kann nur einmal verwendet werden. Du wirst gebeten, deine E-Mail-Adresse zu bestätigen,
    bevor das Ticket dir zugewiesen wird.
  </p>`
      : `
  <p>
    Du erhältst in Kürze eine separate E-Mail mit deinem Magic-Link,
    über den du dich in der Startup Contacts App anmelden kannst.
  </p>`;

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
  ${ticketSection}
  <p>Wir freuen uns auf dich!</p>
  <br />
  <p style="color: #666; font-size: 14px;">
    Dein Startup Contacts Team<br />
    Venture Club Münster
  </p>
</body>
</html>`.trim();
}
