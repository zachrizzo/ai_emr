'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Calendar as CalendarIcon, Clock } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';

// Mock data
const mockAppointments = [
    {
        id: 1,
        date: '2024-01-15',
        time: '10:30 AM',
        doctor: 'Dr. Michael Smith',
        type: 'Annual Physical',
        status: 'upcoming',
    },
    {
        id: 2,
        date: '2024-01-20',
        time: '2:00 PM',
        doctor: 'Dr. Emily Chen',
        type: 'Follow-up',
        status: 'upcoming',
    },
    {
        id: 3,
        date: '2023-12-20',
        time: '11:00 AM',
        doctor: 'Dr. Michael Smith',
        type: 'Regular Checkup',
        status: 'completed',
    },
];

const appointmentTypes = [
    { id: 1, name: 'Annual Physical', duration: 60 },
    { id: 2, name: 'Follow-up', duration: 30 },
    { id: 3, name: 'Consultation', duration: 45 },
    { id: 4, name: 'Vaccination', duration: 15 },
];

const availableTimes = [
    '9:00 AM',
    '9:30 AM',
    '10:00 AM',
    '10:30 AM',
    '11:00 AM',
    '2:00 PM',
    '2:30 PM',
    '3:00 PM',
];

const doctors = [
    { id: 1, name: 'Dr. Michael Smith', specialty: 'Primary Care' },
    { id: 2, name: 'Dr. Emily Chen', specialty: 'Internal Medicine' },
    { id: 3, name: 'Dr. Sarah Wilson', specialty: 'Cardiology' },
];

interface AppointmentFormData {
    doctorId: string;
    appointmentType: string;
    date: Date | undefined;
    time: string;
}

export default function AppointmentsComponent() {
    const [appointments, setAppointments] = useState(mockAppointments);
    const [showNewAppointment, setShowNewAppointment] = useState(false);
    const [formData, setFormData] = useState<AppointmentFormData>({
        doctorId: '',
        appointmentType: '',
        date: undefined,
        time: '',
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleInputChange = (field: keyof AppointmentFormData, value: any) => {
        setFormData((prev) => ({
            ...prev,
            [field]: value,
        }));
    };

    const handleAppointmentSubmit = async () => {
        if (!formData.doctorId || !formData.appointmentType || !formData.date || !formData.time) {
            toast({
                title: 'Missing Information',
                description: 'Please fill in all required fields.',
                variant: 'destructive',
            });
            return;
        }

        setIsSubmitting(true);
        try {
            // Mock API call - replace with actual API integration
            const selectedDoctor = doctors.find((d) => d.id.toString() === formData.doctorId);
            const newAppointment = {
                id: appointments.length + 1,
                date: formData.date.toISOString().split('T')[0],
                time: formData.time,
                doctor: selectedDoctor?.name || '',
                type: appointmentTypes.find((t) => t.id.toString() === formData.appointmentType)?.name || '',
                status: 'upcoming',
            };

            // Simulate API delay
            await new Promise((resolve) => setTimeout(resolve, 1000));

            setAppointments((prev) => [...prev, newAppointment]);
            setShowNewAppointment(false);
            setFormData({
                doctorId: '',
                appointmentType: '',
                date: undefined,
                time: '',
            });

            toast({
                title: 'Success',
                description: 'Your appointment has been scheduled successfully.',
            });
        } catch (error) {
            toast({
                title: 'Error',
                description: 'Failed to schedule appointment. Please try again.',
                variant: 'destructive',
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleCancelAppointment = async (appointmentId: number) => {
        try {
            // Mock API call - replace with actual API integration
            await new Promise((resolve) => setTimeout(resolve, 500));

            setAppointments((prev) =>
                prev.filter((apt) => apt.id !== appointmentId)
            );

            toast({
                title: 'Appointment Cancelled',
                description: 'Your appointment has been cancelled successfully.',
            });
        } catch (error) {
            toast({
                title: 'Error',
                description: 'Failed to cancel appointment. Please try again.',
                variant: 'destructive',
            });
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold">Appointments</h2>
                <Dialog open={showNewAppointment} onOpenChange={setShowNewAppointment}>
                    <DialogTrigger asChild>
                        <Button>Schedule New Appointment</Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[425px]">
                        <DialogHeader>
                            <DialogTitle>Schedule Appointment</DialogTitle>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="grid gap-2">
                                <label className="text-sm font-medium">Appointment Type</label>
                                <Select
                                    value={formData.appointmentType}
                                    onValueChange={(value) => handleInputChange('appointmentType', value)}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select type of appointment" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {appointmentTypes.map((type) => (
                                            <SelectItem key={type.id} value={type.id.toString()}>
                                                {type.name} ({type.duration} min)
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="grid gap-2">
                                <label className="text-sm font-medium">Select Doctor</label>
                                <Select
                                    value={formData.doctorId}
                                    onValueChange={(value) => handleInputChange('doctorId', value)}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Choose a doctor" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {doctors.map((doctor) => (
                                            <SelectItem key={doctor.id} value={doctor.id.toString()}>
                                                {doctor.name} - {doctor.specialty}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="grid gap-2">
                                <label className="text-sm font-medium">Select Date</label>
                                <Calendar
                                    mode="single"
                                    selected={formData.date}
                                    onSelect={(date) => handleInputChange('date', date)}
                                    className="rounded-md border"
                                    disabled={(date) => date < new Date() || date.getDay() === 0 || date.getDay() === 6}
                                />
                            </div>
                            <div className="grid gap-2">
                                <label className="text-sm font-medium">Available Times</label>
                                <Select
                                    value={formData.time}
                                    onValueChange={(value) => handleInputChange('time', value)}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Choose a time" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {availableTimes.map((time) => (
                                            <SelectItem key={time} value={time}>
                                                {time}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <Button
                                onClick={handleAppointmentSubmit}
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? 'Scheduling...' : 'Schedule Appointment'}
                            </Button>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="grid gap-4">
                <Card>
                    <CardHeader>
                        <h3 className="text-lg font-semibold">Upcoming Appointments</h3>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {appointments
                                .filter((apt) => apt.status === 'upcoming')
                                .map((appointment) => (
                                    <div
                                        key={appointment.id}
                                        className="flex items-center justify-between p-4 bg-muted rounded-lg"
                                    >
                                        <div className="flex items-start gap-4">
                                            <div className="flex flex-col items-center justify-center bg-primary/10 p-3 rounded-lg">
                                                <CalendarIcon className="h-5 w-5 text-primary" />
                                                <span className="text-xs font-medium mt-1">
                                                    {new Date(appointment.date).toLocaleDateString('en-US', {
                                                        month: 'short',
                                                        day: 'numeric',
                                                    })}
                                                </span>
                                            </div>
                                            <div>
                                                <h4 className="font-medium">{appointment.type}</h4>
                                                <p className="text-sm text-muted-foreground">
                                                    {appointment.doctor}
                                                </p>
                                                <div className="flex items-center gap-1 mt-1 text-sm text-muted-foreground">
                                                    <Clock className="h-4 w-4" />
                                                    <span>{appointment.time}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="space-x-2">
                                            <Button variant="outline" size="sm">
                                                Reschedule
                                            </Button>
                                            <Button
                                                variant="destructive"
                                                size="sm"
                                                onClick={() => handleCancelAppointment(appointment.id)}
                                            >
                                                Cancel
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <h3 className="text-lg font-semibold">Past Appointments</h3>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {appointments
                                .filter((apt) => apt.status === 'completed')
                                .map((appointment) => (
                                    <div
                                        key={appointment.id}
                                        className="flex items-center justify-between p-4 bg-muted rounded-lg"
                                    >
                                        <div className="flex items-start gap-4">
                                            <div className="flex flex-col items-center justify-center bg-primary/10 p-3 rounded-lg">
                                                <CalendarIcon className="h-5 w-5 text-primary" />
                                                <span className="text-xs font-medium mt-1">
                                                    {new Date(appointment.date).toLocaleDateString('en-US', {
                                                        month: 'short',
                                                        day: 'numeric',
                                                    })}
                                                </span>
                                            </div>
                                            <div>
                                                <h4 className="font-medium">{appointment.type}</h4>
                                                <p className="text-sm text-muted-foreground">
                                                    {appointment.doctor}
                                                </p>
                                                <div className="flex items-center gap-1 mt-1 text-sm text-muted-foreground">
                                                    <Clock className="h-4 w-4" />
                                                    <span>{appointment.time}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <Button variant="outline" size="sm">
                                            View Summary
                                        </Button>
                                    </div>
                                ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
