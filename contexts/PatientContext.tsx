'use client'

import { createContext, useContext } from 'react'
import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase'
import { Patient } from '@/types'
import { useUser } from './UserContext'

type PatientContextType = {
    patients: Patient[] | undefined
    loading: boolean
    error: Error | null
    refetchPatients: () => Promise<void>
}

const PatientContext = createContext<PatientContextType>({
    patients: undefined,
    loading: true,
    error: null,
    refetchPatients: async () => { }
})

export function PatientProvider({ children }: { children: React.ReactNode }) {
    const { user } = useUser()
    const supabase = createClient()


    const {
        data: patients,
        isLoading,
        error,
        refetch
    } = useQuery({
        queryKey: ['patients', user?.organization_id],
        queryFn: async () => {
            if (!user?.organization_id) {
                console.error('No organization ID available')
                throw new Error('No organization found for user')
            }

            console.log('Fetching patients for organization:', user.organization_id)

            const { data, error } = await supabase
                .from('patients')
                .select(`
                    id,
                    first_name,
                    last_name,
                    date_of_birth,
                    gender,
                    address,
                    phone_number,
                    email,
                    preferred_language,
                    preferred_communication,
                    cultural_considerations,
                    created_at,
                    organization_id
                `)
                .eq('organization_id', user.organization_id)
                .is('deleted_at', null)
                .order('first_name')

            if (error) {
                console.error('Error fetching patients:', error)
                throw error
            }

            console.log('Fetched patients:', {
                count: data?.length || 0,
                sample: data?.[0] ? {
                    id: data[0].id,
                    name: `${data[0].first_name} ${data[0].last_name}`,
                    org: data[0].organization_id
                } : null
            })

            return data as Patient[]
        },
        enabled: !!user?.organization_id,
        staleTime: 1000 * 60 * 5, // 5 minutes
        gcTime: 1000 * 60 * 30, // 30 minutes
    })

    const refetchPatients = async () => {
        console.log('Refetching patients...')
        await refetch()
    }



    return (
        <PatientContext.Provider
            value={{
                patients,
                loading: isLoading,
                error: error as Error | null,
                refetchPatients
            }}
        >
            {children}
        </PatientContext.Provider>
    )
}

export const usePatients = () => {
    const context = useContext(PatientContext)
    if (context === undefined) {
        throw new Error('usePatients must be used within a PatientProvider')
    }
    return context
}
