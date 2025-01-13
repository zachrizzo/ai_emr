'use client'

import { useState, useEffect } from 'react'
import { Appointment, AppointmentDetails } from '@/types'
import { Card, CardContent } from "@/components/ui/card"
import { EnhancedScheduleView } from '@/components/enhanced-schedule-view'
import { AddAppointmentDialog } from '@/components/add-appointment-dialog'
import { EditAppointmentDialog } from '@/components/edit-appointment-dialog'
import { toast } from '@/components/ui/use-toast'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useLocations } from '@/contexts/LocationContext'
import { useProviders } from '@/contexts/ProviderContext'
import { usePatients } from '@/contexts/PatientContext'
import { useUser } from '@/contexts/UserContext'
import { useAppointments } from '@/contexts/AppointmentContext'
import { useRouter } from 'next/navigation'

export default function SchedulePage() {
  const router = useRouter()
  const [selectedProviders, setSelectedProviders] = useState<string[]>([])
  const [selectedLocations, setSelectedLocations] = useState<string[]>([])
  const [isAddAppointmentOpen, setIsAddAppointmentOpen] = useState(false)
  const [isEditAppointmentOpen, setIsEditAppointmentOpen] = useState(false)
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null)

  const { locations } = useLocations()
  const { providers } = useProviders()
  const { patients } = usePatients()
  const { userData } = useUser()
  const {
    appointments,
    isLoading,
    error,
    fetchAppointments,
    addAppointment,
    updateAppointment,
    deleteAppointment
  } = useAppointments()

  // Set default selections when providers and locations are loaded
  useEffect(() => {
    if (providers && providers.length > 0) {
      setSelectedProviders(providers.map(p => p.id))
    }
  }, [providers])

  useEffect(() => {
    if (locations && locations.length > 0) {
      setSelectedLocations(locations.map(l => l.id))
    }
  }, [locations])

  // Fetch appointments when filters change
  useEffect(() => {
    if (userData?.organization_id) {
      fetchAppointments()
    }
  }, [selectedProviders, selectedLocations, userData?.organization_id])

  const handlePatientClick = (patientId: string) => {
    router.push(`/patients/${patientId}`)
  }

  const handleEditAppointment = async (updatedAppointment: AppointmentDetails) => {
    try {
      await updateAppointment(updatedAppointment.id, updatedAppointment)
      setIsEditAppointmentOpen(false)
      setSelectedAppointment(null)
    } catch (error) {
      console.error('Error updating appointment:', error)
    }
  }

  const handleDeleteAppointment = async (appointmentId: string) => {
    try {
      await deleteAppointment(appointmentId)
    } catch (error) {
      console.error('Error deleting appointment:', error)
    }
  }

  if (error) {
    return <div>Error loading schedule: {error.message}</div>
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
                  isLoading={isLoading}
                />
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>

      <AddAppointmentDialog
        isOpen={isAddAppointmentOpen}
        onClose={() => setIsAddAppointmentOpen(false)}
        onSuccess={() => {
          setIsAddAppointmentOpen(false)
          fetchAppointments()
        }}
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

