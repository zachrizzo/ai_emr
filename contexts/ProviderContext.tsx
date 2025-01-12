import { createContext, useContext, useEffect, useState } from 'react'
import { Provider } from '@/types'
import { supabase } from '@/utils/supabase-config'
import { useUser } from './UserContext'

interface ProviderContextType {
    providers: Provider[] | null
    loading: boolean
    error: Error | null
    refreshProviders: () => Promise<void>
}

const ProviderContext = createContext<ProviderContextType>({
    providers: null,
    loading: true,
    error: null,
    refreshProviders: async () => { },
})

export function ProviderProvider({ children }: { children: React.ReactNode }) {
    const [providers, setProviders] = useState<Provider[] | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<Error | null>(null)
    const { userData } = useUser()

    const fetchProviders = async () => {
        if (!userData?.organization_id) {
            setProviders(null)
            setLoading(false)
            return
        }

        try {
            const { data, error } = await supabase
                .from('providers')
                .select('*')
                .eq('organization_id', userData.organization_id)
                .is('deleted_at', null)
                .order('last_name', { ascending: true })

            if (error) throw error

            setProviders(data)
            setError(null)
        } catch (error) {
            console.error('Error fetching providers:', error)
            setError(error as Error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchProviders()
    }, [userData?.organization_id])

    const value = {
        providers,
        loading,
        error,
        refreshProviders: fetchProviders,
    }

    return <ProviderContext.Provider value={value}>{children}</ProviderContext.Provider>
}

export const useProviders = () => {
    const context = useContext(ProviderContext)
    if (!context) {
        throw new Error('useProviders must be used within a ProviderProvider')
    }
    return context
}
