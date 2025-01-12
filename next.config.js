/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    env: {
        IS_PRODUCTION: process.env.IS_PRODUCTION,
        NEXT_PUBLIC_PROD_SUPABASE_URL: process.env.PROD_SUPABASE_URL,
        NEXT_PUBLIC_PROD_SUPABASE_ANON_KEY: process.env.PROD_SUPABASE_ANON_KEY,
    },
}

module.exports = nextConfig
