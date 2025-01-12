import { createBrowserClient } from '@supabase/ssr'

// Get the correct Supabase URL and key based on environment
const isProduction = process.env.NEXT_PUBLIC_IS_PRODUCTION === 'true'

const EDGE_FUNCTION_URL = '/functions/v1/'

export const getSupabaseConfig = () => {
  const supabaseUrl = isProduction
    ? process.env.NEXT_PUBLIC_PROD_SUPABASE_URL!
    : process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseAnonKey = isProduction
    ? process.env.NEXT_PUBLIC_PROD_SUPABASE_ANON_KEY!
    : process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

  // For edge functions, we need the full URL including the /functions/v1/ path
  const functionURL = isProduction
    ? process.env.NEXT_PUBLIC_PROD_SUPABASE_URL! + EDGE_FUNCTION_URL
    : process.env.NEXT_PUBLIC_SUPABASE_URL! + EDGE_FUNCTION_URL

  return { supabaseUrl, supabaseAnonKey, functionURL, isProduction }
}

// Create the Supabase client for browser usage
export const supabase = createBrowserClient(
  getSupabaseConfig().supabaseUrl,
  getSupabaseConfig().supabaseAnonKey
)
