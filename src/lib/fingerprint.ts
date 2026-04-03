let cachedFingerprint: string | null = null;

/**
 * Returns a stable browser fingerprint string using ClientJS.
 * The fingerprint is deterministic for the same browser+device combination,
 * even across different origins (Safari browser vs. installed PWA).
 *
 * Must only be called client-side (browser environment).
 */
export async function getFingerprint(): Promise<string> {
  if (cachedFingerprint) return cachedFingerprint;
  const { ClientJS } = await import('clientjs');
  const client = new ClientJS();
  cachedFingerprint = String(client.getFingerprint());
  return cachedFingerprint;
}
