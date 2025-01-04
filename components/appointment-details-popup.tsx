'use client'

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Appointment, Patient, Provider, Location } from "@/types"
import { format, parseISO } from 'date-fns'

interface AppointmentDetailsPopupProps {
  appointment: Appointment
  onEdit: (appointment: Appointment) => void
  onDelete: (appointmentId: string) => void
  children: React.ReactNode
}

export function AppointmentDetailsPopup({ appointment, onEdit, onDelete, children }: AppointmentDetailsPopupProps) {
  const [isOpen, setIsOpen] = useState(false)

  const patientName = appointment.patient?.full_name ?? 'Unknown Patient'
  const providerName = appointment.provider?.full_name ?? 'Unknown Provider'
  const locationName = appointment.location?.name ?? 'No location specified'

  const handleDelete = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onDelete(appointment.id);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <div className="cursor-pointer">
          {children}
        </div>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Appointment Details</DialogTitle>
        </DialogHeader>
        <div className="mt-4 space-y-2">
          <p><strong>Date:</strong> {format(parseISO(appointment.appointment_date), 'MMMM d, yyyy')}</p>
          <p><strong>Time:</strong> {format(parseISO(appointment.appointment_date), 'HH:mm')}</p>
          <p><strong>Type:</strong> {appointment.appointment_type}</p>
          <p><strong>Duration:</strong> {appointment.duration_minutes} minutes</p>
          <p><strong>Patient:</strong> {patientName}</p>
          <p><strong>Provider:</strong> {providerName}</p>
          <p><strong>Location:</strong> {locationName}</p>
          <p><strong>Status:</strong> {appointment.status}</p>
          <p><strong>Reason for Visit:</strong> {appointment.reason_for_visit}</p>
          {appointment.notes && <p><strong>Notes:</strong> {appointment.notes}</p>}
        </div>
        <div className="flex justify-end space-x-2 mt-4">
          <Button variant="outline" onClick={() => onEdit(appointment)}>Edit</Button>
          <Button
            variant="destructive"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onDelete(appointment.id);
            }}
          >
            Delete
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

