import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { createClient } from '@supabase/supabase-js'
import { toast } from '@/components/ui/use-toast'

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

interface EditAppointmentDialogProps {
  appointment: AppointmentDetails
  onUpdate: () => void
  trigger?: React.ReactNode
}

export function EditAppointmentDialog({ appointment, onUpdate, trigger }: EditAppointmentDialogProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState<Partial<AppointmentDetails>>({
    appointment_date: appointment.appointment_date ? new Date(appointment.appointment_date).toISOString().slice(0, 16) : new Date().toISOString().slice(0, 16),
    duration_minutes: appointment.duration_minutes,
    reason_for_visit: appointment.reason_for_visit,
    diagnosis: appointment.diagnosis,
    follow_up_plan: appointment.follow_up_plan,
    notes: appointment.notes,
    status: appointment.status,
    visit_type: appointment.visit_type,
    appointment_type: appointment.appointment_type
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const { error } = await supabase
        .from('appointments')
        .update({
          ...formData,
          appointment_date: new Date(formData.appointment_date!).toISOString()
        })
        .eq('id', appointment.id)

      if (error) throw error

      toast({
        title: 'Success',
        description: 'Appointment updated successfully'
      })
      onUpdate()
      setIsOpen(false)
    } catch (error) {
      console.error('Error updating appointment:', error)
      toast({
        title: 'Error',
        description: 'Failed to update appointment',
        variant: 'destructive'
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || <Button variant="outline">Edit Appointment</Button>}
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Edit Appointment</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="appointment_date">Date and Time</Label>
              <Input
                id="appointment_date"
                type="datetime-local"
                value={formData.appointment_date}
                onChange={(e) => setFormData({ ...formData, appointment_date: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="duration">Duration (minutes)</Label>
              <Input
                id="duration"
                type="number"
                value={formData.duration_minutes}
                onChange={(e) => setFormData({ ...formData, duration_minutes: parseInt(e.target.value) })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="visit_type">Visit Type</Label>
              <Select
                value={formData.visit_type}
                onValueChange={(value) => setFormData({ ...formData, visit_type: value as AppointmentDetails['visit_type'] })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select visit type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="in_person">In Person</SelectItem>
                  <SelectItem value="video">Video</SelectItem>
                  <SelectItem value="phone">Phone</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value) => setFormData({ ...formData, status: value as AppointmentDetails['status'] })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="scheduled">Scheduled</SelectItem>
                  <SelectItem value="checked_in">Checked In</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                  <SelectItem value="no_show">No Show</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="reason">Reason for Visit</Label>
            <Textarea
              id="reason"
              value={formData.reason_for_visit}
              onChange={(e) => setFormData({ ...formData, reason_for_visit: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="diagnosis">Diagnosis</Label>
            <Textarea
              id="diagnosis"
              value={formData.diagnosis}
              onChange={(e) => setFormData({ ...formData, diagnosis: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="follow_up">Follow-up Plan</Label>
            <Textarea
              id="follow_up"
              value={formData.follow_up_plan}
              onChange={(e) => setFormData({ ...formData, follow_up_plan: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            />
          </div>

          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

