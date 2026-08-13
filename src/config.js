const SUPABASE_URL = 'https://dccqzrilkqkkryfyjqmd.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRjY3F6cmlsa3Fra3J5ZnlqcW1kIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ4NTc5NDcsImV4cCI6MjEwMDQzMzk0N30.TxBleQCAAaxENJYFgaRGTQKyRDelgYQmIRP-uUVwW5U';

const FALLBACK = import.meta.env.VITE_API_URL || 'http://localhost:4000';
const CACHE_KEY = 'api_base_url';

let cached = null;

/**
 * Ambil base URL API dari database (Supabase app_config), cache di localStorage.
 * Fallback ke VITE_API_URL / localhost.
 */
export async function getApiBaseUrl() {
  if (cached) return cached;

  const ls = localStorage.getItem(CACHE_KEY);
  if (ls) {
    cached = ls;
    return cached;
  }

  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/app_config?key=eq.api_base_url&select=value`, {
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      },
    });
    if (res.ok) {
      const rows = await res.json();
      const value = rows?.[0]?.value;
      if (value) {
        const base = value.endsWith('/') ? value.slice(0, -1) : value;
        localStorage.setItem(CACHE_KEY, base);
        cached = base;
        return cached;
      }
    }
  } catch {
    // ignore
  }

  cached = FALLBACK;
  return cached;
}
