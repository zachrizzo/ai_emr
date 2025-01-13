'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { DataGrid } from '@/components/data-grid'
import { Appointment, AppointmentDetails } from '@/types'
import { useToast } from "@/components/ui/use-toast"
import { AddAppointmentDialog } from '@/components/add-appointment-dialog'
import { EditAppointmentDialog } from '@/components/edit-appointment-dialog'
import { PlusCircle } from 'lucide-react'
import { format } from 'date-fns'
import { useUser } from '@/contexts/UserContext'
import { useProviders } from '@/contexts/ProviderContext'
import { useLocations } from '@/contexts/LocationContext'
import { usePatients } from '@/contexts/PatientContext'
import { useAppointments } from '@/contexts/AppointmentContext'

interface AppointmentsTabProps {
  patientId: string
}

export function AppointmentsTab({ patientId }: AppointmentsTabProps) {
  const { toast } = useToast()
  const { userData } = useUser()
  const { providers } = useProviders()
  const { locations } = useLocations()
  const { appointments, isLoading, fetchAppointments, addAppointment, updateAppointment, deleteAppointment } = useAppointments()
  const [isAddingAppointment, setIsAddingAppointment] = useState(false)
  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null)

  useEffect(() => {
    if (userData?.organization_id) {
      fetchAppointments(patientId)
    }
  }, [patientId, userData?.organization_id])

  const handleUpdateAppointment = async (updatedAppointment: AppointmentDetails) => {
    try {
      await updateAppointment(updatedAppointment.id, updatedAppointment)
      setEditingAppointment(null)
    } catch (error) {
      console.error("Error updating appointment:", error)
    }
  }

  const handleDeleteAppointments = async (selectedRows: Appointment[]) => {
    try {
      await Promise.all(selectedRows.map(row => deleteAppointment(row.id)))
    } catch (error) {
      console.error('Error deleting appointments:', error)
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
          filterColumn="appointment_type"
        />
      </CardContent>
      <AddAppointmentDialog
        isOpen={isAddingAppointment}
        onClose={() => setIsAddingAppointment(false)}
        onSuccess={() => {
          setIsAddingAppointment(false)
          fetchAppointments(patientId)
        }}
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
            organization_id: userData?.organization_id || '',
            is_recurring: false
          }}
          providers={providers || []}
          locations={locations || []}
          patients={[]}
        />
      )}
    </Card>
  )
}

