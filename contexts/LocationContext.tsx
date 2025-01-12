import { createContext, useContext, useEffect, useState } from 'react'
import { Location } from '@/types'
import { supabase } from '@/utils/supabase-config'
import { useUser } from './UserContext'

interface LocationContextType {
    locations: Location[] | null
    loading: boolean
    error: Error | null
    refreshLocations: () => Promise<void>
}

const LocationContext = createContext<LocationContextType>({
    locations: null,
    loading: true,
    error: null,
    refreshLocations: async () => { },
})

export function LocationProvider({ children }: { children: React.ReactNode }) {
    const [locations, setLocations] = useState<Location[] | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<Error | null>(null)
    const { userData } = useUser()

    const fetchLocations = async () => {
        if (!userData?.organization_id) {
            setLocations(null)
            setLoading(false)
            return
        }

        try {
            const { data, error } = await supabase
                .from('locations')
                .select('*')
                .eq('organization_id', userData.organization_id)
                .is('deleted_at', null)
                .order('name', { ascending: true })

            if (error) throw error

            setLocations(data)
            setError(null)
        } catch (error) {
            console.error('Error fetching locations:', error)
            setError(error as Error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchLocations()
    }, [userData?.organization_id])

    const value = {
        locations,
        loading,
        error,
        refreshLocations: fetchLocations,
    }

    return <LocationContext.Provider value={value}>{children}</LocationContext.Provider>
}

export const useLocations = () => {
    const context = useContext(LocationContext)
    if (!context) {
        throw new Error('useLocations must be used within a LocationProvider')
    }
    return context
}
