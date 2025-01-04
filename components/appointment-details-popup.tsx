'use client'

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Appointment } from "@/types"
import { format, parseISO } from 'date-fns'
import { Badge } from "@/components/ui/badge"
import { Calendar, Clock, MapPin, User, Stethoscope, FileText, AlertCircle } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { Separator } from "@/components/ui/separator"

interface AppointmentDetailsPopupProps {
  appointment: Appointment
  onEdit: (appointment: Appointment) => void
  onDelete: (appointmentId: string) => void
  children: React.ReactNode
}

export function AppointmentDetailsPopup({
  appointment,
  onEdit,
  onDelete,
  children
}: AppointmentDetailsPopupProps) {
  const [isOpen, setIsOpen] = useState(false)
  const router = useRouter()

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled':
        return 'bg-blue-100 text-blue-800'
      case 'completed':
        return 'bg-green-100 text-green-800'
      case 'cancelled':
        return 'bg-red-100 text-red-800'
      case 'no_show':
        return 'bg-yellow-100 text-yellow-800'
      case 'checked_in':
        return 'bg-purple-100 text-purple-800'
      case 'in_progress':
        return 'bg-indigo-100 text-indigo-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const formatStatus = (status: string) => {
    // Convert snake_case to Title Case and capitalize each word
    return status
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
  }

  const handlePatientClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (appointment.patient?.id) {
      router.push(`/patients/${appointment.patient.id}`)
    }
  }

  const handleProviderClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (appointment.provider?.id) {
      router.push(`/providers/${appointment.provider.id}`)
    }
  }

  const handleLocationClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (appointment.location?.id) {
      router.push(`/locations/${appointment.location.id}`)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <div className="cursor-pointer">{children}</div>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Appointment Details</span>
            <Badge className={getStatusColor(appointment.status)}>
              {formatStatus(appointment.status)}
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 pt-4">
          {/* Date and Time */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 flex-1">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">
                {format(parseISO(appointment.appointment_date), 'MMMM d, yyyy')}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span>
                {format(parseISO(appointment.appointment_date), 'h:mm a')}
                {appointment.duration_minutes && ` (${appointment.duration_minutes} min)`}
              </span>
            </div>
          </div>

          <Separator />

          {/* Patient Info */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Patient</span>
            </div>
            <button
              onClick={handlePatientClick}
              className="text-base font-medium hover:text-blue-600 transition-colors"
            >
              {appointment.patient?.full_name || 'Unknown Patient'}
            </button>
          </div>

          {/* Provider Info */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Stethoscope className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Provider</span>
            </div>
            <button
              onClick={handleProviderClick}
              className="text-base font-medium hover:text-blue-600 transition-colors"
            >
              {appointment.provider?.full_name || 'Unknown Provider'}
            </button>
          </div>

          {/* Location Info */}
          {appointment.location && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Location</span>
              </div>
              <button
                onClick={handleLocationClick}
                className="text-base font-medium hover:text-blue-600 transition-colors"
              >
                {appointment.location.name}
              </button>
            </div>
          )}

          <Separator />

          {/* Appointment Type and Reason */}
          <div className="space-y-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Type</span>
              </div>
              <span className="text-base font-medium">{appointment.appointment_type}</span>
            </div>

            {appointment.reason_for_visit && (
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <AlertCircle className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Reason for Visit</span>
                </div>
                <p className="text-sm">{appointment.reason_for_visit}</p>
              </div>
            )}
          </div>

          {/* Notes */}
          {appointment.notes && (
            <>
              <Separator />
              <div>
                <span className="text-sm text-muted-foreground">Notes</span>
                <p className="mt-1 text-sm whitespace-pre-wrap">{appointment.notes}</p>
              </div>
            </>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-4">
            <Button
              variant="outline"
              onClick={() => {
                setIsOpen(false)
                onEdit(appointment)
              }}
            >
              Edit
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (window.confirm('Are you sure you want to delete this appointment?')) {
                  setIsOpen(false)
                  onDelete(appointment.id)
                }
              }}
            >
              Delete
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

