// Appointment priority levels
export type AppointmentPriority = 'routine' | 'urgent' | 'emergency';

// AOG (Age of Gestation) type
export interface AOG {
  weeks: number;
  days?: number;
}

// Helper to format AOG as string
export const formatAOG = (aog: AOG | null | undefined): string => {
  if (!aog) return '';
  if (aog.days && aog.days > 0) {
    return `${aog.weeks} weeks ${aog.days} days`;
  }
  return `${aog.weeks} weeks`;
};

// Helper to calculate AOG from LMP (Last Menstrual Period)
export const calculateAOG = (lmpDate: string, targetDate: string = new Date().toISOString().split('T')[0]): AOG => {
  const lmp = new Date(lmpDate);
  const target = new Date(targetDate);
  const diffTime = target.getTime() - lmp.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  const weeks = Math.floor(diffDays / 7);
  const days = diffDays % 7;
  return { weeks, days };
};

// Emergency Contact
export interface EmergencyContact {
  id: string;
  name: string;
  relationship: string;
  contactNumbers: string;
}

// Previous Pregnancy Record
export interface PreviousPregnancy {
  id: string;
  complications: string;
  modeOfDelivery: string;
  birthWeight: string;
  sex: 'Male' | 'Female' | '';
}

// Obstetric Outcomes
export interface ObstetricOutcomes {
  termDeliveries: string;
  pretermDeliveries: string;
  abortionsPregnancyLosses: string;
  livingChildren: string;
}

// Current Pregnancy Record
export interface CurrentPregnancyRecord {
  id: string;
  recordDate: string;
  weight: string;
  bloodPressure: string;
  gestationalAge: string;
  urineTestResults: string;
  // Fetal Assessment
  fetalHeartRate: string;
  fetalMovement: string;
  fundalHeight: string;
  positionOfFetus: string;
  dilation: string;
}

// Screening/Labs
export interface ScreeningLab {
  id: string;
  testName: string;
  notes: string;
  testResults: string;
}

// Surgical History
export interface SurgicalHistory {
  id: string;
  date: string;
  procedure: string;
  findings: string;
}

// Labor Admissions
export interface LaborAdmission {
  dateOfAdmission: string;
  timeOfAdmission: string;
  membraneStatus: string;
  laborOnset: string;
}

// Delivery Data
export interface DeliveryData {
  dateOfDelivery: string;
  timeOfDelivery: string;
  modeOfDelivery: string;
  placentalDelivery: string;
}

// Newborn Data
export interface NewbornData {
  apgar: string;
  birthWeight: string;
  sex: 'Male' | 'Female' | '';
  laborIssues: string;
}

// Postpartum Data
export interface PostpartumData {
  fundalCheck: string;
  bleeding: string;
  recoveryStatus: string;
}

// Labor, Delivery & Postpartum Notes
export interface LaborDeliveryPostpartum {
  laborAdmission: LaborAdmission;
  deliveryData: DeliveryData;
  newbornData: NewbornData;
  postpartumData: PostpartumData;
}

// Clinical & Administrative Documentation (SOAP Note)
export interface ClinicalDocumentation {
  id: string;
  visitDate: string;
  subjective: string;
  objective: string;
  assessment: string;
  plan: string;
  consentForm: string;
  patientEducationMaterials: string;
  imagingReports: string;
}

// OB-specific SOAP Visit type for prenatal consultations
export type OBSOAPVisit = {
  id: string;
  visitDate: string;
  visitType: 'routine' | 'urgent' | 'walk-in' | 'emergency';

  // S - Subjective - Patient complaints and history
  subjective: {
    chiefComplaint?: string;
    fetalMovement?: string;
    contractions?: boolean;
    vaginalBleeding?: boolean;
    leakingFluid?: boolean;
    headaches?: boolean;
    visualChanges?: boolean;
    notes?: string;
  };

  // O - Objective - Physical examination findings for OB
  objective: {
    bloodPressure: string;
    weight: string;
    fundalHeight: string;      // FH in cm
    fetalHeartTone: string;    // FHT in bpm
    presentation?: string;      // Cephalic, Breech, etc.
    cervicalDilation?: string;
    urineProtein?: string;      // Dipstick result
    urineSugar?: string;        // Dipstick result
    edema?: string;
    nst?: string;               // Non-Stress Test result
    notes?: string;
  };

  // A - Assessment
  assessment: string;           // e.g., "G2P1 @ 32 weeks AOG. Normal pregnancy"

  // P - Plan
  plan: string;                 // e.g., "Follow-up in 2 weeks. Continue Prenatal Vitamins"

  aog: AOG;                     // AOG at time of visit
  createdAt: string;
  updatedAt: string;
};

// SOAP Visit type for outpatient consultations (kept for backwards compatibility)
export type SOAPVisit = {
  id: string;
  visitDate: string;

  // S - Subjective - History of present illness
  subjective: {
    illnessName: string;
    illnessStartDate: string;
    notes?: string;
  };

  // O - Objective - Physical examination findings
  objective: {
    age: string;
    weight: string;
    height: string;
    temperature: string;
    cardiacRate: string;
    respiratoryRate: string;
    bloodPressure: string;
    headCircumference: string;
    notes?: string;
  };

  // A - Assessment - Diagnosis
  assessment: string;

  // P - Plan - Patient Management
  plan: string;

  createdAt: string;
  updatedAt: string;
};

export interface PatientDocument {
  id: string;
  // Patient Information
  patientName: string;            // Format: "Surname, Given Name"
  birthday: string;
  address: string;
  contactNumbers: string;
  emergencyContacts: EmergencyContact[];

  // Obstetric History
  gravida?: number;               // Gravidity - Number of pregnancies
  para?: number;                  // Parity - Number of births
  obstetricOutcomes: ObstetricOutcomes;
  previousPregnancies: PreviousPregnancy[];

  // Current Pregnancy
  lmp?: string;                   // Last Menstrual Period (YYYY-MM-DD)
  edd?: string;                   // Expected Delivery Date (YYYY-MM-DD)
  currentPregnancyRecords: CurrentPregnancyRecord[];
  screeningLabs: ScreeningLab[];

  // General Medical & Surgical History
  allergies: string;
  medicalConditions: string;
  surgicalHistory: SurgicalHistory[];
  medication: string;
  dosage: string;
  socialHistory: string;

  // Labor, Delivery & Postpartum Notes
  laborDeliveryPostpartum?: LaborDeliveryPostpartum;

  // Clinical & Administrative Documentation
  clinicalDocumentation: ClinicalDocumentation[];

  // Follow-up and Immunization
  followUpDates: FollowUpDate[];
  immunizations: ImmunizationRecord[];

  // Legacy fields (kept for backward compatibility during migration)
  gender: 'M' | 'F';
  nickname: string;
  guardianPhone: string;
  smsConsent: boolean;
  order: string;
  religion: string;
  nationality: string;
  referredBy: string;
  prenatalBirthHistory: string;
  manner: string;
  birthplace: string;
  gestationalAge: string;
  apgar: string;
  bloodType: string;
  momBloodType: string;
  dadBloodType: string;
  birthWeight: string;
  birthLength: string;
  headCircumference: string;
  chestCircumference: string;
  abdominalCircumference: string;
  newbornScreening: string;
  hearingTest: string;
  familyHistory: string;
  pastMedicalHistory: string;
  medications: string;
  fatherName: string;
  fatherAge: string;
  fatherOccupation: string;
  motherName: string;
  motherAge: string;
  motherOccupation: string;
  soapVisits: SOAPVisit[];
  obVisits?: OBSOAPVisit[];

  createdAt: string;
  updatedAt: string;
}

export interface SMSReminder {
  enabled: boolean;
  sentAt?: string | null;
  messageId?: string | null;
  status: 'pending' | 'sent' | 'failed' | 'delivered';
}

// Workflow step for physician arrival flow
export type WorkflowStep = 'pending' | 'ehr_updated' | 'assistant_called' | 'completed';

// Check-in status for appointments
export type CheckInStatus = 'scheduled' | 'checked_in' | 'in_progress' | 'completed';

export interface FollowUpDate {
  id: string;
  date: string;
  startTime?: string;           // e.g., "09:00"
  endTime?: string;             // e.g., "09:30"
  notes: string;
  completed: boolean;
  reminded?: boolean;
  confirmed?: boolean;
  smsReminder?: SMSReminder;
  priority?: AppointmentPriority;
  workflowStep?: WorkflowStep;  // Physician workflow tracking
  checkInStatus?: CheckInStatus; // Patient check-in status
  // Current visit intake (filled by assistant during check-in)
  intake?: {
    subjective?: string;        // S: Patient's chief complaint/symptoms
    objective?: string;         // O: Vitals, measurements taken by assistant
    checkedInAt?: string;       // Timestamp when checked in
    checkedInBy?: string;       // Assistant who checked in
  };
  // OB-specific fields
  aog?: AOG;                    // AOG at time of appointment
  lastVisitSummary?: {          // Summary from previous visit
    visitType?: string;
    subjective?: string;
    objective?: string;
    assessment?: string;
    plan?: string;
    date?: string;
  };
}

export interface BoosterShot {
  id: string;
  date: string;
  reaction: string;
}

export interface ImmunizationRecord {
  vaccine: string;
  first?: string;
  second?: string;
  third?: string;
  boosters?: BoosterShot[];
}

// Vaccines that require fewer than 3 primary shots
export const VACCINE_SHOT_CONFIG: Record<string, number> = {
  'BCG': 1,
};

// Default is 3 shots for all other vaccines
export const getRequiredShots = (vaccine: string): number => {
  return VACCINE_SHOT_CONFIG[vaccine] || 3;
};

export const VACCINES = [
  'TUBERCULIN TEST',
  'BCG',
  'HEPATITIS B',
  'DPT',
  'OPV/IPV',
  'HIB',
  'ROTAVIRUS',
  'MEASLES',
  'MMR',
  'VARICELLA',
  'HEPATITIS A',
  'TYPHOID',
  'PNEUMOCOCCAL',
  'MENINGOCOCCAL',
  'INFLUENZA',
  'HPV',
  'JAPANESE ENCEPHALITIS',
  'COVID VACCINE'
];

// Helper to generate unique IDs
export const generateId = (): string => Math.random().toString(36).substring(2, 11);

// Default empty values for new records
export const createEmptyObstetricOutcomes = (): ObstetricOutcomes => ({
  termDeliveries: '',
  pretermDeliveries: '',
  abortionsPregnancyLosses: '',
  livingChildren: ''
});

export const createEmptyEmergencyContact = (): EmergencyContact => ({
  id: generateId(),
  name: '',
  relationship: '',
  contactNumbers: ''
});

export const createEmptyPreviousPregnancy = (): PreviousPregnancy => ({
  id: generateId(),
  complications: '',
  modeOfDelivery: '',
  birthWeight: '',
  sex: ''
});

export const createEmptyCurrentPregnancyRecord = (): CurrentPregnancyRecord => ({
  id: generateId(),
  recordDate: new Date().toISOString().split('T')[0],
  weight: '',
  bloodPressure: '',
  gestationalAge: '',
  urineTestResults: '',
  fetalHeartRate: '',
  fetalMovement: '',
  fundalHeight: '',
  positionOfFetus: '',
  dilation: ''
});

export const createEmptyScreeningLab = (): ScreeningLab => ({
  id: generateId(),
  testName: '',
  notes: '',
  testResults: ''
});

export const createEmptySurgicalHistory = (): SurgicalHistory => ({
  id: generateId(),
  date: '',
  procedure: '',
  findings: ''
});

export const createEmptyLaborDeliveryPostpartum = (): LaborDeliveryPostpartum => ({
  laborAdmission: {
    dateOfAdmission: '',
    timeOfAdmission: '',
    membraneStatus: '',
    laborOnset: ''
  },
  deliveryData: {
    dateOfDelivery: '',
    timeOfDelivery: '',
    modeOfDelivery: '',
    placentalDelivery: ''
  },
  newbornData: {
    apgar: '',
    birthWeight: '',
    sex: '',
    laborIssues: ''
  },
  postpartumData: {
    fundalCheck: '',
    bleeding: '',
    recoveryStatus: ''
  }
});

export const createEmptyClinicalDocumentation = (): ClinicalDocumentation => ({
  id: generateId(),
  visitDate: new Date().toISOString().split('T')[0],
  subjective: '',
  objective: '',
  assessment: '',
  plan: '',
  consentForm: '',
  patientEducationMaterials: '',
  imagingReports: ''
});

// Helper to create empty patient document
export const createEmptyPatientDocument = (): PatientDocument => ({
  id: generateId(),
  patientName: '',
  birthday: '',
  address: '',
  contactNumbers: '',
  emergencyContacts: [],
  gravida: undefined,
  para: undefined,
  obstetricOutcomes: createEmptyObstetricOutcomes(),
  previousPregnancies: [],
  lmp: '',
  edd: '',
  currentPregnancyRecords: [],
  screeningLabs: [],
  allergies: '',
  medicalConditions: '',
  surgicalHistory: [],
  medication: '',
  dosage: '',
  socialHistory: '',
  laborDeliveryPostpartum: undefined,
  clinicalDocumentation: [],
  followUpDates: [],
  immunizations: [],
  // Legacy fields
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
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
});