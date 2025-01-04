'use client'

import { useState, useMemo } from 'react'
import { addDays, format, startOfWeek, startOfMonth, endOfWeek, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, parse, isToday } from 'date-fns'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Appointment, Provider, Location } from '@/types'
import { AppointmentDetailsPopup } from './appointment-details-popup'

interface ScheduleViewProps {
  appointments: (Appointment & { id: string })[]
  providers: Provider[]
  locations: Location[]
  selectedProvider: string
  selectedLocation: string | null
  onSelectProvider: (providerId: string) => void
  onSelectLocation: (locationId: string | null) => void
  onAddAppointment: () => void
  onEditAppointment: (appointment: Appointment) => void
  onDeleteAppointment: (appointmentId: string) => void
}

const appointmentColors: { [key: string]: string } = {
  'Check-up': 'bg-blue-200',
  'Follow-up': 'bg-green-200',
  'Consultation': 'bg-yellow-200',
  'Procedure': 'bg-purple-200',
  'default': 'bg-gray-200'
}

export function ScheduleView({ 
  appointments, 
  providers, 
  locations,
  selectedProvider, 
  selectedLocation,
  onSelectProvider, 
  onSelectLocation,
  onAddAppointment,
  onEditAppointment,
  onDeleteAppointment
}: ScheduleViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [view, setView] = useState<'month' | 'week' | 'day'>('month')

  const filteredAppointments = useMemo(() => 
    appointments.filter(appointment => 
      appointment.provider.id === selectedProvider && 
      (selectedLocation === null || 
       (appointment.location && appointment.location.id === selectedLocation))
  ), [appointments, selectedProvider, selectedLocation])

  const handlePrevious = () => {
    setCurrentDate((prev) => {
      switch (view) {
        case 'month':
          return addDays(prev, -30)
        case 'week':
          return addDays(prev, -7)
        case 'day':
          return addDays(prev, -1)
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
      }
    })
  }

  const handleToday = () => {
    setCurrentDate(new Date())
  }

  const renderAppointment = (appointment: Appointment & { id: string }) => (
    <AppointmentDetailsPopup
      key={appointment.id}
      appointment={appointment}
      onEdit={onEditAppointment}
      onDelete={onDeleteAppointment}
    />
  )

  const renderMonthView = () => {
    const monthStart = startOfMonth(currentDate)
    const monthEnd = endOfMonth(currentDate)
    const startDate = startOfWeek(monthStart)
    const endDate = endOfWeek(monthEnd)

    const dateFormat = "d"
    const rows = []

    let days = []
    let day = startDate
    let formattedDate = ""

    while (day <= endDate) {
      for (let i = 0; i < 7; i++) {
        formattedDate = format(day, dateFormat)
        const cloneDay = day
        days.push(
          <div
            className={`border p-2 ${
              !isSameMonth(day, monthStart)
                ? "text-gray-400 bg-gray-50"
                : isToday(day)
                ? "bg-blue-100"
                : ""
            } min-h-[100px]`}
            key={day.toString()}
          >
            <span className={`text-sm font-bold ${isToday(day) ? "text-blue-600" : ""}`}>{formattedDate}</span>
            <div className="mt-1 space-y-1 max-h-[80px] overflow-y-auto">
              {filteredAppointments
                .filter(appointment => isSameDay(parse(appointment.date, 'yyyy-MM-dd', new Date()), cloneDay))
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

  const renderWeekView = () => {
    const weekStart = startOfWeek(currentDate)
    const weekEnd = endOfWeek(currentDate)
    const days = eachDayOfInterval({ start: weekStart, end: weekEnd })

    return (
      <div className="mt-4 grid grid-cols-7 gap-2">
        {days.map((day) => (
          <div key={day.toString()} className={`border p-2 ${isToday(day) ? "bg-blue-100" : ""}`}>
            <div className={`font-bold ${isToday(day) ? "text-blue-600" : ""}`}>{format(day, 'EEE d')}</div>
            <div className="mt-2 space-y-1">
              {filteredAppointments
                .filter(appointment => isSameDay(parse(appointment.date, 'yyyy-MM-dd', new Date()), day))
                .map(renderAppointment)}
            </div>
          </div>
        ))}
      </div>
    )
  }

  const renderDayView = () => {
    const hours = Array.from({ length: 24 }, (_, i) => i)

    return (
      <div className="mt-4">
        <h3 className={`font-bold mb-2 ${isToday(currentDate) ? "text-blue-600" : ""}`}>
          {format(currentDate, 'EEEE, MMMM d, yyyy')}
        </h3>
        <div className="grid grid-cols-[100px_1fr] gap-2">
          {hours.map((hour) => (
            <React.Fragment key={hour}>
              <div className="text-right pr-2 py-2 text-sm text-gray-500">
                {format(new Date().setHours(hour, 0, 0, 0), 'h:mm a')}
              </div>
              <div className="border-t py-2">
                {filteredAppointments
                  .filter(appointment => {
                    const appointmentHour = parseInt(appointment.time.split(':')[0], 10)
                    return isSameDay(parse(appointment.date, 'yyyy-MM-dd', new Date()), currentDate) && appointmentHour === hour
                  })
                  .map(renderAppointment)}
              </div>
            </React.Fragment>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-center mb-4 space-y-2 sm:space-y-0">
        <div className="flex items-center space-x-2">
          <Button onClick={handlePrevious} size="icon" variant="outline">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button onClick={handleNext} size="icon" variant="outline">
            <ChevronRight className="h-4 w-4" />
          </Button>
          <h2 className="text-xl font-bold">
            {format(currentDate, view === 'month' ? 'MMMM yyyy' : view === 'week' ? "'Week of' MMM d, yyyy" : 'EEEE, MMMM d, yyyy')}
          </h2>
          <Button onClick={handleToday} variant="outline" size="sm">Today</Button>
        </div>
        <div className="flex items-center space-x-2">
          <Select value={view} onValueChange={(value) => setView(value as 'month' | 'week' | 'day')}>
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="Select view" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="month">Month</SelectItem>
              <SelectItem value="week">Week</SelectItem>
              <SelectItem value="day">Day</SelectItem>
            </SelectContent>
          </Select>
          <Select value={selectedProvider} onValueChange={onSelectProvider}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select provider" />
            </SelectTrigger>
            <SelectContent>
              {providers.map((provider) => (
                <SelectItem key={provider.id} value={provider.id}>
                  {provider.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select 
            value={selectedLocation || 'all-locations'} 
            onValueChange={(value) => onSelectLocation(value === 'all-locations' ? null : value)}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select location" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all-locations">All Locations</SelectItem>
              {locations.map((location) => (
                <SelectItem key={location.id} value={location.id}>
                  {location.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={onAddAppointment}>Add Appointment</Button>
        </div>
      </div>
      {view === 'month' && renderMonthView()}
      {view === 'week' && renderWeekView()}
      {view === 'day' && renderDayView()}
    </div>
  )
}

