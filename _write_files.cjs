// Temporary script to write email.ts and page.tsx with proper template literals
const fs = require('fs');
const path = require('path');

const base = '/Users/yannickbrusa/Documents/SC-PWA';

// ─── email.ts ────────────────────────────────────────────────────────
const emailTs = `import { Resend } from 'resend';

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

/* ------------------------------------------------------------------ */
/*  Order Confirmation Email (V2 \u2014 two buttons per ticket)             */
/* ------------------------------------------------------------------ */

interface TicketEmailLink {
  ticketId: string;
  encryptedToken: string;
  label: string;
}

export function buildOrderConfirmationHtml(
  email: string,
  ticketCount: number,
  ticketLinks: TicketEmailLink[] = [],
) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://app.startup-contacts.de';

  const ticketButtons = ticketLinks
    .map(
      (link, i) => \`
    <tr>
      <td style="padding: 8px 0;">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
          <tr>
            <td style="background: #f8f8f8; border-radius: 12px; padding: 16px;">
              <p style="margin: 0 0 12px 0; font-size: 14px; color: #333;">
                <strong>Ticket \\\${i + 1}</strong>\\\${link.label ? \\\` \u2014 \\\${link.label}\\\` : ''}
              </p>
              <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="background: #1D1D1F; border-radius: 8px;">
                    <a href="\\\${appUrl}/personalize?t=\\\${link.encryptedToken}"
                       style="display: inline-block; padding: 12px 24px; color: #ffffff; font-size: 14px; font-weight: 600; text-decoration: none;">
                      Ticket personalisieren \u2192
                    </a>
                  </td>
                  <td style="width: 12px;"></td>
                  <td style="background: #ffffff; border: 2px solid #1D1D1F; border-radius: 8px;">
                    <a href="\\\${appUrl}/transfer?t=\\\${link.encryptedToken}"
                       style="display: inline-block; padding: 10px 24px; color: #1D1D1F; font-size: 14px; font-weight: 600; text-decoration: none;">
                      Ticket weiterleiten
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </td>
    </tr>\`,
    )
    .join('\\n');

  const ticketSection =
    ticketLinks.length > 0
      ? \`
  <p style="margin-top: 24px; font-weight: 600; font-size: 16px;">Deine Tickets:</p>
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
    \\\${ticketButtons}
  </table>
  <p style="font-size: 13px; color: #888; margin-top: 16px;">
    Jeder Link kann nur einmal verwendet werden. Du wirst gebeten, deine Daten einzugeben
    und einen Best\u00e4tigungscode per E-Mail zu verifizieren.
  </p>\`
      : \`
  <p>
    Du erh\u00e4ltst in K\u00fcrze eine separate E-Mail mit weiteren Informationen
    zu deinen Tickets.
  </p>\`;

  return \`
<!DOCTYPE html>
<html lang="de">
<head><meta charset="UTF-8" /></head>
<body style="font-family: Arial, sans-serif; color: #1a1a1a; max-width: 600px; margin: 0 auto; padding: 24px;">
  <h1 style="font-size: 24px; margin-bottom: 16px;">Vielen Dank f\u00fcr deine Bestellung! \ud83c\udf89</h1>
  <p>Hallo,</p>
  <p>
    wir haben deine Bestellung \u00fcber
    <strong>\\\${ticketCount} Ticket\\\${ticketCount !== 1 ? 's' : ''}</strong>
    erfolgreich erhalten.
  </p>
  \\\${ticketSection}
  <p>Wir freuen uns auf dich!</p>
  <br />
  <p style="color: #666; font-size: 14px;">
    Dein Startup Contacts Team<br />
    Venture Club M\u00fcnster
  </p>
</body>
</html>\`.trim();
}

/* ------------------------------------------------------------------ */
/*  Transfer Receipt Email (single ticket for recipient)               */
/* ------------------------------------------------------------------ */

export function buildTransferReceiptHtml(
  recipientEmail: string,
  ticketLabel: string,
  encryptedToken: string,
) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://app.startup-contacts.de';

  return \`
<!DOCTYPE html>
<html lang="de">
<head><meta charset="UTF-8" /></head>
<body style="font-family: Arial, sans-serif; color: #1a1a1a; max-width: 600px; margin: 0 auto; padding: 24px;">
  <h1 style="font-size: 24px; margin-bottom: 16px;">Du hast ein Ticket erhalten! \ud83c\udfab</h1>
  <p>Hallo,</p>
  <p>
    Jemand hat dir ein Ticket f\u00fcr die <strong>Startup Contacts 2026</strong> weitergeleitet.
  </p>
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
    <tr>
      <td style="padding: 8px 0;">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
          <tr>
            <td style="background: #f8f8f8; border-radius: 12px; padding: 16px;">
              <p style="margin: 0 0 12px 0; font-size: 14px; color: #333;">
                <strong>\\\${ticketLabel}</strong>
              </p>
              <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="background: #1D1D1F; border-radius: 8px;">
                    <a href="\\\${appUrl}/personalize?t=\\\${encryptedToken}"
                       style="display: inline-block; padding: 12px 24px; color: #ffffff; font-size: 14px; font-weight: 600; text-decoration: none;">
                      Ticket personalisieren \u2192
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
  <p style="font-size: 13px; color: #888; margin-top: 16px;">
    Klicke auf den Button, um dein Ticket zu personalisieren und zu aktivieren.
    Du wirst gebeten, deine Daten einzugeben und einen Best\u00e4tigungscode zu verifizieren.
  </p>
  <p>Wir freuen uns auf dich!</p>
  <br />
  <p style="color: #666; font-size: 14px;">
    Dein Startup Contacts Team<br />
    Venture Club M\u00fcnster
  </p>
</body>
</html>\`.trim();
}
`;

fs.writeFileSync(path.join(base, 'src/lib/email.ts'), emailTs);
console.log('Written email.ts:', emailTs.length, 'chars');
