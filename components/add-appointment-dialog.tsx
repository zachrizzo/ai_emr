import { useState, useEffect } from 'react'
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
import { useUser } from '@/contexts/UserContext'
import { useAppointments } from '@/contexts/AppointmentContext'

interface AddAppointmentDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  patientId?: string;
}

const formatStatus = (status: string) => {
  return status
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

export function AddAppointmentDialog({
  isOpen,
  onClose,
  onSuccess,
  patientId
}: AddAppointmentDialogProps) {
  const { toast } = useToast()
  const { providers = [] } = useProviders()
  const { locations = [] } = useLocations()
  const { patients, loading: patientsLoading, error: patientsError } = usePatients()
  const { userData } = useUser()
  const { addAppointment } = useAppointments()

  const [newAppointment, setNewAppointment] = useState<Omit<Appointment, 'id' | 'created_at' | 'updated_at'>>({
    patient_id: patientId || '',
    provider_id: '',
    location_id: '',
    appointment_date: '',
    appointment_time: '',
    visit_type: 'in_person',
    reason_for_visit: '',
    duration_minutes: 30,
    status: 'scheduled',
    appointment_type: '',
    notes: '',
    organization_id: userData?.organization_id || ''
  })

  useEffect(() => {
    setNewAppointment(prev => ({
      ...prev,
      patient_id: patientId || '',
      provider_id: '',
      location_id: '',
      appointment_date: '',
      appointment_time: '',
      visit_type: 'in_person',
      reason_for_visit: '',
      duration_minutes: 30,
      status: 'scheduled',
      appointment_type: '',
      notes: '',
      organization_id: userData?.organization_id || ''
    }))
  }, [isOpen, patientId, userData?.organization_id])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const missingFields = []

    try {
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

      await addAppointment(newAppointment)
      onSuccess?.()
      onClose()
    } catch (error: any) {
      console.error('Error creating appointment:', error)
      toast({
        title: "Error",
        description: error.message || "Error creating appointment",
        variant: "destructive",
      })
    }
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
                disabled={patientsLoading || !!patientId}
              >
                <SelectTrigger className="w-full">
                  {selectedPatient ? (
                    <div className="flex items-center justify-between">
                      <span>{selectedPatient.first_name + ' ' + selectedPatient.last_name}</span>
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
                      {`${patient.first_name} ${patient.last_name}`}
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
                value={newAppointment.location_id}
                onValueChange={(value) => setNewAppointment({ ...newAppointment, location_id: value })}
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
                value={newAppointment.appointment_type}
                onValueChange={(value) => setNewAppointment({ ...newAppointment, appointment_type: value })}
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
                value={newAppointment.status}
                onValueChange={(value) => setNewAppointment({ ...newAppointment, status: value })}
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
                value={newAppointment.visit_type}
                onValueChange={(value) => setNewAppointment({ ...newAppointment, visit_type: value })}
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
                value={newAppointment.appointment_date}
                onChange={(e) => setNewAppointment({ ...newAppointment, appointment_date: e.target.value })}
                required
                className="w-full"
              />
            </div>
            <div>
              <Label htmlFor="duration">Duration (minutes)</Label>
              <Input
                type="number"
                id="duration"
                value={newAppointment.duration_minutes}
                onChange={(e) => setNewAppointment({ ...newAppointment, duration_minutes: parseInt(e.target.value) })}
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


