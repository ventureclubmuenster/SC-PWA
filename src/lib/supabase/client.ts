import { createBrowserClient } from '@supabase/ssr';

let cached: ReturnType<typeof _create>;

function _create() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

export function createClient() {
  if (!cached) cached = _create();
  return cached;
}
