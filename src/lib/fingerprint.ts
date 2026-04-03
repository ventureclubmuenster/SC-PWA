let cachedFingerprint: string | null = null;

/**
 * Returns a stable browser fingerprint using only device signals that
 * remain identical between Safari browser tab and installed Safari PWA.
 *
 * Excludes: user agent (changes in standalone mode), plugins, fonts,
 * available resolution (status bar differences).
 *
 * Uses: screen size, color depth, timezone, language, canvas, OS.
 */
export async function getFingerprint(): Promise<string> {
  if (cachedFingerprint) return cachedFingerprint;
  const { ClientJS } = await import('clientjs');
  const client = new ClientJS();

  // Only use signals that are identical across Safari browser ↔ Safari PWA
  const fp = client.getCustomFingerprint(
    client.getCurrentResolution(),
    client.getColorDepth(),
    client.getTimeZone(),
    client.getLanguage(),
    client.getCanvasPrint(),
    client.getOS(),
    client.getOSVersion(),
    client.getDevice(),
    client.getDeviceVendor(),
    client.getCPU(),
  );

  cachedFingerprint = String(fp);
  console.log('[fingerprint] generated:', cachedFingerprint);
  return cachedFingerprint;
}
