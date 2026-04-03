/**
 * AES-256-GCM encryption/decryption for ticket claim tokens in URLs.
 * Ensures ticket IDs are never exposed in plain text.
 */

const ALGORITHM = 'AES-GCM';
const IV_LENGTH = 12; // 96-bit IV for AES-GCM

function getEncryptionKey(): string {
  const key = process.env.TICKET_ENCRYPTION_KEY;
  if (!key || key.length < 32) {
    throw new Error('TICKET_ENCRYPTION_KEY must be at least 32 characters');
  }
  return key;
}

async function deriveKey(secret: string): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret).slice(0, 32),
    { name: ALGORITHM },
    false,
    ['encrypt', 'decrypt'],
  );
  return keyMaterial;
}

/**
 * Encrypt a claim token for use in URLs.
 * Returns a URL-safe base64 string: base64url(iv + ciphertext + tag)
 */
export async function encryptToken(plainToken: string): Promise<string> {
  const key = await deriveKey(getEncryptionKey());
  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));
  const encoded = new TextEncoder().encode(plainToken);

  const ciphertext = await crypto.subtle.encrypt(
    { name: ALGORITHM, iv },
    key,
    encoded,
  );

  // Combine IV + ciphertext (includes GCM tag)
  const combined = new Uint8Array(iv.length + ciphertext.byteLength);
  combined.set(iv);
  combined.set(new Uint8Array(ciphertext), iv.length);

  // URL-safe base64
  return Buffer.from(combined).toString('base64url');
}

/**
 * Decrypt an encrypted token from a URL parameter.
 * Returns the original claim token.
 */
export async function decryptToken(encryptedBase64url: string): Promise<string> {
  const key = await deriveKey(getEncryptionKey());
  const combined = Buffer.from(encryptedBase64url, 'base64url');

  if (combined.length < IV_LENGTH + 1) {
    throw new Error('Invalid encrypted token');
  }

  const iv = combined.subarray(0, IV_LENGTH);
  const ciphertext = combined.subarray(IV_LENGTH);

  const decrypted = await crypto.subtle.decrypt(
    { name: ALGORITHM, iv },
    key,
    ciphertext,
  );

  return new TextDecoder().decode(decrypted);
}
