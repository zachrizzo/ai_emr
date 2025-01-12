'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'
import { Appointment, AppointmentDetails } from '@/types'
import { Card, CardContent } from "@/components/ui/card"
import { EnhancedScheduleView } from '@/components/enhanced-schedule-view'
import { AddAppointmentDialog } from '@/components/add-appointment-dialog'
import { EditAppointmentDialog } from '@/components/edit-appointment-dialog'
import { toast } from '@/components/ui/use-toast'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PostgrestError } from '@supabase/supabase-js'
import { useLocations } from '@/contexts/LocationContext'
import { useProviders } from '@/contexts/ProviderContext'
import { usePatients } from '@/contexts/PatientContext'
import { useUser } from '@/contexts/UserContext'
import { useRouter } from 'next/navigation'

import { supabase } from '@/utils/supabase-config'

interface FetchError extends Error {
  code?: string;
  details?: string;
}

export default function SchedulePage() {
  const router = useRouter()
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [selectedProviders, setSelectedProviders] = useState<string[]>([])
  const [selectedLocations, setSelectedLocations] = useState<string[]>([])
  const [isAddAppointmentOpen, setIsAddAppointmentOpen] = useState(false)
  const [isEditAppointmentOpen, setIsEditAppointmentOpen] = useState(false)
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const { locations } = useLocations()
  const { providers } = useProviders()
  const { patients } = usePatients()
  const { userData } = useUser()

  const handleError = (error: unknown, context: string) => {
    console.error(`Error in ${context}:`, error)
    let errorMessage = "An unexpected error occurred"

    if (error instanceof Error) {
      errorMessage = error.message
    } else if ((error as PostgrestError)?.message) {
      errorMessage = (error as PostgrestError).message
    } else if (typeof error === 'string') {
      errorMessage = error
    }

    toast({
      title: "Error",
      description: errorMessage,
      variant: "destructive",
    })
    return errorMessage
  }

  const handlePatientClick = (patientId: string) => {
    router.push(`/patients/${patientId}`)
  }

  const fetchAppointments = async () => {
    try {
      if (!userData?.organization_id) throw new Error('No organization found for userData')

      let query = supabase
        .from('appointments')
        .select(`
          id,
          patient_id,
          provider_id,
          location_id,
          appointment_date,
          appointment_type,
          status,
          reason_for_visit,
          duration_minutes,
          notes,
          created_at,
          updated_at,
          organization_id,
          patients:patient_id (
            id,
            first_name,
            last_name
          ),
          providers:provider_id (
            id,
            first_name,
            last_name
          ),
          locations:location_id (
            id,
            name
          )
        `)
        .eq('organization_id', userData.organization_id)
        .is('deleted_at', null)

      // Add provider filter if selected
      if (selectedProviders?.length > 0) {
        query = query.in('provider_id', selectedProviders)
      }

      // Add location filter if selected
      if (selectedLocations?.length > 0) {
        query = query.in('location_id', selectedLocations)
      }

      const { data, error } = await query

      if (error) {
        console.error('Supabase query error:', error)
        throw error
      }

      // Transform the data to match the Appointment interface
      const transformedData = data?.map(appointment => {
        const { patients, providers, locations, ...rest } = appointment as any
        return {
          ...rest,
          patient: patients ? {
            id: patients.id,
            first_name: patients.first_name,
            last_name: patients.last_name
          } : undefined,
          provider: providers ? {
            id: providers.id,
            first_name: providers.first_name,
            last_name: providers.last_name
          } : undefined,
          location: locations ? {
            id: locations.id,
            name: locations.name
          } : undefined
        }
      }) || []

      return transformedData as Appointment[]
    } catch (error) {
      console.error('Full error:', error)
      throw new Error(handleError(error, 'fetchAppointments'))
    }
  }

  const fetchData = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const appointmentsData = await fetchAppointments()
      setAppointments(appointmentsData)
    } catch (error) {
      const errorMessage = handleError(error, 'fetchData')
      setError(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  // Refetch appointments when filters change
  useEffect(() => {
    if (userData?.organization_id) {
      fetchAppointments()
        .then(setAppointments)
        .catch(error => handleError(error, 'filterAppointments'))
    }
  }, [selectedProviders, selectedLocations, userData?.organization_id])

  // Set default selections when providers and locations are loaded
  useEffect(() => {
    if (providers?.length > 0) {
      setSelectedProviders(providers.map(p => p.id))
    }
  }, [providers])

  useEffect(() => {
    if (locations?.length > 0) {
      setSelectedLocations(locations.map(l => l.id))
    }
  }, [locations])

  useEffect(() => {
    if (userData?.organization_id) {
      fetchData()
    }
  }, [userData?.organization_id, providers, locations])

  const handleAddAppointment = async (newAppointment: Omit<Appointment, 'id' | 'created_at' | 'updated_at' | 'organization_id'>) => {
    try {
      if (!userData?.organization_id) throw new Error('No organization found for userData')

      const appointmentWithOrg = {
        ...newAppointment,
        organization_id: userData.organization_id
      }

      const { data, error } = await supabase
        .from('appointments')
        .insert([appointmentWithOrg])
        .select(`
          *,
          patient:patients(id, first_name, last_name),
          provider:providers(id, first_name, last_name),
          location:locations(id, name)
        `)

      if (error) throw error

      if (data && data[0]) {
        setAppointments(prev => [...prev, data[0]])
        setIsAddAppointmentOpen(false)
        toast({
          title: "Success",
          description: "Appointment added successfully",
        })
      }
    } catch (error) {
      handleError(error, 'handleAddAppointment')
    }
  }

  const handleEditAppointment = async (updatedAppointment: AppointmentDetails) => {
    try {
      if (!userData?.organization_id) throw new Error('No organization found for userData')

      const { error } = await supabase
        .from('appointments')
        .update({
          ...updatedAppointment,
          organization_id: userData.organization_id
        })
        .eq('id', updatedAppointment.id)
        .eq('organization_id', userData.organization_id)

      if (error) throw error

      // Fetch the updated appointment with relations
      const { data: refreshedAppointment, error: refreshError } = await supabase
        .from('appointments')
        .select(`
          *,
          patient:patients(id, first_name, last_name),
          provider:providers(id, first_name, last_name),
          location:locations(id, name)
        `)
        .eq('id', updatedAppointment.id)
        .single()

      if (refreshError) throw refreshError

      setAppointments(prev =>
        prev.map(appointment =>
          appointment.id === updatedAppointment.id ? refreshedAppointment : appointment
        )
      )
      setIsEditAppointmentOpen(false)
      setSelectedAppointment(null)
      toast({
        title: "Success",
        description: "Appointment updated successfully",
      })
    } catch (error) {
      handleError(error, 'handleEditAppointment')
    }
  }

  const handleDeleteAppointment = async (appointmentId: string) => {
    try {
      if (!userData?.organization_id) throw new Error('No organization found for userData')

      const { error } = await supabase
        .from('appointments')
        .delete()
        .eq('id', appointmentId)
        .eq('organization_id', userData.organization_id)

      if (error) throw error

      setAppointments(prev =>
        prev.filter(appointment => appointment.id !== appointmentId)
      )
      toast({
        title: "Success",
        description: "Appointment deleted successfully",
      })
    } catch (error) {
      handleError(error, 'handleDeleteAppointment')
    }
  }

  return (
    <div className="container mx-auto p-4 space-y-6">
      <h1 className="text-3xl font-bold">Schedule</h1>
      <Card>
        <CardContent className="p-6">
          <Tabs defaultValue="month" className="space-y-6">
            <TabsList className="justify-start">
              <TabsTrigger value="month">Month</TabsTrigger>
              <TabsTrigger value="week">Week</TabsTrigger>
              <TabsTrigger value="day">Day</TabsTrigger>
            </TabsList>
            {['month', 'week', 'day'].map((viewType) => (
              <TabsContent key={viewType} value={viewType}>
                <EnhancedScheduleView
                  appointments={appointments}
                  view={viewType as 'month' | 'week' | 'day'}
                  onAddAppointment={() => setIsAddAppointmentOpen(true)}
                  onEditAppointment={(appointment: Appointment) => {
                    setSelectedAppointment(appointment)
                    setIsEditAppointmentOpen(true)
                  }}
                  onDeleteAppointment={(appointmentId: string) => {
                    if (window.confirm("Are you sure you want to delete this appointment?")) {
                      handleDeleteAppointment(appointmentId)
                    }
                  }}
                  onPatientClick={handlePatientClick}
                  selectedProviders={selectedProviders}
                  selectedLocations={selectedLocations}
                  onSelectProviders={setSelectedProviders}
                  onSelectLocations={setSelectedLocations}
                />
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>

      <AddAppointmentDialog
        isOpen={isAddAppointmentOpen}
        onClose={() => setIsAddAppointmentOpen(false)}
        onAddAppointment={handleAddAppointment}
      />
      {selectedAppointment && (
        <EditAppointmentDialog
          isOpen={isEditAppointmentOpen}
          onClose={() => {
            setIsEditAppointmentOpen(false)
            setSelectedAppointment(null)
          }}
          onEditAppointment={handleEditAppointment}
          appointment={{
            id: selectedAppointment.id,
            appointment_date: selectedAppointment.appointment_date,
            patient_id: selectedAppointment.patient_id,
            provider_id: selectedAppointment.provider_id,
            location_id: selectedAppointment.location_id,
            reason_for_visit: selectedAppointment.reason_for_visit,
            duration_minutes: selectedAppointment.duration_minutes,
            status: selectedAppointment.status,
            appointment_type: selectedAppointment.appointment_type,
            notes: selectedAppointment.notes,
            visit_type: selectedAppointment.visit_type || 'in_person',
            organization_id: userData?.organization_id || '',
            is_recurring: false
          }}
          providers={providers || []}
          locations={locations || []}
          patients={patients || []}
        />
      )}
    </div>
  )
}

