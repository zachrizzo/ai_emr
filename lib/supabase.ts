import { createBrowserClient, createServerClient } from '@supabase/ssr'

console.log('Raw IS_PRODUCTION value:', process.env.IS_PRODUCTION)
const isProduction = process.env.IS_PRODUCTION === 'true'

const supabaseUrl = isProduction
  ? process.env.NEXT_PUBLIC_PROD_SUPABASE_URL!
  : process.env.NEXT_PUBLIC_SUPABASE_URL!

const supabaseAnonKey = isProduction
  ? process.env.NEXT_PUBLIC_PROD_SUPABASE_ANON_KEY!
  : process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

console.log('Environment Status:', {
  rawIsProduction: process.env.IS_PRODUCTION,
  isProduction,
  supabaseUrl,
  usingProdCredentials: isProduction ? 'Yes' : 'No',
  prodUrl: process.env.NEXT_PUBLIC_PROD_SUPABASE_URL,
  localUrl: process.env.NEXT_PUBLIC_SUPABASE_URL
})

export const createClient = () => {
  return createBrowserClient(supabaseUrl, supabaseAnonKey)
}

// Create a singleton instance for client-side use
export const supabase = createClient()

export const createServerSupabaseClient = (cookieStore: any) => {
  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value
      },
      set(name: string, value: string, options: any) {
        cookieStore.set(name, value, options)
      },
      remove(name: string, options: any) {
        cookieStore.delete(name, options)
      },
    },
  })
}
