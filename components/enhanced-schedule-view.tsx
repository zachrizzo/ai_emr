'use client'

import React, { useMemo, useState } from 'react'
import { addDays, format, startOfWeek, startOfMonth, endOfWeek, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, parseISO, isToday } from 'date-fns'
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Appointment } from '@/types'
import { AppointmentDetailsPopup } from '@/components/appointment-details-popup'
import { MultiSelect } from '@/components/ui/multi-select'
import { useLocations } from '@/contexts/LocationContext'
import { useProviders } from '@/contexts/ProviderContext'

interface EnhancedScheduleViewProps {
  appointments: Appointment[]
  view: 'month' | 'week' | 'day'
  onAddAppointment: () => void
  onEditAppointment: (appointment: Appointment) => void
  onDeleteAppointment: (appointmentId: string) => void
  onPatientClick: (patientId: string) => void
  selectedProviders: string[]
  selectedLocations: string[]
  onSelectProviders: (providers: string[]) => void
  onSelectLocations: (locations: string[]) => void
}

export function EnhancedScheduleView({
  appointments,
  view,
  onAddAppointment,
  onEditAppointment,
  onDeleteAppointment,
  onPatientClick,
  selectedProviders,
  selectedLocations,
  onSelectProviders,
  onSelectLocations
}: EnhancedScheduleViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const { locations } = useLocations()
  const { providers } = useProviders()

  const providerOptions = useMemo(() => {
    return providers?.map(provider => ({
      value: provider.id,
      label: `${provider.first_name} ${provider.last_name}`
    })) || []
  }, [providers])

  const locationOptions = useMemo(() => {
    return locations?.map(location => ({
      value: location.id,
      label: location.name
    })) || []
  }, [locations])

  const filteredAppointments = useMemo(() => {
    return appointments.filter(appointment => {
      const providerMatch = selectedProviders.length === 0 ||
        (appointment.provider_id && selectedProviders.includes(appointment.provider_id))

      const locationMatch = selectedLocations.length === 0 ||
        (appointment.location_id && selectedLocations.includes(appointment.location_id))

      return providerMatch && locationMatch
    })
  }, [appointments, selectedProviders, selectedLocations])

  const handlePrevious = () => {
    setCurrentDate((prev) => {
      switch (view) {
        case 'month':
          return addDays(prev, -30)
        case 'week':
          return addDays(prev, -7)
        case 'day':
          return addDays(prev, -1)
        default:
          return prev
      }
    })
  }

  const handleNext = () => {
    setCurrentDate((prev) => {
      switch (view) {
        case 'month':
          return addDays(prev, 30)
        case 'week':
          return addDays(prev, 7)
        case 'day':
          return addDays(prev, 1)
        default:
          return prev
      }
    })
  }

  const handleToday = () => {
    setCurrentDate(new Date())
  }

  const getAppointmentColor = (appointmentType: string) => {
    const colors = [
      'bg-blue-200 hover:bg-blue-300',
      'bg-green-200 hover:bg-green-300',
      'bg-yellow-200 hover:bg-yellow-300',
      'bg-purple-200 hover:bg-purple-300',
      'bg-pink-200 hover:bg-pink-300',
      'bg-indigo-200 hover:bg-indigo-300',
    ]
    const index = (appointmentType || '').length % colors.length
    return colors[index]
  }

  const getPatientName = (appointment: Appointment) => {
    if (appointment.patient && typeof appointment.patient === 'object' &&
      'first_name' in appointment.patient && 'last_name' in appointment.patient) {
      return `${appointment.patient.first_name} ${appointment.patient.last_name}`
    }
    return 'Unknown Patient'
  }

  const renderAppointment = (appointment: Appointment) => (
    <div
      key={appointment.id}
      className={`text-xs p-2 mb-1 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-all duration-200 ${getAppointmentColor(appointment.appointment_type)}`}
    >
      <AppointmentDetailsPopup
        appointment={appointment}
        onEdit={onEditAppointment}
        onDelete={onDeleteAppointment}
      >
        <div
          className="font-semibold truncate hover:text-blue-600 cursor-pointer"
          onClick={(e) => {
            e.stopPropagation();
            if (appointment.patient_id) {
              onPatientClick(appointment.patient_id);
            }
          }}
        >
          {getPatientName(appointment)}
        </div>
        <div className="text-xs opacity-75 truncate flex items-center gap-2">
          <span className="font-medium">
            {appointment.appointment_date ? format(parseISO(appointment.appointment_date), 'HH:mm') : 'No Time'}
          </span>
          <span className="text-gray-500">•</span>
          <span className="italic">{appointment.appointment_type}</span>
        </div>
      </AppointmentDetailsPopup>
    </div>
  )

  const renderDayView = () => {
    const hours = Array.from({ length: 24 }, (_, i) => i)

    return (
      <div className="mt-4">
        <h3 className={`font-bold mb-2 ${isToday(currentDate) ? "text-blue-600" : ""}`}>
          {format(currentDate, 'EEEE, MMMM d, yyyy')}
        </h3>
        <div className="grid grid-cols-[auto,1fr] gap-2">
          {hours.map((hour) => (
            <React.Fragment key={hour}>
              <div className="text-right pr-2 py-2 text-sm text-gray-500">
                {format(new Date().setHours(hour, 0, 0, 0), 'h:mm a')}
              </div>
              <div className="border-t py-2 relative min-h-[3rem]">
                {filteredAppointments
                  .filter(appointment => {
                    const appointmentDate = parseISO(appointment.appointment_date)
                    return isSameDay(appointmentDate, currentDate) && appointmentDate.getHours() === hour
                  })
                  .map(renderAppointment)}
              </div>
            </React.Fragment>
          ))}
        </div>
      </div>
    )
  }

  const renderWeekView = () => {
    const weekStart = startOfWeek(currentDate)
    const weekEnd = endOfWeek(currentDate)
    const days = eachDayOfInterval({ start: weekStart, end: weekEnd })
    const hours = Array.from({ length: 24 }, (_, i) => i)

    return (
      <div className="mt-4 overflow-x-auto">
        <div className="inline-block min-w-full">
          <div className="grid grid-cols-[auto,repeat(7,1fr)] gap-2">
            <div className="sticky left-0 bg-white z-10"></div>
            {days.map((day) => (
              <div key={day.toString()} className={`text-center font-bold ${isToday(day) ? "text-blue-600" : ""}`}>
                {format(day, 'EEE d')}
              </div>
            ))}
            {hours.map((hour) => (
              <React.Fragment key={hour}>
                <div className="sticky left-0 bg-white z-10 text-right pr-2 py-2 text-sm text-gray-500">
                  {format(new Date().setHours(hour, 0, 0, 0), 'h:mm a')}
                </div>
                {days.map((day) => (
                  <div key={`${day}-${hour}`} className="border-t py-2 relative min-h-[3rem]">
                    {filteredAppointments
                      .filter(appointment => {
                        const appointmentDate = parseISO(appointment.appointment_date)
                        return isSameDay(appointmentDate, day) && appointmentDate.getHours() === hour
                      })
                      .map(renderAppointment)}
                  </div>
                ))}
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>
    )
  }

  const renderMonthView = () => {
    const monthStart = startOfMonth(currentDate)
    const monthEnd = endOfMonth(currentDate)
    const startDate = startOfWeek(monthStart)
    const endDate = endOfWeek(monthEnd)

    const dateFormat = "d"
    const rows = []

    let days: JSX.Element[] = []
    let day = startDate

    while (day <= endDate) {
      for (let i = 0; i < 7; i++) {
        const formattedDate = format(day, dateFormat)
        const cloneDay = day
        days.push(
          <div
            className={`border p-1 ${!isSameMonth(day, monthStart)
              ? "text-gray-400 bg-gray-50"
              : isToday(day)
                ? "bg-blue-100"
                : ""
              } min-h-[100px] overflow-y-auto`}
            key={day.toString()}
          >
            <span className={`text-sm font-bold ${isToday(day) ? "text-blue-600" : ""}`}>{formattedDate}</span>
            <div className="mt-1 space-y-1">
              {filteredAppointments
                .filter(appointment => isSameDay(parseISO(appointment.appointment_date), cloneDay))
                .map(renderAppointment)}
            </div>
          </div>
        )
        day = addDays(day, 1)
      }
      rows.push(
        <div className="grid grid-cols-7" key={day.toString()}>
          {days}
        </div>
      )
      days = []
    }
    return <div className="mt-4">{rows}</div>
  }

  return (
    <div>
      <div className="flex flex-col space-y-4 mb-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center space-x-2">
            <Button onClick={handlePrevious} size="icon" variant="outline">
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button onClick={handleNext} size="icon" variant="outline">
              <ChevronRight className="h-4 w-4" />
            </Button>
            <h2 className="text-xl font-bold">
              {format(
                currentDate,
                view === 'month'
                  ? 'MMMM yyyy'
                  : view === 'week'
                    ? "'Week of' MMM d, yyyy"
                    : 'EEEE, MMMM d, yyyy'
              )}
            </h2>
            <Button onClick={handleToday} variant="outline" size="sm">Today</Button>
          </div>
          <Button onClick={onAddAppointment}>
            <Plus className="mr-2 h-4 w-4" /> Add Appointment
          </Button>
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex-1 min-w-[250px] max-w-[400px]">
            <MultiSelect
              options={providerOptions}
              selected={selectedProviders}
              onChange={onSelectProviders}
              placeholder="Filter by provider(s)"
              className="w-full"
            />
          </div>
          <div className="flex-1 min-w-[250px] max-w-[400px]">
            <MultiSelect
              options={locationOptions}
              selected={selectedLocations}
              onChange={onSelectLocations}
              placeholder="Filter by location(s)"
              className="w-full"
            />
          </div>
        </div>
      </div>
      {view === 'month' && renderMonthView()}
      {view === 'week' && renderWeekView()}
      {view === 'day' && renderDayView()}
    </div>
  )
}

