const mongoose = require('mongoose');

// Sub-schema for follow-up dates with SMS tracking
const followUpDateSchema = new mongoose.Schema({
  id: { type: String, required: true },
  date: { type: String, required: true },
  startTime: { type: String, default: '' },
  endTime: { type: String, default: '' },
  notes: { type: String, default: '' },
  completed: { type: Boolean, default: false },
  // Assistant-managed status fields
  reminded: { type: Boolean, default: false },
  confirmed: { type: Boolean, default: false },
  priority: { type: String, enum: ['routine', 'urgent', 'emergency'], default: 'routine' },
  // OB-specific fields
  aog: {
    weeks: { type: Number },
    days: { type: Number }
  },
  lastVisitSummary: {
    visitType: { type: String },
    subjective: { type: String },
    objective: { type: String },
    assessment: { type: String },
    plan: { type: String },
    date: { type: String }
  },
  // SMS reminder tracking
  smsReminder: {
    enabled: { type: Boolean, default: false },
    sentAt: { type: String, default: null },
    messageId: { type: String, default: null },
    status: { type: String, enum: ['pending', 'sent', 'failed', 'delivered'], default: 'pending' },
    sent3day: { type: String, default: null },
    sentSameday: { type: String, default: null },
    lastMessageId: { type: String, default: null }
  }
}, { _id: false });

// Sub-schema for booster shots
const boosterShotSchema = new mongoose.Schema({
  id: { type: String, required: true },
  date: { type: String, required: true },
  reaction: { type: String, default: '' }
}, { _id: false });

// Sub-schema for immunization records
const immunizationRecordSchema = new mongoose.Schema({
  vaccine: { type: String, required: true },
  first: { type: String, default: '' },
  second: { type: String, default: '' },
  third: { type: String, default: '' },
  boosters: { type: mongoose.Schema.Types.Mixed, default: [] },
  reaction: { type: String, default: '' }
}, { _id: false });

// Sub-schema for SOAP visits (legacy)
const soapVisitSchema = new mongoose.Schema({
  id: { type: String, required: true },
  visitDate: { type: String, required: true },
  subjective: {
    illnessName: { type: String, default: '' },
    illnessStartDate: { type: String, default: '' },
    notes: { type: String, default: '' }
  },
  objective: {
    age: { type: String, default: '' },
    weight: { type: String, default: '' },
    height: { type: String, default: '' },
    temperature: { type: String, default: '' },
    cardiacRate: { type: String, default: '' },
    respiratoryRate: { type: String, default: '' },
    bloodPressure: { type: String, default: '' },
    headCircumference: { type: String, default: '' },
    notes: { type: String, default: '' }
  },
  assessment: { type: String, default: '' },
  plan: { type: String, default: '' },
  createdAt: { type: String, required: true },
  updatedAt: { type: String, required: true }
}, { _id: false });

// Sub-schema for Emergency Contacts
const emergencyContactSchema = new mongoose.Schema({
  id: { type: String, required: true },
  name: { type: String, default: '' },
  relationship: { type: String, default: '' },
  contactNumbers: { type: String, default: '' }
}, { _id: false });

// Sub-schema for Previous Pregnancies
const previousPregnancySchema = new mongoose.Schema({
  id: { type: String, required: true },
  complications: { type: String, default: '' },
  modeOfDelivery: { type: String, default: '' },
  birthWeight: { type: String, default: '' },
  sex: { type: String, enum: ['Male', 'Female', ''], default: '' }
}, { _id: false });

// Sub-schema for Obstetric Outcomes
const obstetricOutcomesSchema = new mongoose.Schema({
  termDeliveries: { type: String, default: '' },
  pretermDeliveries: { type: String, default: '' },
  abortionsPregnancyLosses: { type: String, default: '' },
  livingChildren: { type: String, default: '' }
}, { _id: false });

// Sub-schema for Current Pregnancy Records
const currentPregnancyRecordSchema = new mongoose.Schema({
  id: { type: String, required: true },
  recordDate: { type: String, default: '' },
  weight: { type: String, default: '' },
  bloodPressure: { type: String, default: '' },
  gestationalAge: { type: String, default: '' },
  urineTestResults: { type: String, default: '' },
  // Fetal Assessment
  fetalHeartRate: { type: String, default: '' },
  fetalMovement: { type: String, default: '' },
  fundalHeight: { type: String, default: '' },
  positionOfFetus: { type: String, default: '' },
  dilation: { type: String, default: '' }
}, { _id: false });

// Sub-schema for Screening/Labs
const screeningLabSchema = new mongoose.Schema({
  id: { type: String, required: true },
  testName: { type: String, default: '' },
  notes: { type: String, default: '' },
  testResults: { type: String, default: '' }
}, { _id: false });

// Sub-schema for Surgical History
const surgicalHistorySchema = new mongoose.Schema({
  id: { type: String, required: true },
  date: { type: String, default: '' },
  procedure: { type: String, default: '' },
  findings: { type: String, default: '' }
}, { _id: false });

// Sub-schema for Labor, Delivery & Postpartum Notes
const laborDeliveryPostpartumSchema = new mongoose.Schema({
  laborAdmission: {
    dateOfAdmission: { type: String, default: '' },
    timeOfAdmission: { type: String, default: '' },
    membraneStatus: { type: String, default: '' },
    laborOnset: { type: String, default: '' }
  },
  deliveryData: {
    dateOfDelivery: { type: String, default: '' },
    timeOfDelivery: { type: String, default: '' },
    modeOfDelivery: { type: String, default: '' },
    placentalDelivery: { type: String, default: '' }
  },
  newbornData: {
    apgar: { type: String, default: '' },
    birthWeight: { type: String, default: '' },
    sex: { type: String, enum: ['Male', 'Female', ''], default: '' },
    laborIssues: { type: String, default: '' }
  },
  postpartumData: {
    fundalCheck: { type: String, default: '' },
    bleeding: { type: String, default: '' },
    recoveryStatus: { type: String, default: '' }
  }
}, { _id: false });

// Sub-schema for Clinical & Administrative Documentation
const clinicalDocumentationSchema = new mongoose.Schema({
  id: { type: String, required: true },
  visitDate: { type: String, default: '' },
  subjective: { type: String, default: '' },
  objective: { type: String, default: '' },
  assessment: { type: String, default: '' },
  plan: { type: String, default: '' },
  consentForm: { type: String, default: '' },
  patientEducationMaterials: { type: String, default: '' },
  imagingReports: { type: String, default: '' }
}, { _id: false });

// OB-specific SOAP Visit schema
const obVisitSchema = new mongoose.Schema({
  id: { type: String, required: true },
  visitDate: { type: String, required: true },
  visitType: { type: String, enum: ['routine', 'urgent', 'walk-in', 'emergency'], default: 'routine' },
  subjective: {
    chiefComplaint: { type: String, default: '' },
    fetalMovement: { type: String, default: '' },
    contractions: { type: Boolean, default: false },
    vaginalBleeding: { type: Boolean, default: false },
    leakingFluid: { type: Boolean, default: false },
    headaches: { type: Boolean, default: false },
    visualChanges: { type: Boolean, default: false },
    notes: { type: String, default: '' }
  },
  objective: {
    bloodPressure: { type: String, default: '' },
    weight: { type: String, default: '' },
    fundalHeight: { type: String, default: '' },
    fetalHeartTone: { type: String, default: '' },
    presentation: { type: String, default: '' },
    cervicalDilation: { type: String, default: '' },
    urineProtein: { type: String, default: '' },
    urineSugar: { type: String, default: '' },
    edema: { type: String, default: '' },
    nst: { type: String, default: '' },
    notes: { type: String, default: '' }
  },
  assessment: { type: String, default: '' },
  plan: { type: String, default: '' },
  aog: {
    weeks: { type: Number },
    days: { type: Number }
  },
  createdAt: { type: String, required: true },
  updatedAt: { type: String, required: true }
}, { _id: false });

// Main patient schema
const patientSchema = new mongoose.Schema({
  // Use custom id field (not MongoDB's _id for sync purposes)
  id: {
    type: String,
    required: true,
    unique: true,
    index: true
  },

  // ===== MyOB PATIENT INFORMATION =====
  patientName: { type: String, required: true, index: true },
  birthday: { type: String, required: true },
  address: { type: String, default: '' },
  contactNumbers: { type: String, default: '' },
  emergencyContacts: [emergencyContactSchema],
  profilePictureUrl: { type: String, default: '' },

  // ===== OBSTETRIC HISTORY =====
  gravida: { type: Number },
  para: { type: Number },
  obstetricOutcomes: obstetricOutcomesSchema,
  previousPregnancies: [previousPregnancySchema],

  // ===== CURRENT PREGNANCY =====
  lmp: { type: String, default: '' },
  edd: { type: String, default: '' },
  currentPregnancyRecords: [currentPregnancyRecordSchema],
  screeningLabs: [screeningLabSchema],

  // ===== GENERAL MEDICAL & SURGICAL HISTORY =====
  allergies: { type: String, default: '' },
  medicalConditions: { type: String, default: '' },
  surgicalHistory: [surgicalHistorySchema],
  medication: { type: String, default: '' },
  dosage: { type: String, default: '' },
  socialHistory: { type: String, default: '' },

  // ===== LABOR, DELIVERY & POSTPARTUM NOTES =====
  laborDeliveryPostpartum: laborDeliveryPostpartumSchema,

  // ===== CLINICAL & ADMINISTRATIVE DOCUMENTATION =====
  clinicalDocumentation: [clinicalDocumentationSchema],

  // ===== FOLLOW-UP & IMMUNIZATION =====
  followUpDates: [followUpDateSchema],
  immunizations: [immunizationRecordSchema],

  // ===== LEGACY FIELDS (kept for backward compatibility) =====
  gender: { type: String, enum: ['M', 'F'], default: 'F' },
  nickname: { type: String, default: '' },
  guardianPhone: { type: String, default: '' },
  smsConsent: { type: Boolean, default: false },
  order: { type: String, default: '' },
  religion: { type: String, default: '' },
  nationality: { type: String, default: '' },
  referredBy: { type: String, default: '' },
  prenatalBirthHistory: { type: String, default: '' },
  manner: { type: String, default: '' },
  birthplace: { type: String, default: '' },
  gestationalAge: { type: String, default: '' },
  apgar: { type: String, default: '' },
  bloodType: { type: String, default: '' },
  momBloodType: { type: String, default: '' },
  dadBloodType: { type: String, default: '' },
  birthWeight: { type: String, default: '' },
  birthLength: { type: String, default: '' },
  headCircumference: { type: String, default: '' },
  chestCircumference: { type: String, default: '' },
  abdominalCircumference: { type: String, default: '' },
  newbornScreening: { type: String, default: '' },
  hearingTest: { type: String, default: '' },
  familyHistory: { type: String, default: '' },
  pastMedicalHistory: { type: String, default: '' },
  medications: { type: String, default: '' },
  fatherName: { type: String, default: '' },
  fatherAge: { type: String, default: '' },
  fatherOccupation: { type: String, default: '' },
  motherName: { type: String, default: '' },
  motherAge: { type: String, default: '' },
  motherOccupation: { type: String, default: '' },
  soapVisits: [soapVisitSchema],
  obVisits: [obVisitSchema],

  // ===== TIMESTAMPS =====
  createdAt: { type: String, required: true },
  updatedAt: { type: String, required: true, index: true },

  // ===== SYNC METADATA FIELDS =====
  _version: { type: Number, default: 1 },
  _lastSyncedAt: { type: String, default: null },
  _deleted: { type: Boolean, default: false, index: true },
  _deviceId: { type: String, default: null }
});

// Compound index for efficient sync queries
patientSchema.index({ updatedAt: 1, _deleted: 1 });
patientSchema.index({ _lastSyncedAt: 1 });

module.exports = mongoose.model('Patient', patientSchema);
