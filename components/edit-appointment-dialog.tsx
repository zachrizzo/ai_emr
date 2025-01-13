import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { AppointmentDetails } from '@/types'
import { useToast } from "@/components/ui/use-toast"
import { useAppointments } from '@/contexts/AppointmentContext'

interface EditAppointmentDialogProps {
  isOpen: boolean
  onClose: () => void
  onEditAppointment: (appointment: AppointmentDetails) => void
  appointment: AppointmentDetails
  providers: any[]
  locations: any[]
  patients: any[]
}

const formatStatus = (status: string) => {
  return status
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

export function EditAppointmentDialog({
  isOpen,
  onClose,
  appointment,
  providers = [],
  locations = [],
  patients = []
}: EditAppointmentDialogProps) {
  const { toast } = useToast()
  const { updateAppointment } = useAppointments()
  const [editedAppointment, setEditedAppointment] = useState<AppointmentDetails>(appointment)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const missingFields = []

    try {
      if (!editedAppointment.patient_id) missingFields.push('Patient')
      if (!editedAppointment.provider_id) missingFields.push('Provider')
      if (!editedAppointment.appointment_date) missingFields.push('Date and Time')
      if (!editedAppointment.appointment_type) missingFields.push('Appointment Type')
      if (!editedAppointment.reason_for_visit) missingFields.push('Reason for Visit')

      if (missingFields.length > 0) {
        toast({
          title: "Error",
          description: `Please fill in the following required fields: ${missingFields.join(', ')}`,
          variant: "destructive",
        })
        return
      }

      await updateAppointment(editedAppointment.id, editedAppointment)
      onClose()
    } catch (error: any) {
      console.error('Error updating appointment:', error)
      toast({
        title: "Error",
        description: error.message || "Error updating appointment",
        variant: "destructive",
      })
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] md:max-w-[600px] lg:max-w-[700px]">
        <DialogHeader>
          <DialogTitle>Edit Appointment</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="provider">Provider *</Label>
              <Select
                value={editedAppointment.provider_id}
                onValueChange={(value) => setEditedAppointment({ ...editedAppointment, provider_id: value })}
                required
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select provider" />
                </SelectTrigger>
                <SelectContent>
                  {providers.map((provider) => (
                    <SelectItem key={provider.id} value={provider.id}>
                      {`${provider.first_name} ${provider.last_name}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="location">Location</Label>
              <Select
                value={editedAppointment.location_id}
                onValueChange={(value) => setEditedAppointment({ ...editedAppointment, location_id: value })}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select location" />
                </SelectTrigger>
                <SelectContent>
                  {locations.map((location) => (
                    <SelectItem key={location.id} value={location.id}>
                      {location.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="appointment_type">Appointment Type *</Label>
              <Select
                value={editedAppointment.appointment_type}
                onValueChange={(value) => setEditedAppointment({ ...editedAppointment, appointment_type: value })}
                required
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {['New Patient', 'Follow Up', 'Consultation', 'Physical', 'Urgent'].map((type) => (
                    <SelectItem key={type} value={type.toLowerCase()}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="status">Status</Label>
              <Select
                value={editedAppointment.status}
                onValueChange={(value) => setEditedAppointment({ ...editedAppointment, status: value })}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  {['scheduled', 'confirmed', 'cancelled', 'completed', 'no_show'].map((status) => (
                    <SelectItem key={status} value={status}>
                      {formatStatus(status)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="visit_type">Visit Type</Label>
              <Select
                value={editedAppointment.visit_type}
                onValueChange={(value) => setEditedAppointment({ ...editedAppointment, visit_type: value })}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select visit type" />
                </SelectTrigger>
                <SelectContent>
                  {['in_person', 'telehealth', 'home_visit'].map((type) => (
                    <SelectItem key={type} value={type}>
                      {formatStatus(type)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="appointment_date">Date and Time *</Label>
              <Input
                type="datetime-local"
                id="appointment_date"
                value={editedAppointment.appointment_date}
                onChange={(e) => setEditedAppointment({ ...editedAppointment, appointment_date: e.target.value })}
                required
                className="w-full"
              />
            </div>
            <div>
              <Label htmlFor="duration">Duration (minutes)</Label>
              <Input
                type="number"
                id="duration"
                value={editedAppointment.duration_minutes}
                onChange={(e) => setEditedAppointment({ ...editedAppointment, duration_minutes: parseInt(e.target.value) })}
                min={15}
                step={15}
                className="w-full"
              />
            </div>
          </div>
          <div>
            <Label htmlFor="reason_for_visit">Reason for Visit *</Label>
            <Textarea
              id="reason_for_visit"
              value={editedAppointment.reason_for_visit}
              onChange={(e) => setEditedAppointment({ ...editedAppointment, reason_for_visit: e.target.value })}
              required
              className="w-full"
            />
          </div>
          <div>
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={editedAppointment.notes}
              onChange={(e) => setEditedAppointment({ ...editedAppointment, notes: e.target.value })}
              className="w-full"
            />
          </div>
          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit">Update Appointment</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

