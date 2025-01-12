import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";

// Get the correct Supabase URL and key based on environment
const isProduction = process.env.IS_PRODUCTION === 'true';
const supabaseUrl = isProduction
  ? process.env.NEXT_PUBLIC_PROD_SUPABASE_URL!
  : process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = isProduction
  ? process.env.NEXT_PUBLIC_PROD_SUPABASE_ANON_KEY!
  : process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export function createServerSupabaseClient() {
  const cookieStore = cookies();

  return createServerClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value, ...options });
          } catch (error) {
            // Handle cookie errors
            console.error('Error setting cookie:', error);
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value: "", ...options });
          } catch (error) {
            // Handle cookie errors
            console.error('Error removing cookie:', error);
          }
        },
      },
    }
  );
}
