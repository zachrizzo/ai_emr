export type NoteType = 'voice' | 'manual' | 'template' | 'ai_assisted';
export type NoteStatus = 'draft' | 'final' | 'signed' | 'amended';
export type SectionType = 'subjective' | 'objective' | 'assessment' | 'plan' | 'custom';
export type AccessAction = 'view' | 'edit' | 'sign' | 'print' | 'share';

export interface NoteTemplate {
  id: string;
  name: string;
  content: {
    subjective: string;
    objective: string;
    assessment: string;
    plan: string;
  };
  organization_id: string;
}

export interface ClinicalNote {
  id: string;
  patient_id: string;
  provider_id: string;
  appointment_id?: string;
  organization_id: string;
  content: any; // Rich text content
  type: NoteType;
  status: NoteStatus;
  version: number;
  parent_note_id?: string;
  template_id?: string;
  metadata?: {
    specialty?: string;
    templateType?: string;
    diagnosis?: string[];
    procedures?: string[];
    vitals?: {
      bloodPressure?: string;
      heartRate?: string;
      temperature?: string;
      respiratoryRate?: string;
      oxygenSaturation?: string;
    };
    customFields?: Record<string, any>;
  };
  tags: string[];
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
  signed_at?: string;
  signed_by?: string;
  sections?: NoteSection[];
  attachments?: NoteAttachment[];
  comments?: NoteComment[];
  voice_recording?: VoiceRecording;
  provider?: {
    id: string;
    full_name: string;
  };
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
  appointment_id?: string;
  organization_id: string;
  content: any;
  type: NoteType;
  template_id?: string;
  metadata?: ClinicalNote['metadata'];
  tags: string[];
  sections?: Omit<NoteSection, 'id' | 'note_id' | 'created_at' | 'updated_at'>[];
}

export interface UpdateClinicalNoteParams {
  content?: any;
  metadata?: ClinicalNote['metadata'];
  tags?: string[];
  sections?: Omit<NoteSection, 'id' | 'note_id' | 'created_at' | 'updated_at'>[];
  status?: NoteStatus;
}

export interface SessionNote {
  id: string;
  patient_id: string;
  provider_id: string;
  appointment_id?: string;
  organization_id: string;
  content: {
    subjective: string;
    objective: string;
    assessment: string;
    plan: string;
  };
  type?: 'voice' | 'manual' | 'template' | 'ai_assisted';
  status?: 'draft' | 'final' | 'signed' | 'amended';
  version?: number;
  template_id?: string;
  created_at: string;
  updated_at: string;
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
