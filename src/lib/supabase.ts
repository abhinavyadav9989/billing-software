import { createClient } from '@supabase/supabase-js';

// Support both Vite-style and Next-style env names to be resilient across hosts
const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL || (import.meta as any).env?.NEXT_PUBLIC_SUPABASE_URL) as string;
const supabaseAnonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY || (import.meta as any).env?.NEXT_PUBLIC_SUPABASE_ANON_KEY) as string;

if (!supabaseUrl || !supabaseAnonKey) {
  // Fail early during development if envs are missing
  // eslint-disable-next-line no-console
  console.warn('Supabase env missing: VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default supabase;


