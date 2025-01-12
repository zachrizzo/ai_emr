import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { DataGrid } from '@/components/data-grid'
import { Appointment, AppointmentDetails, Provider, Location } from '@/types'
import { createClient } from '@supabase/supabase-js'
import { useToast } from "@/components/ui/use-toast"
import { AddAppointmentDialog } from '@/components/add-appointment-dialog'
import { EditAppointmentDialog } from '@/components/edit-appointment-dialog'
import { PlusCircle } from 'lucide-react'
import { format } from 'date-fns'
import { useUser } from '@/contexts/UserContext'

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

interface AppointmentsTabProps {
  patientId: string
}

export function AppointmentsTab({ patientId }: AppointmentsTabProps) {
  const { toast } = useToast()
  const { user } = useUser()
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [providers, setProviders] = useState<Provider[]>([])
  const [locations, setLocations] = useState<Location[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isAddingAppointment, setIsAddingAppointment] = useState(false)
  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null)

  useEffect(() => {
    if (user?.organization_id) {
      fetchAppointments()
      fetchProviders()
      fetchLocations()
    }
  }, [patientId, user?.organization_id])

  const fetchAppointments = async () => {
    if (!user?.organization_id) return
    setIsLoading(true)
    try {
      const { data, error } = await supabase
        .from('appointments')
        .select(`
          *,
          patient:patients(id, first_name, last_name),
          provider:providers(id, first_name, last_name),
          location:locations(id, name)
        `)
        .eq('patient_id', patientId)
        .eq('organization_id', user.organization_id)
        .order('appointment_date', { ascending: true })

      if (error) throw error
      setAppointments(data)
    } catch (error) {
      console.error("Error fetching appointments:", error)
      toast({
        title: "Error",
        description: "Failed to fetch appointments. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const fetchProviders = async () => {
    if (!user?.organization_id) return
    try {
      const { data, error } = await supabase
        .from('providers')
        .select('id, first_name, last_name, email, specialty, status, organization_id')
        .eq('organization_id', user.organization_id)
        .is('deleted_at', null)

      if (error) throw error
      setProviders(data as Provider[])
    } catch (error) {
      console.error("Error fetching providers:", error)
      toast({
        title: "Error",
        description: "Failed to fetch providers. Please try again.",
        variant: "destructive",
      })
    }
  }

  const fetchLocations = async () => {
    if (!user?.organization_id) return
    try {
      const { data, error } = await supabase
        .from('locations')
        .select('id, name, address, status, organization_id')
        .eq('organization_id', user.organization_id)
        .is('deleted_at', null)

      if (error) throw error
      setLocations(data as Location[])
    } catch (error) {
      console.error("Error fetching locations:", error)
    }
  }

  const handleAddAppointment = async (newAppointment: Omit<Appointment, 'id' | 'created_at' | 'updated_at' | 'organization_id'>) => {
    try {
      if (!user?.organization_id) throw new Error('No organization found for user')

      console.log('Adding appointment with:', {
        patient_id: patientId,
        organization_id: user.organization_id
      })

      // Verify that provider isn't deleted
      const [providerCheck, locationCheck] = await Promise.all([
        supabase.from('providers')
          .select('id, first_name, last_name')
          .eq('id', newAppointment.provider_id)
          .eq('organization_id', user.organization_id)
          .is('deleted_at', null),
        newAppointment.location_id ? supabase.from('locations')
          .select('id, name')
          .eq('id', newAppointment.location_id)
          .eq('organization_id', user.organization_id)
          .is('deleted_at', null) : Promise.resolve({ data: null, error: null })
      ])

      // Check if provider exists and belongs to organization
      if (!providerCheck.data?.length) {
        throw new Error('Selected provider not found or does not belong to your organization')
      }

      // Check if location exists and belongs to organization
      if (newAppointment.location_id && !locationCheck.data?.length) {
        throw new Error('Selected location not found or does not belong to your organization')
      }

      const appointmentWithOrg = {
        ...newAppointment,
        patient_id: patientId,
        organization_id: user.organization_id
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
        toast({
          title: "Success",
          description: "Appointment added successfully.",
        })
      }
    } catch (error) {
      console.error("Error adding appointment:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to add appointment. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsAddingAppointment(false)
    }
  }

  const handleUpdateAppointment = async (updatedAppointment: AppointmentDetails) => {
    try {
      if (!user?.organization_id) throw new Error('No organization found for user')

      const [providerCheck, locationCheck] = await Promise.all([
        supabase.from('providers')
          .select('id')
          .eq('id', updatedAppointment.provider_id)
          .eq('organization_id', user.organization_id)
          .is('deleted_at', null)
          .single(),
        updatedAppointment.location_id ? supabase.from('locations')
          .select('id')
          .eq('id', updatedAppointment.location_id)
          .eq('organization_id', user.organization_id)
          .is('deleted_at', null)
          .single() : Promise.resolve({ data: null, error: null })
      ])

      if (providerCheck.error) throw new Error('Selected provider is not available')
      if (updatedAppointment.location_id && locationCheck.error) throw new Error('Selected location is not available')

      const { error } = await supabase
        .from('appointments')
        .update({
          ...updatedAppointment,
          organization_id: user.organization_id
        })
        .eq('id', updatedAppointment.id)
        .eq('organization_id', user.organization_id)

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
      toast({
        title: "Success",
        description: "Appointment updated successfully.",
      })
    } catch (error) {
      console.error("Error updating appointment:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update appointment. Please try again.",
        variant: "destructive",
      })
    } finally {
      setEditingAppointment(null)
    }
  }

  const handleDeleteAppointments = async (selectedAppointments: Appointment[]) => {
    if (!user?.organization_id) return
    try {
      for (const appointment of selectedAppointments) {
        const { error } = await supabase
          .from('appointments')
          .delete()
          .eq('id', appointment.id)
          .eq('organization_id', user.organization_id)

        if (error) throw error
      }
      setAppointments(appointments.filter(apt => !selectedAppointments.some(selected => selected.id === apt.id)))
      toast({
        title: "Success",
        description: "Selected appointments deleted successfully.",
      })
    } catch (error) {
      console.error("Error deleting appointments:", error)
      toast({
        title: "Error",
        description: "Failed to delete appointments. Please try again.",
        variant: "destructive",
      })
    }
  }

  if (isLoading) return <div>Loading appointments...</div>

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Appointments</CardTitle>
          <Button onClick={() => setIsAddingAppointment(true)}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Add Appointment
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <DataGrid
          data={appointments}
          columns={[
            {
              header: 'Date & Time',
              accessorKey: 'appointment_date',
              cell: ({ row }) => format(new Date(row.original.appointment_date), 'MMM d, yyyy HH:mm')
            },
            {
              header: 'Provider',
              accessorKey: 'provider',
              cell: ({ row }) => row.original.provider ? `${row.original.provider.first_name} ${row.original.provider.last_name}` : '-'
            },
            {
              header: 'Location',
              accessorKey: 'location',
              cell: ({ row }) => row.original.location?.name || '-'
            },
            { header: 'Type', accessorKey: 'appointment_type' },
            { header: 'Status', accessorKey: 'status' },
            { header: 'Reason', accessorKey: 'reason_for_visit' },
          ]}
          onEdit={(appointment) => setEditingAppointment(appointment)}
          onDelete={handleDeleteAppointments}
        />
      </CardContent>
      <AddAppointmentDialog
        isOpen={isAddingAppointment}
        onClose={() => setIsAddingAppointment(false)}
        onAddAppointment={handleAddAppointment}
        patientId={patientId}
      />
      {editingAppointment && (
        <EditAppointmentDialog
          isOpen={!!editingAppointment}
          onClose={() => setEditingAppointment(null)}
          onEditAppointment={handleUpdateAppointment}
          appointment={{
            id: editingAppointment.id,
            appointment_date: editingAppointment.appointment_date,
            patient_id: editingAppointment.patient_id,
            provider_id: editingAppointment.provider_id,
            location_id: editingAppointment.location_id,
            reason_for_visit: editingAppointment.reason_for_visit,
            duration_minutes: editingAppointment.duration_minutes,
            status: editingAppointment.status,
            appointment_type: editingAppointment.appointment_type,
            notes: editingAppointment.notes,
            visit_type: editingAppointment.visit_type || 'in_person',
            organization_id: user?.organization_id || '',
            is_recurring: false
          }}
          providers={providers}
          locations={locations}
          patients={[]}
        />
      )}
    </Card>
  )
}

