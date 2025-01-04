import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Appointment } from '@/types'
import { useToast } from "@/components/ui/use-toast"
import { format } from 'date-fns'
import { useProviders } from '@/contexts/ProviderContext'
import { useLocations } from '@/contexts/LocationContext'
import { usePatients } from '@/contexts/PatientContext'

interface AddAppointmentDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onAddAppointment: (appointment: Omit<Appointment, 'id' | 'created_at' | 'updated_at'>) => void;
}

export function AddAppointmentDialog({
  isOpen,
  onClose,
  onAddAppointment,
}: AddAppointmentDialogProps) {
  const { toast } = useToast()
  const { providers = [] } = useProviders()
  const { locations = [] } = useLocations()
  const { patients, loading: patientsLoading, error: patientsError } = usePatients()

  console.log('AddAppointmentDialog state:', {
    providersCount: providers?.length || 0,
    locationsCount: locations?.length || 0,
    patientsCount: patients?.length || 0,
    isLoading: patientsLoading,
    patientsError: patientsError?.message
  })

  const [newAppointment, setNewAppointment] = useState<Omit<Appointment, 'id' | 'created_at' | 'updated_at'>>({
    patient_id: '',
    provider_id: '',
    location_id: null,
    appointment_date: '',
    appointment_type: '',
    status: 'Scheduled',
    reason_for_visit: '',
    duration_minutes: 30,
    notes: ''
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const missingFields = []

    if (!newAppointment.patient_id) missingFields.push('Patient')
    if (!newAppointment.provider_id) missingFields.push('Provider')
    if (!newAppointment.appointment_date) missingFields.push('Date and Time')
    if (!newAppointment.appointment_type) missingFields.push('Appointment Type')
    if (!newAppointment.reason_for_visit) missingFields.push('Reason for Visit')

    if (missingFields.length > 0) {
      toast({
        title: "Error",
        description: `Please fill in the following required fields: ${missingFields.join(', ')}`,
        variant: "destructive",
      })
      return
    }

    onAddAppointment(newAppointment)
    onClose() // Close the dialog after submitting
  }

  const selectedPatient = patients?.find(p => p.id === newAppointment.patient_id)

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] md:max-w-[600px] lg:max-w-[700px]">
        <DialogHeader>
          <DialogTitle>Add New Appointment</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {patientsLoading ? (
            <p className="text-muted-foreground">Loading patients...</p>
          ) : patientsError ? (
            <p className="text-red-500">Error loading patients: {patientsError.message}</p>
          ) : !patients?.length ? (
            <p className="text-red-500">No patients available. Please add patients first.</p>
          ) : null}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="patient">Patient *</Label>
              <Select
                value={newAppointment.patient_id}
                onValueChange={(value) => setNewAppointment({ ...newAppointment, patient_id: value })}
                required
                disabled={patientsLoading}
              >
                <SelectTrigger className="w-full">
                  {selectedPatient ? (
                    <div className="flex items-center justify-between">
                      <span>{selectedPatient.full_name}</span>
                      <span className="text-muted-foreground text-sm">
                        ({format(new Date(selectedPatient.date_of_birth), 'MM/dd/yyyy')})
                      </span>
                    </div>
                  ) : (
                    <SelectValue placeholder={patientsLoading ? "Loading..." : "Select patient"} />
                  )}
                </SelectTrigger>
                <SelectContent>
                  {patients?.map((patient) => (
                    <SelectItem key={patient.id} value={patient.id}>
                      <div className="flex items-center justify-between">
                        <span>{patient.full_name}</span>
                        <span className="text-muted-foreground text-sm">
                          ({format(new Date(patient.date_of_birth), 'MM/dd/yyyy')})
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="provider">Provider *</Label>
              <Select
                value={newAppointment.provider_id}
                onValueChange={(value) => setNewAppointment({ ...newAppointment, provider_id: value })}
                required
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select provider" />
                </SelectTrigger>
                <SelectContent>
                  {providers?.map((provider) => (
                    <SelectItem key={provider.id} value={provider.id}>{provider.full_name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="location">Location</Label>
              <Select
                value={newAppointment.location_id || ''}
                onValueChange={(value) => setNewAppointment({ ...newAppointment, location_id: value === 'none' ? null : value })}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select location" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No location</SelectItem>
                  {locations?.map((location) => (
                    <SelectItem key={location.id} value={location.id}>{location.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="appointment_date">Date and Time *</Label>
              <Input
                id="appointment_date"
                type="datetime-local"
                value={newAppointment.appointment_date}
                onChange={(e) => setNewAppointment({ ...newAppointment, appointment_date: e.target.value })}
                required
                className="w-full"
              />
            </div>
            <div>
              <Label htmlFor="appointment_type">Appointment Type *</Label>
              <Input
                id="appointment_type"
                value={newAppointment.appointment_type}
                onChange={(e) => setNewAppointment({ ...newAppointment, appointment_type: e.target.value })}
                required
                className="w-full"
              />
            </div>
            <div>
              <Label htmlFor="duration_minutes">Duration (minutes)</Label>
              <Input
                id="duration_minutes"
                type="number"
                value={newAppointment.duration_minutes}
                onChange={(e) => setNewAppointment({ ...newAppointment, duration_minutes: parseInt(e.target.value, 10) || 30 })}
                className="w-full"
              />
            </div>
          </div>
          <div>
            <Label htmlFor="reason_for_visit">Reason for Visit *</Label>
            <Textarea
              id="reason_for_visit"
              value={newAppointment.reason_for_visit}
              onChange={(e) => setNewAppointment({ ...newAppointment, reason_for_visit: e.target.value })}
              required
              className="w-full"
            />
          </div>
          <div>
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={newAppointment.notes}
              onChange={(e) => setNewAppointment({ ...newAppointment, notes: e.target.value })}
              className="w-full"
            />
          </div>
          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit">Add Appointment</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

