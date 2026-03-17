import { createClient, type SanityClient } from '@sanity/client';
import { createImageUrlBuilder } from '@sanity/image-url';

let _client: SanityClient | null = null;

function getClient(): SanityClient {
  if (_client) return _client;
  const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
  if (!projectId) {
    throw new Error(
      'Missing NEXT_PUBLIC_SANITY_PROJECT_ID environment variable'
    );
  }
  _client = createClient({
    projectId,
    dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
    apiVersion: process.env.NEXT_PUBLIC_SANITY_API_VERSION || '2024-01-01',
    useCdn: true,
  });
  return _client;
}

export const sanityClient = new Proxy({} as SanityClient, {
  get(_target, prop) {
    return (getClient() as unknown as Record<string | symbol, unknown>)[prop];
  },
});

export function urlFor(source: unknown) {
  const builder = createImageUrlBuilder(getClient());
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return builder.image(source as any);
}
