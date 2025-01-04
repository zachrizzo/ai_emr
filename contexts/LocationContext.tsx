import { createContext, useContext, ReactNode } from 'react'
import { Location } from '@/types'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/components/auth/auth-provider'

interface LocationContextType {
    locations: Location[]
    isLoading: boolean
    error: Error | null
    refetchLocations: () => Promise<void>
}

const LocationContext = createContext<LocationContextType | undefined>(undefined)

export function LocationProvider({ children }: { children: ReactNode }) {
    const { session } = useAuth()
    const queryClient = useQueryClient()

    const {
        data: locations = [],
        isLoading,
        error,
        refetch
    } = useQuery({
        queryKey: ['locations'],
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
                .from('locations')
                .select('*')
                .eq('organization_id', userData.organization_id)
                .is('deleted_at', null)

            if (error) throw error
            return data as Location[]
        },
        enabled: !!session?.user?.id
    })

    const refetchLocations = async () => {
        await refetch()
    }

    return (
        <LocationContext.Provider
            value={{
                locations,
                isLoading,
                error: error as Error | null,
                refetchLocations
            }}
        >
            {children}
        </LocationContext.Provider>
    )
}

export function useLocations() {
    const context = useContext(LocationContext)
    if (context === undefined) {
        throw new Error('useLocations must be used within a LocationProvider')
    }
    return context
}
