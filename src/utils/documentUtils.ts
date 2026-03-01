import {
  PatientDocument,
  VACCINES,
  createEmptyObstetricOutcomes,
  generateId as typeGenerateId
} from '../types';

export function createEmptyDocument(): PatientDocument {
  const now = new Date().toISOString();

  return {
    id: generateId(),
    // Patient Information
    patientName: '',
    birthday: '',
    address: '',
    contactNumbers: '',
    emergencyContacts: [],

    // Obstetric History
    gravida: undefined,
    para: undefined,
    obstetricOutcomes: createEmptyObstetricOutcomes(),
    previousPregnancies: [],

    // Current Pregnancy
    lmp: '',
    edd: '',
    currentPregnancyRecords: [],
    screeningLabs: [],

    // General Medical & Surgical History
    allergies: '',
    medicalConditions: '',
    surgicalHistory: [],
    medication: '',
    dosage: '',
    socialHistory: '',

    // Labor, Delivery & Postpartum Notes
    laborDeliveryPostpartum: undefined,

    // Clinical & Administrative Documentation
    clinicalDocumentation: [],

    // Follow-up and Immunization
    followUpDates: [],
    immunizations: VACCINES.map(vaccine => ({
      vaccine,
      first: '',
      second: '',
      third: '',
      boosters: []
    })),

    // Legacy fields (kept for backward compatibility)
    gender: 'F',
    nickname: '',
    guardianPhone: '',
    smsConsent: false,
    order: '',
    religion: '',
    nationality: '',
    referredBy: '',
    prenatalBirthHistory: '',
    manner: '',
    birthplace: '',
    gestationalAge: '',
    apgar: '',
    bloodType: '',
    momBloodType: '',
    dadBloodType: '',
    birthWeight: '',
    birthLength: '',
    headCircumference: '',
    chestCircumference: '',
    abdominalCircumference: '',
    newbornScreening: '',
    hearingTest: '',
    familyHistory: '',
    pastMedicalHistory: '',
    medications: '',
    fatherName: '',
    fatherAge: '',
    fatherOccupation: '',
    motherName: '',
    motherAge: '',
    motherOccupation: '',
    soapVisits: [],
    obVisits: [],

    createdAt: now,
    updatedAt: now
  };
}

export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

export function validateDocument(document: PatientDocument): string[] {
  const errors: string[] = [];

  if (!document.patientName.trim()) {
    errors.push("Patient's name is required");
  }

  if (!document.birthday) {
    errors.push("Birthday is required");
  }

  return errors;
}

/**
 * Formats a date string (YYYY-MM-DD) to MM/DD/YYYY format
 */
export function formatDate(dateStr: string): string {
  if (!dateStr) return '';
  const [year, month, day] = dateStr.split('-');
  if (!year || !month || !day) return dateStr;
  return `${month}/${day}/${year}`;
}

/**
 * Formats a Date object to MM/DD/YYYY format
 */
export function formatDateObj(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const year = date.getFullYear();
  return `${month}/${day}/${year}`;
}
