'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { User } from '@supabase/supabase-js'
import { supabase } from '@/utils/supabase-config'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/auth/auth-provider'

interface UserContextType {
  user: User | null
  userData: any | null
  loading: boolean
  error: Error | null
  refreshUserData: () => Promise<void>
}

const UserContext = createContext<UserContextType>({
  user: null,
  userData: null,
  loading: true,
  error: null,
  refreshUserData: async () => { },
})

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [userData, setUserData] = useState<any | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const router = useRouter()
  const { user } = useAuth()

  const fetchUserData = async () => {
    if (!user) {
      setUserData(null)
      setLoading(false)
      return
    }

    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single()

      if (error) throw error

      setUserData(data)
      setError(null)
    } catch (error) {
      console.error('Error fetching user data:', error)
      setError(error as Error)
      if ((error as any)?.status === 401) {
        router.push('/force-logout')
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUserData()
  }, [user])

  const value = {
    user,
    userData,
    loading,
    error,
    refreshUserData: fetchUserData,
  }

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>
}

export const useUser = () => {
  const context = useContext(UserContext)
  if (!context) {
    throw new Error('useUser must be used within a UserProvider')
  }
  return context
}

