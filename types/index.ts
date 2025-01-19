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

export interface User {
    id: string
    email: string
    organization_id: string
    role: string
    created_at: string
    updated_at: string
}

export interface Patient {
    id: string
    first_name: string
    last_name: string
    date_of_birth: string
    gender: string
    email?: string
    phone?: string
    address?: string
    created_at: string
    updated_at: string
    organization_id: string
}

export interface Vitals {
    id: string
    patient_id: string
    provider_id: string
    organization_id: string
    appointment_id: string
    clinical_note_id?: string
    temperature: number
    blood_pressure_systolic: number
    blood_pressure_diastolic: number
    heart_rate: number
    respiratory_rate: number
    oxygen_saturation: number
    height: number
    weight: number
    bmi: number
    pain_level: number
    blood_glucose: number
    notes?: string
    created_at: string
    updated_at: string
}

export interface VitalRanges {
    temperature: { min: 90, max: 110 }
    blood_pressure_systolic: { min: 60, max: 250 }
    blood_pressure_diastolic: { min: 40, max: 150 }
    heart_rate: { min: 30, max: 250 }
    respiratory_rate: { min: 8, max: 60 }
    oxygen_saturation: { min: 0, max: 100 }
    height: { min: 0, max: 300 }
    weight: { min: 0, max: 700 }
    pain_level: { min: 0, max: 10 }
    blood_glucose: { min: 20, max: 600 }
}

export interface ClinicalNoteVitals extends Vitals {
    timestamp: string
    recorded_by: string
}

export interface ClinicalNote {
  id: string
  patient_id: string
  provider_id: string
  note_type: string
  chief_complaint: string
  subjective: string
  objective: string
  assessment: string
  plan: string
  vitals?: ClinicalNoteVitals
  created_at: string
  updated_at: string
  status: 'draft' | 'completed'
  follow_up_date?: string
  diagnosis_codes?: string[]
  treatment_plan?: string
  medications?: string[]
  allergies?: string[]
  lab_orders?: string[]
  imaging_orders?: string[]
  referrals?: string[]
}

export interface Medication {
    id: string
    patient_id: string
    medication_name: string
    dosage: string
    frequency: string
    start_date: string
    end_date?: string
    notes?: string
    created_at: string
    updated_at: string
    organization_id: string
    prescribed_by: string
}

export interface Immunization {
    id: string
    patient_id: string
    vaccine_name: string
    date_administered: string
    provider: string
    lot_number?: string
    expiration_date?: string
    notes?: string
    created_at: string
    updated_at: string
    organization_id: string
    administered_by: string
}
