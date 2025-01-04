'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useUser } from '@/contexts/UserContext'
import { toast } from '@/components/ui/use-toast'

export default function ForceLogout() {
    const router = useRouter()
    const { setUser } = useUser()

    useEffect(() => {
        const logout = async () => {
            try {
                if (!supabase) {
                    throw new Error('Supabase client not available')
                }

                // First clear the user from context
                setUser(null)

                // Then sign out from Supabase
                const { error } = await supabase.auth.signOut()
                if (error) throw error

                toast({
                    title: "Logged Out",
                    description: "You have been successfully logged out.",
                })

                // Force a hard redirect to the login page
                window.location.href = '/login'
            } catch (error) {
                console.error('Error during force logout:', error)
                toast({
                    title: "Logout Failed",
                    description: "An error occurred during logout. Please try again.",
                    variant: "destructive",
                })
                // Even if there's an error, try to redirect to login
                window.location.href = '/login'
            }
        }

        logout()
    }, [setUser])

    return (
        <div className="flex items-center justify-center min-h-screen">
            <div className="text-center">
                <h1 className="text-2xl font-semibold mb-2">Logging out...</h1>
                <p className="text-gray-600">Please wait while we log you out.</p>
            </div>
        </div>
    )
}
