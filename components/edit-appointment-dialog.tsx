import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Appointment, Patient, Provider, Location } from '@/types'

interface EditAppointmentDialogProps {
  isOpen: boolean
  onClose: () => void
  onEditAppointment: (appointment: Appointment) => void
  appointment: Appointment | null
  patients: Patient[]
  providers: Provider[]
  locations: Location[]
}

export function EditAppointmentDialog({
  isOpen,
  onClose,
  onEditAppointment,
  appointment,
  patients,
  providers,
  locations,
}: EditAppointmentDialogProps) {
  const [editedAppointment, setEditedAppointment] = useState<Appointment | null>(null)

  useEffect(() => {
    if (appointment) {
      setEditedAppointment(appointment)
    }
  }, [appointment])

  if (!editedAppointment) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (editedAppointment) {
      onEditAppointment(editedAppointment)
    }
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Appointment</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="patient">Patient</Label>
            <Select
              value={editedAppointment.patient_id}
              onValueChange={(value) => setEditedAppointment(prev => ({ ...prev, patient_id: value }))}
            >
              <SelectTrigger id="patient">
                <SelectValue placeholder="Select a patient" />
              </SelectTrigger>
              <SelectContent>
                {patients.map((patient) => (
                  <SelectItem key={patient.id} value={patient.id}>
                    {patient.full_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="provider">Provider</Label>
            <Select
              value={editedAppointment.provider_id}
              onValueChange={(value) => setEditedAppointment(prev => ({ ...prev, provider_id: value }))}
            >
              <SelectTrigger id="provider">
                <SelectValue placeholder="Select a provider" />
              </SelectTrigger>
              <SelectContent>
                {providers.map((provider) => (
                  <SelectItem key={provider.id} value={provider.id}>
                    {provider.full_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="location">Location</Label>
            <Select
              value={editedAppointment.location_id || 'none'}
              onValueChange={(value) => setEditedAppointment(prev => ({ ...prev, location_id: value === 'none' ? null : value }))}
            >
              <SelectTrigger id="location">
                <SelectValue placeholder="Select a location" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No Location</SelectItem>
                {locations.map((location) => (
                  <SelectItem key={location.id} value={location.id}>
                    {location.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="appointment_date">Date and Time</Label>
            <Input
              id="appointment_date"
              type="datetime-local"              
              value={editedAppointment.appointment_date}
              onChange={(e) => setEditedAppointment({ ...editedAppointment, appointment_date: e.target.value })}
              required
            />
          </div>
          <div>
            <Label htmlFor="duration_minutes">Duration (minutes)</Label>
            <Input
              id="duration_minutes"
              type="number"
              value={editedAppointment.duration_minutes.toString()}
              onChange={(e) => setEditedAppointment({ ...editedAppointment, duration_minutes: parseInt(e.target.value) })}
              required
            />
          </div>
          <div>
            <Label htmlFor="appointment_type">Appointment Type</Label>
            <Input
              id="appointment_type"
              value={editedAppointment.appointment_type}
              onChange={(e) => setEditedAppointment({ ...editedAppointment, appointment_type: e.target.value })}
              required
            />
          </div>
          <div>
            <Label htmlFor="status">Status</Label>
            <Select
              value={editedAppointment.status}
              onValueChange={(value) => setEditedAppointment(prev => ({ ...prev, status: value as Appointment['status'] }))}
            >
              <SelectTrigger id="status">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Scheduled">Scheduled</SelectItem>
                <SelectItem value="Completed">Completed</SelectItem>
                <SelectItem value="Cancelled">Cancelled</SelectItem>
                <SelectItem value="No Show">No Show</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="reason_for_visit">Reason for Visit</Label>
            <Textarea
              id="reason_for_visit"
              value={editedAppointment.reason_for_visit}
              onChange={(e) => setEditedAppointment({ ...editedAppointment, reason_for_visit: e.target.value })}
              required
            />
          </div>
          <div>
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={editedAppointment.notes}
              onChange={(e) => setEditedAppointment({ ...editedAppointment, notes: e.target.value })}
            />
          </div>
          <Button type="submit">Update Appointment</Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}

