import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export async function auth() {
    const supabase = createServerComponentClient({ cookies })

    try {
        const {
            data: { session },
        } = await supabase.auth.getSession()

        return session
    } catch (error) {
        console.error('Auth error:', error)
        return null
    }
}
