'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { toast } from '@/components/ui/use-toast'
import { EditAppointmentDialog } from '@/components/edit-appointment-dialog'
import { RecurringAppointmentForm } from '@/components/recurring-appointment-form'
import { useProviders } from '@/contexts/ProviderContext'
import { useLocations } from '@/contexts/LocationContext'
import { usePatients } from '@/contexts/PatientContext'

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

interface AppointmentDetails {
  id: string
  appointment_date: string
  patient_id: string
  provider_id: string
  location_id: string
  reason_for_visit: string
  diagnosis?: string
  follow_up_plan?: string
  notes?: string
  duration_minutes: number
  status: 'scheduled' | 'checked_in' | 'in_progress' | 'completed' | 'cancelled' | 'no_show'
  appointment_type: string
  visit_type: 'in_person' | 'video' | 'phone'
  organization_id: string
  is_recurring?: boolean
  recurring_pattern?: string
}

export default function AppointmentPage({ params }: { params: { id: string } }) {
  const [appointment, setAppointment] = useState<AppointmentDetails | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isCancelling, setIsCancelling] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const { providers } = useProviders()
  const { locations } = useLocations()
  const { patients } = usePatients()

  useEffect(() => {
    fetchAppointment()
  }, [params.id])

  const fetchAppointment = async () => {
    try {
      const { data, error } = await supabase
        .from('appointments')
        .select('*')
        .eq('id', params.id)
        .single()

      if (error) throw error
      setAppointment(data)
    } catch (error) {
      console.error('Error fetching appointment:', error)
      toast({
        title: 'Error',
        description: 'Failed to fetch appointment details',
        variant: 'destructive'
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleCancelAppointment = async () => {
    if (!appointment) return

    try {
      setIsCancelling(true)
      const { error } = await supabase
        .from('appointments')
        .update({ status: 'cancelled' })
        .eq('id', appointment.id)

      if (error) throw error

      toast({
        title: 'Success',
        description: 'Appointment cancelled successfully'
      })
      fetchAppointment()
    } catch (error) {
      console.error('Error cancelling appointment:', error)
      toast({
        title: 'Error',
        description: 'Failed to cancel appointment',
        variant: 'destructive'
      })
    } finally {
      setIsCancelling(false)
    }
  }

  if (isLoading) {
    return <div>Loading appointment details...</div>
  }

  if (!appointment) {
    return <div>Appointment not found</div>
  }

  const getVisitTypeLabel = (type: string) => {
    switch (type) {
      case 'in_person':
        return 'In Person Visit'
      case 'video':
        return 'Video Visit'
      case 'phone':
        return 'Phone Visit'
      default:
        return type
    }
  }

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'scheduled':
        return 'bg-blue-100 text-blue-800'
      case 'checked_in':
        return 'bg-yellow-100 text-yellow-800'
      case 'in_progress':
        return 'bg-purple-100 text-purple-800'
      case 'completed':
        return 'bg-green-100 text-green-800'
      case 'cancelled':
        return 'bg-red-100 text-red-800'
      case 'no_show':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Appointment Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            <div>
              <strong>Date:</strong> {new Date(appointment.appointment_date).toLocaleDateString()}
            </div>
            <div>
              <strong>Time:</strong> {new Date(appointment.appointment_date).toLocaleTimeString()}
            </div>
            <div>
              <strong>Duration:</strong> {appointment.duration_minutes} minutes
            </div>
            <div>
              <strong>Visit Type:</strong>{' '}
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                {getVisitTypeLabel(appointment.visit_type)}
              </span>
            </div>
            <div>
              <strong>Status:</strong>{' '}
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-medium ${getStatusBadgeColor(appointment.status)}`}>
                {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
              </span>
            </div>
            {appointment.reason_for_visit && (
              <div>
                <strong>Reason for Visit:</strong> {appointment.reason_for_visit}
              </div>
            )}
            {appointment.diagnosis && (
              <div>
                <strong>Diagnosis:</strong> {appointment.diagnosis}
              </div>
            )}
            {appointment.follow_up_plan && (
              <div>
                <strong>Follow-up Plan:</strong> {appointment.follow_up_plan}
              </div>
            )}
            {appointment.notes && (
              <div>
                <strong>Notes:</strong> {appointment.notes}
              </div>
            )}
            {appointment.is_recurring && (
              <div>
                <strong>Recurring Pattern:</strong> {appointment.recurring_pattern}
              </div>
            )}
          </div>
          <div className="mt-6 flex gap-4">
            <EditAppointmentDialog
              isOpen={isEditing}
              onClose={() => setIsEditing(false)}
              appointment={appointment}
              onEditAppointment={fetchAppointment}
              providers={providers || []}
              locations={locations || []}
              patients={patients || []}
            />
            <Button
              variant="outline"
              onClick={() => setIsEditing(true)}
            >
              Edit
            </Button>
            <Button
              variant="destructive"
              onClick={handleCancelAppointment}
              disabled={appointment.status === 'cancelled' || isCancelling}
            >
              {isCancelling ? 'Cancelling...' : 'Cancel Appointment'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {appointment.status === 'scheduled' && !appointment.is_recurring && (
        <RecurringAppointmentForm
          appointment={{
            appointment_date: appointment.appointment_date,
            duration_minutes: appointment.duration_minutes,
            patient_id: appointment.patient_id,
            provider_id: appointment.provider_id,
            location_id: appointment.location_id,
            reason_for_visit: appointment.reason_for_visit,
            visit_type: appointment.visit_type,
            appointment_type: appointment.appointment_type,
            organization_id: appointment.organization_id
          }}
          onSuccess={() => {
            toast({
              title: 'Success',
              description: 'Recurring appointments created successfully'
            })
          }}
        />
      )}
    </div>
  )
}


