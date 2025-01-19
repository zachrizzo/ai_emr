'use client'

import { format } from 'date-fns'
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CalendarDays, Clock, User, FileText } from 'lucide-react'

interface AppointmentDetailsProps {
    appointment: {
        id: string
        appointment_date: string
        appointment_time: string
        reason_for_visit: string
        status: string
        provider_name?: string
        appointment_type?: string
        duration?: number
    }
}

export function AppointmentDetails({ appointment }: AppointmentDetailsProps) {
    return (
        <Card className="mb-6">
            <CardContent className="p-6">
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-4">
                        <div className="flex items-center gap-2">
                            <CalendarDays className="h-4 w-4 text-muted-foreground" />
                            <div>
                                <p className="text-sm text-muted-foreground">Date</p>
                                <p className="font-medium">
                                    {format(new Date(appointment.appointment_date), 'MMMM d, yyyy')}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-muted-foreground" />
                            <div>
                                <p className="text-sm text-muted-foreground">Time</p>
                                <p className="font-medium">{appointment.appointment_time}</p>
                            </div>
                        </div>
                    </div>
                    <div className="space-y-4">
                        {appointment.provider_name && (
                            <div className="flex items-center gap-2">
                                <User className="h-4 w-4 text-muted-foreground" />
                                <div>
                                    <p className="text-sm text-muted-foreground">Provider</p>
                                    <p className="font-medium">{appointment.provider_name}</p>
                                </div>
                            </div>
                        )}
                        <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4 text-muted-foreground" />
                            <div>
                                <p className="text-sm text-muted-foreground">Reason for Visit</p>
                                <p className="font-medium">{appointment.reason_for_visit}</p>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="flex gap-2 mt-4">
                    <Badge variant={appointment.status === 'completed' ? 'default' : 'secondary'}>
                        {appointment.status}
                    </Badge>
                    {appointment.appointment_type && (
                        <Badge variant="outline">{appointment.appointment_type}</Badge>
                    )}
                    {appointment.duration && (
                        <Badge variant="outline">{appointment.duration} minutes</Badge>
                    )}
                </div>
            </CardContent>
        </Card>
    )
}
