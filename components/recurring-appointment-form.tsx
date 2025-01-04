import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { createClient } from '@supabase/supabase-js'
import { toast } from '@/components/ui/use-toast'

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

interface RecurringAppointmentFormProps {
    appointment: {
        appointment_date: string
        duration_minutes: number
        patient_id: string
        provider_id: string
        location_id: string
        reason_for_visit: string
        visit_type: 'in_person' | 'video' | 'phone'
        appointment_type: string
        organization_id: string
    }
    onSuccess: () => void
}

type RecurringPattern = 'daily' | 'weekly' | 'monthly'

export function RecurringAppointmentForm({ appointment, onSuccess }: RecurringAppointmentFormProps) {
    const [isRecurring, setIsRecurring] = useState(false)
    const [pattern, setPattern] = useState<RecurringPattern>('weekly')
    const [occurrences, setOccurrences] = useState(4)
    const [isLoading, setIsLoading] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!isRecurring) return

        setIsLoading(true)
        const appointments = []
        const startDate = new Date(appointment.appointment_date)

        try {
            // Generate recurring appointments
            for (let i = 0; i < occurrences; i++) {
                const appointmentDate = new Date(startDate)

                if (pattern === 'daily') {
                    appointmentDate.setDate(appointmentDate.getDate() + i)
                } else if (pattern === 'weekly') {
                    appointmentDate.setDate(appointmentDate.getDate() + (i * 7))
                } else if (pattern === 'monthly') {
                    appointmentDate.setMonth(appointmentDate.getMonth() + i)
                }

                appointments.push({
                    ...appointment,
                    appointment_date: appointmentDate.toISOString(),
                    is_recurring: true,
                    recurring_pattern: pattern,
                    status: 'scheduled'
                })
            }

            // Insert all appointments
            const { error } = await supabase
                .from('appointments')
                .insert(appointments)

            if (error) throw error

            toast({
                title: 'Success',
                description: `Created ${occurrences} recurring appointments`
            })
            onSuccess()
        } catch (error) {
            console.error('Error creating recurring appointments:', error)
            toast({
                title: 'Error',
                description: 'Failed to create recurring appointments',
                variant: 'destructive'
            })
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Recurring Appointment</CardTitle>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="flex items-center space-x-2">
                        <Switch
                            id="recurring"
                            checked={isRecurring}
                            onCheckedChange={setIsRecurring}
                        />
                        <Label htmlFor="recurring">Make this a recurring appointment</Label>
                    </div>

                    {isRecurring && (
                        <>
                            <div className="space-y-2">
                                <Label htmlFor="pattern">Repeat Pattern</Label>
                                <Select
                                    value={pattern}
                                    onValueChange={(value) => setPattern(value as RecurringPattern)}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select pattern" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="daily">Daily</SelectItem>
                                        <SelectItem value="weekly">Weekly</SelectItem>
                                        <SelectItem value="monthly">Monthly</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="occurrences">Number of Appointments</Label>
                                <Input
                                    id="occurrences"
                                    type="number"
                                    min={2}
                                    max={52}
                                    value={occurrences}
                                    onChange={(e) => setOccurrences(parseInt(e.target.value))}
                                />
                                <p className="text-sm text-gray-500">
                                    This will create {occurrences} appointments {pattern === 'daily' ? 'days' : pattern === 'weekly' ? 'weeks' : 'months'} apart
                                </p>
                            </div>

                            <Button type="submit" disabled={isLoading}>
                                {isLoading ? 'Creating...' : 'Create Recurring Appointments'}
                            </Button>
                        </>
                    )}
                </form>
            </CardContent>
        </Card>
    )
}
