export interface Patient {
  id: string;
  first_name: string;
  last_name: string;
  date_of_birth: string;
  gender: string;
  address: string;
  phone_number: string;
  email: string;
  preferred_language: string;
  preferred_communication: string;
  cultural_considerations: string;
  created_at: string;
  organization_id: string;
}

export interface Insurance {
  id: number;
  patient_id: string;
  provider_name: string;
  policy_number: string;
  coverage_details: any; // You might want to define a more specific type for this
  expiration_date: string;
  created_at: string;
  updated_at: string;
  organization_id: string;
  created_by: string;
}

export interface MedicalHistory {
  id: string;
  patient_id: string;
  condition_name: string;
  condition_type: string;
  severity: string;
  onset_date: string;
  resolution_date: string | null;
  is_active: boolean;
  family_member: string | null;
  notes: string;
  date_recorded: string;
}

export interface Lifestyle {
  id: string;
  patient_id: string;
  smoking_status: string;
  alcohol_use: string;
  drug_use: string;
  diet_preferences: string;
  exercise_frequency: string;
  exercise_type: string;
  stress_level: string;
  sleep_duration_hours: number;
  sleep_quality: string;
  mental_health_status: string;
  occupation: string;
  work_hours_per_week: number;
  exposure_to_toxins: boolean;
  hobbies_and_interests: string;
  social_support_level: string;
  screen_time_hours: number;
  hydration_level: string;
  notes: string;
}

export interface Appointment {
  id: string;
  patient_id: string;
  provider_id: string;
  location_id: string | null;
  appointment_date: string;
  appointment_type: string;
  status: "scheduled" | "checked_in" | "in_progress" | "completed" | "cancelled" | "no_show";
  reason_for_visit: string;
  duration_minutes: number;
  notes: string;
  created_at: string;
  updated_at: string;
  visit_type: 'in_person' | 'video' | 'phone';
  organization_id: string;
  patient?: {
    id: string;
    first_name: string;
    last_name: string;
  };
  provider?: {
    id: string;
    first_name: string;
    last_name: string;
  };
  location?: {
    id: string;
    name: string;
  };
}

export interface Symptom {
  id: string;
  appointment_id: string;
  symptom_description: string;
  severity_level: string;
  duration: string;
}

export interface VitalSigns {
  id: string;
  appointment_id: string;
  height_cm: number;
  weight_kg: number;
  bmi: number;
  blood_pressure: string;
  heart_rate: number;
  respiratory_rate: number;
  temperature_celsius: number;
  oxygen_saturation: number;
}

export interface ConsentForm {
  id: string;
  patient_id: string;
  form_type: string;
  signed_date: string;
  notes: string;
}

export interface Medication {
  id: string;
  patient_id: string;
  medication_name: string;
  dosage: string;
  frequency: string;
  start_date: string;
  end_date: string;
}

export interface Immunization {
  id: string;
  patient_id: string;
  vaccine_name: string;
  date_administered: string;
  provider: string;
  notes: string;
}

export interface EmergencyContact {
  id: string | null; // Change this to allow null for new contacts
  patient_id: string;
  organization_id: string;
  name: string;
  relationship: string;
  phone_number: string;
}

export interface PatientDocument {
  id: string;
  patient_id: string;
  file_name: string;
  file_type: string;
  upload_date: string;
  file_url: string;
}

export interface Provider {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  specialty: string;
  phone_number?: string;
  status: "Active" | "Inactive";
  location_id?: string;
  organization_id: string;
  deleted_at?: string | null;
}

export interface Location {
  id: string;
  name: string;
  address: string;
  phone_number?: string;
  email?: string;
  status: "Active" | "Inactive";
  organization_id: string;
  deleted_at?: string | null;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: "Todo" | "In Progress" | "Completed";
  assignee: string;
  dueDate?: string;
  priority?: "Low" | "Medium" | "High";
  progress?: number;
  tags?: string[];
}

export interface FormSubmission {
  id: string;
  created_at: string;
  deleted_at: string | null;
  archived_at: string | null;
  form_data: Array<{
    question: string;
    answer: string | boolean | number;
  }>;
  form_id: string;
  assigned_form_id: string;
  organization_id: string;
  patient_id: string;
  status: string;
  assigned_documents?: {
    id: string;
    patient_id: string;
    organization_id: string;
    document_templates: {
      name: string;
      description: string;
    };
  };
}

export interface AppointmentDetails {
  id: string
  appointment_date: string
  patient_id: string
  provider_id: string
  location_id: string | null
  reason_for_visit: string
  diagnosis?: string
  follow_up_plan?: string
  notes?: string
  duration_minutes: number
  status: 'scheduled' | 'checked_in' | 'in_progress' | 'completed' | 'cancelled' | 'no_show'
  appointment_type: string
  visit_type: 'in_person' | 'video' | 'phone'
  organization_id: string
  is_recurring?: boolean
  recurring_pattern?: string
}
