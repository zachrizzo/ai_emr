'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { Patient } from '@/types'
import { supabase } from '@/utils/supabase-config'
import { useUser } from './UserContext'

interface PatientContextType {
    patients: Patient[] | null
    loading: boolean
    error: Error | null
    refreshPatients: () => Promise<void>
}

const PatientContext = createContext<PatientContextType>({
    patients: null,
    loading: true,
    error: null,
    refreshPatients: async () => { },
})

export function PatientProvider({ children }: { children: React.ReactNode }) {
    const [patients, setPatients] = useState<Patient[] | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<Error | null>(null)
    const { userData } = useUser()

    const fetchPatients = async () => {
        if (!userData?.organization_id) {
            setPatients(null)
            setLoading(false)
            return
        }

        try {
            const { data, error } = await supabase
                .from('patients')
                .select('*')
                .eq('organization_id', userData.organization_id)
                .is('deleted_at', null)
                .order('last_name', { ascending: true })

            if (error) throw error

            setPatients(data)
            setError(null)
        } catch (error) {
            console.error('Error fetching patients:', error)
            setError(error as Error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchPatients()
    }, [userData?.organization_id])

    const value = {
        patients,
        loading,
        error,
        refreshPatients: fetchPatients,
    }

    return <PatientContext.Provider value={value}>{children}</PatientContext.Provider>
}

export const usePatients = () => {
    const context = useContext(PatientContext)
    if (!context) {
        throw new Error('usePatients must be used within a PatientProvider')
    }
    return context
}
