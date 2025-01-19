export type NoteType = 'voice' | 'manual' | 'template' | 'ai_assisted';
export type NoteStatus = 'draft' | 'completed' | 'pending' | 'archived';
export type SectionType = 'subjective' | 'objective' | 'assessment' | 'plan' | 'custom';
export type AccessAction = 'view' | 'edit' | 'sign' | 'print' | 'share';

export interface NoteTemplate {
  id: string;
  name: string;
  description?: string;
  content: {
    subjective: string;
    objective: string;
    assessment: string;
    plan: string;
  };
  organization_id: string;
  created_at: string;
  updated_at: string;
  is_active: boolean;
}

export interface NoteContent {
  subjective: string;
  objective: string;
  assessment: string;
  plan: string;
}

export interface ClinicalNote {
  id: string;
  patient_id: string;
  provider_id: string;
  organization_id: string;
  appointment_id: string;
  created_at: string;
  updated_at: string;
  content: {
    subjective: string;
    objective: string;
    assessment: string;
    plan: string;
  };
  type: 'manual' | 'ai' | 'voice';
  status: 'draft' | 'completed';
  metadata?: any;
  tags?: string[];
}

export interface NoteSection {
  id: string;
  note_id: string;
  section_type: SectionType;
  title?: string;
  content: any;
  order_index: number;
  created_at: string;
  updated_at: string;
}

export interface VoiceRecording {
  id: string;
  note_id: string;
  file_path: string;
  duration?: number;
  transcription?: string;
  status: 'pending' | 'processing' | 'completed' | 'error';
  created_at: string;
  updated_at: string;
}

export interface NoteAttachment {
  id: string;
  note_id: string;
  file_name: string;
  file_type: string;
  file_path: string;
  file_size: number;
  created_at: string;
}

export interface NoteAccessHistory {
  id: string;
  note_id: string;
  user_id: string;
  action: AccessAction;
  ip_address?: string;
  user_agent?: string;
  accessed_at: string;
}

export interface NoteComment {
  id: string;
  note_id: string;
  user_id: string;
  content: string;
  parent_comment_id?: string;
  is_resolved: boolean;
  created_at: string;
  updated_at: string;
  user?: {
    id: string;
    full_name: string;
  };
}

export interface AIAssistance {
  id: string;
  note_id: string;
  prompt: string;
  response: string;
  model_version?: string;
  tokens_used?: number;
  created_at: string;
}

export interface CreateClinicalNoteParams {
  patient_id: string;
  provider_id: string;
  organization_id: string;
  appointment_id: string;
  content: {
    subjective: string;
    objective: string;
    assessment: string;
    plan: string;
  };
  type: 'manual' | 'ai' | 'voice';
  status: 'draft' | 'completed';
  metadata?: any;
  tags?: string[];
  template_id?: string;
}

export interface UpdateClinicalNoteParams {
  content: {
    subjective: string;
    objective: string;
    assessment: string;
    plan: string;
  };
  status: 'draft' | 'completed';
  updated_at: string;
  metadata?: any;
  tags?: string[];
}

export interface SessionNote extends ClinicalNote {
  visit_type?: string;
  chief_complaint?: string;
  diagnosis?: string[];
  treatment_plan?: string;
}

export interface Appointment {
  id: string;
  patient_id: string;
  provider_id: string;
  location_id: string;
  appointment_date: string;
  appointment_time: string;
  visit_type: string;
  reason_for_visit: string;
  duration_minutes: number;
  status: string;
  appointment_type: string;
  notes?: string;
  created_at: string;
  updated_at: string;
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

export interface Patient {
  id: string;
  first_name: string;
  last_name: string;
  date_of_birth: string;
  gender: string;
  age?: number;
  medical_history?: any[];
  medications?: any[];
}

export interface CreateSessionNoteParams {
  patient_id: string;
  provider_id: string;
  appointment_id?: string;
  organization_id: string;
  content: SessionNote['content'];
  template_id?: string;
}

export interface UpdateSessionNoteParams {
  content?: SessionNote['content'];
  status?: SessionNote['status'];
  version?: number;
  template_id?: string;
}
