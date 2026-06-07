import { createAdminClient } from '@/lib/supabase/admin';

/**
 * Sliding-window rate limiter backed by Supabase (works across serverless instances).
 * Returns true if the request is allowed, false if the limit is exceeded.
 *
 * Side-effects: inserts a new row on allow; prunes expired rows for that key on every call.
 */
export async function checkRateLimit(
  userId: string,
  action: string,
  limit: number,
  windowSeconds = 60,
): Promise<boolean> {
  const adminClient = createAdminClient();
  const windowStart = new Date(Date.now() - windowSeconds * 1000).toISOString();

  // Prune stale rows for this user+action so the table stays small
  await adminClient
    .from('api_rate_limits')
    .delete()
    .eq('user_id', userId)
    .eq('action', action)
    .lt('requested_at', windowStart);

  // Count requests inside the window
  const { count } = await adminClient
    .from('api_rate_limits')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('action', action)
    .gte('requested_at', windowStart);

  if ((count ?? 0) >= limit) return false;

  // Record this request
  await adminClient
    .from('api_rate_limits')
    .insert({ user_id: userId, action });

  return true;
}
