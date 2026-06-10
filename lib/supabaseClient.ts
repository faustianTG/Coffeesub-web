import { createBrowserClient } from '@supabase/ssr'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Check .env.local')
}

// createBrowserClient writes the session into cookies (not localStorage)
// so the server-side middleware can read and validate it on every request
export const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey)
