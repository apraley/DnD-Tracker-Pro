/**
 * GET /api/config
 *
 * Returns the public (anon-safe) client configuration so that the static
 * index.html can bootstrap the Supabase client without needing a build step
 * to inject environment variables.
 *
 * Only SUPABASE_URL and SUPABASE_ANON_KEY are returned — these are
 * intentionally public and safe to expose in browser code.
 */

export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 'public, max-age=3600'); // cache 1h — config rarely changes

  if (req.method === 'OPTIONS') return res.status(200).end();

  const supabaseUrl     = process.env.SUPABASE_URL     || process.env.NEXT_PUBLIC_SUPABASE_URL     || '';
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

  if (!supabaseUrl || !supabaseAnonKey) {
    // Dev fallback — app will still load but Pro features disabled
    return res.status(200).json({ supabaseUrl: '', supabaseAnonKey: '', configured: false });
  }

  return res.status(200).json({ supabaseUrl, supabaseAnonKey, configured: true });
}
