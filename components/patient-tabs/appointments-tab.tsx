import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { DataGrid } from '@/components/data-grid'
import { Appointment, Provider, Location } from '@/types'
import { createClient } from '@supabase/supabase-js'
import { useToast } from "@/components/ui/use-toast"
import { AddAppointmentDialog } from '@/components/add-appointment-dialog'
import { EditAppointmentDialog } from '@/components/edit-appointment-dialog'
import { PlusCircle } from 'lucide-react'
import { format } from 'date-fns'

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

interface AppointmentsTabProps {
  patientId: string
}

export function AppointmentsTab({ patientId }: AppointmentsTabProps) {
  const { toast } = useToast()
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [providers, setProviders] = useState<Provider[]>([])
  const [locations, setLocations] = useState<Location[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isAddingAppointment, setIsAddingAppointment] = useState(false)
  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null)

  useEffect(() => {
    fetchAppointments()
    fetchProviders()
    fetchLocations()
  }, [patientId])

  const fetchAppointments = async () => {
    setIsLoading(true)
    try {
      const { data, error } = await supabase
        .from('appointments')
        .select(`
          *,
          provider:providers(id, email),
          location:locations(id, name)
        `)
        .eq('patient_id', patientId)
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
    try {
      const { data, error } = await supabase
        .from('providers')
        .select('id, email')

      if (error) throw error
      setProviders(data)
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
    try {
      const { data, error } = await supabase
        .from('locations')
        .select('id, name')

      if (error) throw error
      setLocations(data)
    } catch (error) {
      console.error("Error fetching locations:", error)
    }
  }

  const handleAddAppointment = async (newAppointment: Omit<Appointment, 'id'>) => {
    try {
      console.log('Attempting to add appointment:', newAppointment);

      const { data, error } = await supabase
        .from('appointments')
        .insert(newAppointment)
        .select()

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }

      if (!data || data.length === 0) {
        throw new Error('No data returned after insert');
      }

      console.log('Appointment added successfully:', data[0]);
      setAppointments([...appointments, data[0]])
      toast({
        title: "Success",
        description: "Appointment added successfully.",
      })
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

  const handleUpdateAppointment = async (updatedAppointment: Appointment) => {
    try {
      const { data, error } = await supabase
        .from('appointments')
        .update(updatedAppointment)
        .eq('id', updatedAppointment.id)
        .select()

      if (error) throw error

      if (data) {
        setAppointments(appointments.map(apt => apt.id === updatedAppointment.id ? data[0] : apt))
        toast({
          title: "Success",
          description: "Appointment updated successfully.",
        })
      }
    } catch (error) {
      console.error("Error updating appointment:", error)
      toast({
        title: "Error",
        description: "Failed to update appointment. Please try again.",
        variant: "destructive",
      })
    } finally {
      setEditingAppointment(null)
    }
  }

  const handleDeleteAppointments = async (selectedAppointments: Appointment[]) => {
    try {
      for (const appointment of selectedAppointments) {
        const { error } = await supabase
          .from('appointments')
          .delete()
          .eq('id', appointment.id)

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
              accessorKey: 'provider.email' 
            },
            { 
              header: 'Location', 
              accessorKey: 'location.name'
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
        providers={providers}
        locations={locations}
        patientId={patientId} 
      />
      {editingAppointment && (
        <EditAppointmentDialog
          isOpen={!!editingAppointment}
          onClose={() => setEditingAppointment(null)}
          onUpdateAppointment={handleUpdateAppointment}
          appointment={editingAppointment}
          providers={providers}
          locations={locations}
        />
      )}
    </Card>
  )
}

