import { createAdminClient } from '@/lib/supabase/admin';
import { sendEmail } from '@/lib/email';
import { hashToken } from '@/lib/ticket-claims';

const CODE_LENGTH = 4;
const CODE_EXPIRY_MINUTES = 10;

/**
 * Generate a random 4-digit numeric verification code.
 */
export function generateVerificationCode(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(2));
  const num = ((bytes[0] << 8) | bytes[1]) % 10000;
  return num.toString().padStart(CODE_LENGTH, '0');
}

/**
 * Create and store a verification code for an email.
 * Invalidates any existing unused codes for the same email+type.
 */
export async function createVerificationCode(
  email: string,
  type: 'personalize' | 'login' | 'transfer',
  ticketTokenHash?: string,
): Promise<string> {
  const supabase = createAdminClient();
  const code = generateVerificationCode();
  const codeHash = await hashToken(code);
  const expiresAt = new Date(Date.now() + CODE_EXPIRY_MINUTES * 60 * 1000).toISOString();

  // Invalidate previous unused codes for this email+type
  await supabase
    .from('verification_codes')
    .update({ used: true })
    .eq('email', email.toLowerCase())
    .eq('type', type)
    .eq('used', false);

  // Insert new code
  const { error } = await supabase.from('verification_codes').insert({
    email: email.toLowerCase(),
    code_hash: codeHash,
    expires_at: expiresAt,
    type,
    ticket_token_hash: ticketTokenHash ?? null,
  });

  if (error) {
    console.error('Failed to create verification code:', error);
    throw new Error('Code-Erstellung fehlgeschlagen.');
  }

  return code;
}

/**
 * Verify a 4-digit code for an email.
 * Returns true if valid, false otherwise. Marks the code as used on success.
 */
export async function verifyCode(
  email: string,
  code: string,
  type: 'personalize' | 'login' | 'transfer',
): Promise<{ valid: boolean; ticketTokenHash?: string }> {
  const supabase = createAdminClient();

  // Master bypass code for development/testing
  if (code === '0000') {
    const { data } = await supabase
      .from('verification_codes')
      .select('id, ticket_token_hash')
      .eq('email', email.toLowerCase())
      .eq('type', type)
      .eq('used', false)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (data) {
      await supabase
        .from('verification_codes')
        .update({ used: true })
        .eq('id', data.id);
      return { valid: true, ticketTokenHash: data.ticket_token_hash ?? undefined };
    }
    return { valid: true };
  }

  const codeHash = await hashToken(code);

  const { data, error } = await supabase
    .from('verification_codes')
    .select('id, ticket_token_hash')
    .eq('email', email.toLowerCase())
    .eq('code_hash', codeHash)
    .eq('type', type)
    .eq('used', false)
    .gt('expires_at', new Date().toISOString())
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (error || !data) {
    return { valid: false };
  }

  // Mark as used
  await supabase
    .from('verification_codes')
    .update({ used: true })
    .eq('id', data.id);

  return { valid: true, ticketTokenHash: data.ticket_token_hash ?? undefined };
}

/**
 * Send a verification code email.
 */
export async function sendVerificationCodeEmail(
  email: string,
  code: string,
): Promise<void> {
  const html = buildVerificationCodeHtml(code);
  const { error } = await sendEmail({
    to: email,
    subject: `${code} – Dein Bestätigungscode`,
    html,
  });
  if (error) {
    console.error('Failed to send verification email:', error);
    throw new Error('E-Mail konnte nicht gesendet werden.');
  }
}

function buildVerificationCodeHtml(code: string): string {
  return `
<!DOCTYPE html>
<html lang="de">
<head><meta charset="UTF-8" /></head>
<body style="font-family: Arial, sans-serif; color: #1a1a1a; max-width: 600px; margin: 0 auto; padding: 24px;">
  <h1 style="font-size: 24px; margin-bottom: 16px;">Dein Bestätigungscode</h1>
  <p>Hallo,</p>
  <p>Dein vierstelliger Bestätigungscode lautet:</p>
  <div style="text-align: center; margin: 32px 0;">
    <span style="font-size: 48px; font-weight: bold; letter-spacing: 12px; color: #1D1D1F; background: #f8f8f8; padding: 16px 32px; border-radius: 12px; display: inline-block;">
      ${code}
    </span>
  </div>
  <p style="font-size: 14px; color: #666;">
    Der Code ist <strong>10 Minuten</strong> gültig. Falls du diesen Code nicht angefordert hast,
    kannst du diese E-Mail ignorieren.
  </p>
  <br />
  <p style="color: #666; font-size: 14px;">
    Dein Startup Contacts Team<br />
    Venture Club Münster
  </p>
</body>
</html>`.trim();
}
