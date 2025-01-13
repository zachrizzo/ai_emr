export * from './notes'

// Re-export types that are specific to this file
export interface AppointmentDetails {
    id: string
    appointment_date: string
    patient_id: string
    provider_id: string
    location_id: string
    reason_for_visit: string
    duration_minutes: number
    status: string
    appointment_type: string
    notes?: string
    visit_type: string
    organization_id: string
    is_recurring: boolean
}
