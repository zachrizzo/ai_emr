'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'
import { Appointment } from '@/types/notes'
import { useUser } from '@/contexts/UserContext'
import { supabase } from '@/utils/supabase-config'
import { toast } from '@/components/ui/use-toast'

export interface AppointmentContextType {
    appointments: Appointment[]
    isLoading: boolean
    error: Error | null
    fetchAppointments: (patientId?: string) => Promise<void>
    addAppointment: (appointment: Omit<Appointment, 'id' | 'created_at' | 'updated_at' | 'organization_id'>) => Promise<void>
    updateAppointment: (id: string, appointment: Partial<Appointment>) => Promise<void>
    deleteAppointment: (id: string) => Promise<void>
}

const AppointmentContext = createContext<AppointmentContextType | undefined>(undefined)

export function AppointmentProvider({ children }: { children: React.ReactNode }) {
    const [appointments, setAppointments] = useState<Appointment[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<Error | null>(null)
    const { userData } = useUser()

    const fetchAppointments = async (patientId?: string) => {
        try {
            setIsLoading(true)
            setError(null)

            console.log(userData)

            if (!userData?.organization_id) {
                throw new Error('No organization found')
            }

            let query = supabase
                .from('appointments')
                .select(`
                    *,
                    patient:patients(id, first_name, last_name),
                    provider:providers(id, first_name, last_name),
                    location:locations(id, name)
                `)
                .eq('organization_id', userData.organization_id)
                .is('deleted_at', null)

            if (patientId) {
                query = query.eq('patient_id', patientId)
            }

            const { data, error } = await query

            if (error) throw error

            const transformedData = data?.map(appointment => {
                const { patient, provider, location, ...rest } = appointment
                return {
                    ...rest,
                    patient: patient ? {
                        id: patient.id,
                        first_name: patient.first_name,
                        last_name: patient.last_name
                    } : undefined,
                    provider: provider ? {
                        id: provider.id,
                        first_name: provider.first_name,
                        last_name: provider.last_name
                    } : undefined,
                    location: location ? {
                        id: location.id,
                        name: location.name
                    } : undefined
                }
            }) || []

            setAppointments(transformedData)
        } catch (err) {
            const error = err as Error
            setError(error)
            toast({
                title: "Error fetching appointments",
                description: error.message,
                variant: "destructive"
            })
        } finally {
            setIsLoading(false)
        }
    }

    const addAppointment = async (appointment: Omit<Appointment, 'id' | 'created_at' | 'updated_at' | 'organization_id'>) => {
        try {
            if (!userData?.organization_id) {
                throw new Error('No organization found')
            }

            const { data, error } = await supabase
                .from('appointments')
                .insert([{ ...appointment, organization_id: userData.organization_id }])
                .select()

            if (error) throw error

            await fetchAppointments()
            toast({
                title: "Success",
                description: "Appointment added successfully"
            })
        } catch (err) {
            const error = err as Error
            toast({
                title: "Error adding appointment",
                description: error.message,
                variant: "destructive"
            })
            throw error
        }
    }

    const updateAppointment = async (id: string, appointment: Partial<Appointment>) => {
        try {
            if (!userData?.organization_id) {
                throw new Error('No organization found')
            }

            const { error } = await supabase
                .from('appointments')
                .update(appointment)
                .eq('id', id)
                .eq('organization_id', userData.organization_id)

            if (error) throw error

            await fetchAppointments()
            toast({
                title: "Success",
                description: "Appointment updated successfully"
            })
        } catch (err) {
            const error = err as Error
            toast({
                title: "Error updating appointment",
                description: error.message,
                variant: "destructive"
            })
            throw error
        }
    }

    const deleteAppointment = async (id: string) => {
        try {
            if (!userData?.organization_id) {
                throw new Error('No organization found')
            }

            const { error } = await supabase
                .from('appointments')
                .update({ deleted_at: new Date().toISOString() })
                .eq('id', id)
                .eq('organization_id', userData.organization_id)

            if (error) throw error

            await fetchAppointments()
            toast({
                title: "Success",
                description: "Appointment deleted successfully"
            })
        } catch (err) {
            const error = err as Error
            toast({
                title: "Error deleting appointment",
                description: error.message,
                variant: "destructive"
            })
            throw error
        }
    }

    useEffect(() => {
        if (userData?.organization_id) {
            fetchAppointments()
        }
    }, [userData?.organization_id])

    const value = {
        appointments,
        isLoading,
        error,
        fetchAppointments,
        addAppointment,
        updateAppointment,
        deleteAppointment
    }

    return (
        <AppointmentContext.Provider value={value}>
            {children}
        </AppointmentContext.Provider>
    )
}

export function useAppointments() {
    const context = useContext(AppointmentContext)
    if (context === undefined) {
        throw new Error('useAppointments must be used within an AppointmentProvider')
    }
    return context
}
