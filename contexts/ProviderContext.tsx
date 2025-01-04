import { createContext, useContext, ReactNode } from 'react'
import { Provider } from '@/types'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/components/auth/auth-provider'

interface ProviderContextType {
    providers: Provider[]
    isLoading: boolean
    error: Error | null
    refetchProviders: () => Promise<void>
}

const ProviderContext = createContext<ProviderContextType | undefined>(undefined)

export function ProviderProvider({ children }: { children: ReactNode }) {
    const { session } = useAuth()
    const queryClient = useQueryClient()

    const {
        data: providers = [],
        isLoading,
        error,
        refetch
    } = useQuery({
        queryKey: ['providers'],
        queryFn: async () => {
            const { data: userData } = await supabase
                .from('users')
                .select('organization_id')
                .eq('id', session?.user?.id)
                .single()

            if (!userData?.organization_id) {
                throw new Error('No organization found')
            }

            const { data, error } = await supabase
                .from('providers')
                .select('*')
                .eq('organization_id', userData.organization_id)
                .is('deleted_at', null)

            if (error) throw error
            return data as Provider[]
        },
        enabled: !!session?.user?.id
    })

    const refetchProviders = async () => {
        await refetch()
    }

    return (
        <ProviderContext.Provider
            value={{
                providers,
                isLoading,
                error: error as Error | null,
                refetchProviders
            }}
        >
            {children}
        </ProviderContext.Provider>
    )
}

export function useProviders() {
    const context = useContext(ProviderContext)
    if (context === undefined) {
        throw new Error('useProviders must be used within a ProviderProvider')
    }
    return context
}
