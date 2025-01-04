export interface ClinicalNote {
  id: string;
  content: string;
  patient_id: string;
  provider_id: string;
  recorded_at: string;
  updated_at: string;
  type: "voice" | "manual" | "template";
  tags: string[];
  organization_id: string;
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
  };
}

export interface CreateClinicalNoteParams {
  content: string;
  type: 'voice' | 'manual' | 'template';
  tags: string[];
  provider_id: string;
  patient_id: string;
  organization_id: string;
  specialty?: string;
  template_type?: string;
  diagnosis?: string[];
  procedures?: string[];
  vitals?: {
    bloodPressure?: string;
    heartRate?: string;
    temperature?: string;
    respiratoryRate?: string;
    oxygenSaturation?: string;
  };
}
