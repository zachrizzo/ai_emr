'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { toast } from '@/components/ui/use-toast'

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

interface AppointmentDetails {
  id: string
  date: string
  time: string
  patientId: string
  providerId: string
  status: string
  notes?: string
  location?: string
  type?: string
}

export default function AppointmentPage({ params }: { params: { id: string } }) {
  const [appointment, setAppointment] = useState<AppointmentDetails | null>(null)
  const [isLoading, setIsLoading] = useState(true)

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

  if (isLoading) {
    return <div>Loading appointment details...</div>
  }

  if (!appointment) {
    return <div>Appointment not found</div>
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
              <strong>Date:</strong> {new Date(appointment.date).toLocaleDateString()}
            </div>
            <div>
              <strong>Time:</strong> {appointment.time}
            </div>
            <div>
              <strong>Status:</strong> {appointment.status}
            </div>
            {appointment.type && (
              <div>
                <strong>Type:</strong> {appointment.type}
              </div>
            )}
            {appointment.location && (
              <div>
                <strong>Location:</strong> {appointment.location}
              </div>
            )}
            {appointment.notes && (
              <div>
                <strong>Notes:</strong> {appointment.notes}
              </div>
            )}
          </div>
          <div className="mt-6 flex gap-4">
            <Button variant="outline">Edit Appointment</Button>
            <Button variant="destructive">Cancel Appointment</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

