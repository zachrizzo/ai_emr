'use client'

import { createContext, useContext, useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/auth/auth-provider'

type UserType = {
  id: string
  email: string
  role: string
  organization_id: string
  created_at: string
  updated_at: string
} | null

type UserContextType = {
  user: UserType
  setUser: (user: UserType) => void
  loading: boolean
  signOut: () => Promise<void>
}

const UserContext = createContext<UserContextType>({
  user: null,
  setUser: () => { },
  loading: true,
  signOut: async () => { }
})

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserType>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const { session, loading: authLoading } = useAuth()

  const signOut = async () => {
    const client = createClient()
    if (!client) return
    await client.auth.signOut()
    setUser(null)
    router.push('/login')
  }

  useEffect(() => {
    let mounted = true

    const fetchUserData = async () => {
      if (!session?.user) {
        if (mounted) {
          setUser(null)
          setLoading(false)
        }
        return
      }

      try {
        const client = createClient()
        if (!client) {
          if (mounted) {
            setUser(null)
            setLoading(false)
          }
          return
        }

        const { data: userData, error } = await client
          .from('users')
          .select('id, email, role, organization_id, created_at, updated_at')
          .eq('id', session.user.id)
          .single()

        if (error) {
          console.error('Error fetching user data:', error)
          if (mounted) {
            setUser(null)
            setLoading(false)
          }
          return
        }

        if (mounted) {
          setUser(userData)
          setLoading(false)
        }
      } catch (error) {
        console.error('Error fetching user data:', error)
        if (mounted) {
          setUser(null)
          setLoading(false)
        }
      }
    }

    if (!authLoading) {
      fetchUserData()
    }

    return () => {
      mounted = false
    }
  }, [session, authLoading])

  return (
    <UserContext.Provider value={{ user, setUser, loading: loading || authLoading, signOut }}>
      {children}
    </UserContext.Provider>
  )
}

export const useUser = () => {
  return useContext(UserContext)
}

