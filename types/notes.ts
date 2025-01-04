export type NoteType = 'voice' | 'manual' | 'template' | 'ai_assisted';
export type NoteStatus = 'draft' | 'final' | 'signed' | 'amended';
export type SectionType = 'subjective' | 'objective' | 'assessment' | 'plan' | 'custom';
export type AccessAction = 'view' | 'edit' | 'sign' | 'print' | 'share';

export interface NoteTemplate {
  id: string;
  name: string;
  content: string;
  specialty?: string;
  category?: string;
  organization_id: string;
  created_by: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
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
