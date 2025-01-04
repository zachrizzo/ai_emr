export interface PhoneNumbers {
  home: string;
  work: string;
  mobile: string;
}

export interface EmergencyContact {
  name: string;
  relationship: string;
  phoneNumber: string;
}

export interface Insurance {
  provider: string;
  policyNumber: string;
  groupNumber: string;
  subscriberName: string;
  relationshipToSubscriber: string;
}

export interface MedicalHistory {
  pastMedicalConditions: string[];
  surgicalHistory: string[];
  hospitalizations: { date: string; reason: string }[];
  familyMedicalHistory: string[];
}

export interface Medication {
  name: string;
  dosage: string;
  frequency: string;
}

export interface LifestyleInformation {
  smokingStatus: 'current' | 'former' | 'never';
  alcoholUse: string;
  drugUse: string;
  dietAndExercise: string;
  occupation: string;
  stressLevels: string;
  mentalHealthStatus: string;
}

export interface Symptom {
  description: string;
  duration: string;
  severity: string;
}

export interface VitalSigns {
  height: number;
  weight: number;
  bmi: number;
  bloodPressure: string;
  heartRate: number;
  respiratoryRate: number;
  temperature: number;
  oxygenSaturation: number;
}

export interface ConsentDocument {
  type: string;
  signedDate: string;
}

export interface Visit {
  date: string;
  time: string;
  provider: string;
  notes: string;
  diagnosis: string[];
  recommendedTests: string[];
  followUpPlan: string;
}

export interface PatientPreferences {
  preferredPharmacy: string;
  languagePreference: string;
  preferredCommunicationMethod: 'phone' | 'email' | 'text';
  culturalConsiderations: string;
}

export interface PediatricInformation {
  parentGuardianName: string;
  birthHistory: string;
  developmentalMilestones: string[];
  schoolPerformance: string;
}

export interface Document {
  id: string;
  name: string;
  type: string;
  uploadDate: string;
  file: File | null;
}

export interface Appointment {
  id: string;
  patientId: string;
  date: string;
  time: string;
  duration: number; // in minutes
  type: string;
  notes: string;
}

export interface Patient {
  id: string;
  personalInfo: {
    fullName: string;
    dateOfBirth: string;
    gender: string;
    address: string;
    phoneNumbers: {
      home: string;
      work: string;
      mobile: string;
    };
    email: string;
    emergencyContact: {
      name: string;
      relationship: string;
      phoneNumber: string;
    };
  };
  insuranceInfo: Insurance[];
  medicalHistory: {
    pastMedicalConditions: string[];
    surgicalHistory: string[];
    hospitalizations: { date: string; reason: string }[];
    familyMedicalHistory: string[];
  };
  allergies: string[];
  currentMedications: Medication[];
  immunizationRecords: string[];
  previousDoctors: string[];
  lifestyleInfo: {
    smokingStatus: 'current' | 'former' | 'never';
    alcoholUse: string;
    drugUse: string;
    dietAndExercise: string;
    occupation: string;
    stressLevels: string;
    mentalHealthStatus: string;
  };
  currentSymptoms: Symptom[];
  vitalSigns: {
    height: number;
    weight: number;
    bmi: number;
    bloodPressure: string;
    heartRate: number;
    respiratoryRate: number;
    temperature: number;
    oxygenSaturation: number;
  };
  consentDocuments: {
    type: string;
    signedDate: string;
  }[];
  visits: Visit[];
  preferences: {
    preferredPharmacy: string;
    languagePreference: string;
    preferredCommunicationMethod: 'phone' | 'email' | 'text';
    culturalConsiderations: string;
  };
  documents: Document[];
}

