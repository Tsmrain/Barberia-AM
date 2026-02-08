import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { Database } from './types';

// Next.js environment variables (prefix: NEXT_PUBLIC_ for client-side access)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('⚠️ Supabase credentials not configured. Using mock mode.');
}

// Singleton client instance
let clientInstance: SupabaseClient<Database> | null = null;

export function getSupabaseClient(): SupabaseClient<Database> | null {
  if (!supabaseUrl || !supabaseAnonKey) {
    return null;
  }

  if (!clientInstance) {
    clientInstance = createClient<Database>(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: false, // No auth needed for booking
      },
    });
  }

  return clientInstance;
}

export const supabase = getSupabaseClient();
