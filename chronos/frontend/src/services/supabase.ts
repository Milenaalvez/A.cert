import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://xwitkwbymmucultysyox.supabase.co'
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_23WdlWQhBqKPGvlkmKQd9A_0ZW4Ko3N'

;(function cleanupOldSession() {
  try {
    for (const key in localStorage) {
      if (key.startsWith('supabase.')) localStorage.removeItem(key)
    }
  } catch {}
})()

function fetchWithTimeout(url: RequestInfo | URL, opts?: RequestInit) {
  const controller = new AbortController()
  const id = setTimeout(() => controller.abort(), 5000)
  return fetch(url, { ...opts, signal: controller.signal }).finally(() => clearTimeout(id))
}

export const supabase: SupabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    flowType: 'pkce',
    detectSessionInUrl: false,
    persistSession: false,
    autoRefreshToken: false,
  },
  global: { fetch: fetchWithTimeout },
})
