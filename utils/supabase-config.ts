import { createClient } from '@supabase/supabase-js';

const isProduction = process.env.IS_PRODUCTION === 'true';

// Get the appropriate URLs and keys based on environment
const supabaseUrl = isProduction
  ? process.env.PROD_SUPABASE_URL
  : process.env.NEXT_PUBLIC_SUPABASE_URL;

const supabaseAnonKey = isProduction
  ? process.env.PROD_SUPABASE_ANON_KEY
  : process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabaseServiceRoleKey = isProduction
  ? process.env.PROD_SUPABASE_SERVICE_ROLE_KEY
  : process.env.SUPABASE_SERVICE_ROLE_KEY;

// Create Supabase client with anonymous key
export const supabase = createClient(
  supabaseUrl!,
  supabaseAnonKey!
);

// Create Supabase admin client with service role key
export const supabaseAdmin = createClient(
  supabaseUrl!,
  supabaseServiceRoleKey!
);

// Export environment status
export const isProd = isProduction;
