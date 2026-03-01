import {
  PatientDocument,
  createEmptyObstetricOutcomes,
  createEmptyEmergencyContact,
  generateId
} from '../types';

// Calculate LMP from AOG (for generating test data)
const calculateLMPFromAOG = (aogWeeks: number, aogDays: number = 0, targetDate: Date = new Date()): string => {
  const totalDays = (aogWeeks * 7) + aogDays;
  const lmpDate = new Date(targetDate);
  lmpDate.setDate(lmpDate.getDate() - totalDays);
  return lmpDate.toISOString().split('T')[0];
};

// Calculate EDD from LMP (add 280 days)
const calculateEDDFromLMP = (lmpDate: string): string => {
  const lmp = new Date(lmpDate);
  lmp.setDate(lmp.getDate() + 280);
  return lmp.toISOString().split('T')[0];
};

// Sample OB patients matching the MyOB structure
export const sampleOBPatients: PatientDocument[] = [
  {
    id: generateId(),
    patientName: 'Blackwell, Michele',
    birthday: '1992-05-15',
    address: '123 Main Street, Manila',
    contactNumbers: '09171234567',
    emergencyContacts: [
      {
        id: generateId(),
        name: 'John Blackwell',
        relationship: 'Husband',
        contactNumbers: '09171234568'
      }
    ],
    gravida: 2,
    para: 1,
    obstetricOutcomes: {
      termDeliveries: '1',
      pretermDeliveries: '0',
      abortionsPregnancyLosses: '0',
      livingChildren: '1'
    },
    previousPregnancies: [
      {
        id: generateId(),
        complications: 'None',
        modeOfDelivery: 'Normal Spontaneous Delivery',
        birthWeight: '3.2 kg',
        sex: 'Male'
      }
    ],
    lmp: calculateLMPFromAOG(33, 4),
    edd: calculateEDDFromLMP(calculateLMPFromAOG(33, 4)),
    currentPregnancyRecords: [
      {
        id: generateId(),
        recordDate: new Date().toISOString().split('T')[0],
        weight: '71 kg',
        bloodPressure: '122/80',
        gestationalAge: '33 weeks 4 days',
        urineTestResults: 'Negative for protein',
        fetalHeartRate: '140 bpm',
        fetalMovement: 'Good',
        fundalHeight: '32 cm',
        positionOfFetus: 'Cephalic',
        dilation: ''
      }
    ],
    screeningLabs: [],
    allergies: 'None known',
    medicalConditions: 'None',
    surgicalHistory: [],
    medication: 'Prenatal vitamins',
    dosage: '1 tablet daily',
    socialHistory: 'Non-smoker, no alcohol',
    laborDeliveryPostpartum: undefined,
    clinicalDocumentation: [
      {
        id: generateId(),
        visitDate: new Date().toISOString().split('T')[0],
        subjective: 'Patient reports mild shortness of breath with exertion. Good fetal movement. No headaches or visual changes.',
        objective: 'BP 122/80. Weight 71kg. FH 32cm. FHT 140 bpm. Urine dipstick: Negative for protein.',
        assessment: 'G2P1 @ 33 weeks 4 days AOG. Normal pregnancy.',
        plan: 'Follow-up in 2 weeks. Continue Prenatal Vitamins. Discussed birth plan.',
        consentForm: '',
        patientEducationMaterials: '',
        imagingReports: ''
      }
    ],
    followUpDates: [
      {
        id: generateId(),
        date: new Date().toISOString().split('T')[0],
        startTime: '09:00',
        endTime: '09:30',
        notes: 'Routine prenatal check-up',
        completed: false,
        priority: 'routine',
        aog: { weeks: 33, days: 4 },
        lastVisitSummary: {
          visitType: 'Previous Routine Check-up',
          subjective: 'Patient reports mild shortness of breath with exertion. Good fetal movement.',
          objective: 'BP 122/80. Weight 71kg. FH 32cm. FHT 140 bpm.',
          assessment: 'G2P1 @ 32 weeks AOG. Normal pregnancy.',
          plan: 'Follow-up in 2 weeks. Continue Prenatal Vitamins.',
          date: '02/27/2026'
        }
      }
    ],
    immunizations: [],
    // Legacy fields
    gender: 'F',
    nickname: 'Michele',
    guardianPhone: '',
    smsConsent: true,
    order: '',
    religion: 'Catholic',
    nationality: 'Filipino',
    referredBy: 'Dr. Santos',
    prenatalBirthHistory: '',
    manner: '',
    birthplace: '',
    gestationalAge: '',
    apgar: '',
    bloodType: 'O+',
    momBloodType: '',
    dadBloodType: '',
    birthWeight: '',
    birthLength: '',
    headCircumference: '',
    chestCircumference: '',
    abdominalCircumference: '',
    newbornScreening: '',
    hearingTest: '',
    familyHistory: 'No significant family history',
    pastMedicalHistory: 'No known medical conditions',
    medications: 'Prenatal vitamins',
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
  },
  {
    id: generateId(),
    patientName: 'Kramer, Margarita',
    birthday: '1990-08-22',
    address: '456 Oak Avenue, Quezon City',
    contactNumbers: '09182345678',
    emergencyContacts: [
      {
        id: generateId(),
        name: 'David Kramer',
        relationship: 'Husband',
        contactNumbers: '09182345679'
      }
    ],
    gravida: 1,
    para: 0,
    obstetricOutcomes: {
      termDeliveries: '0',
      pretermDeliveries: '0',
      abortionsPregnancyLosses: '0',
      livingChildren: '0'
    },
    previousPregnancies: [],
    lmp: calculateLMPFromAOG(32, 0),
    edd: calculateEDDFromLMP(calculateLMPFromAOG(32, 0)),
    currentPregnancyRecords: [
      {
        id: generateId(),
        recordDate: new Date().toISOString().split('T')[0],
        weight: '71 kg',
        bloodPressure: '118/74',
        gestationalAge: '32 weeks',
        urineTestResults: 'Normal',
        fetalHeartRate: '142 bpm',
        fetalMovement: 'Reassuring NST',
        fundalHeight: '32 cm',
        positionOfFetus: 'Cephalic',
        dilation: ''
      }
    ],
    screeningLabs: [],
    allergies: 'None known',
    medicalConditions: 'None',
    surgicalHistory: [],
    medication: 'Prenatal vitamins, Iron supplements',
    dosage: '1 tablet daily each',
    socialHistory: 'Non-smoker, no alcohol',
    laborDeliveryPostpartum: undefined,
    clinicalDocumentation: [
      {
        id: generateId(),
        visitDate: new Date().toISOString().split('T')[0],
        subjective: 'Patient presents for urgent walk-in. Reports decreased fetal movement since this morning. No vaginal bleeding or leaking of fluid.',
        objective: 'BP 118/74. Wt 71kg. FH 32cm. FHT 142 bpm. Non-Stress Test (NST): Reactive (2 accelerations in 20 mins).',
        assessment: 'G1P0 @ 32 weeks AOG. Decreased fetal movement, reassuring NST.',
        plan: 'Continue monitoring fetal movements. Return if <10 movements in 2 hours.',
        consentForm: '',
        patientEducationMaterials: '',
        imagingReports: ''
      }
    ],
    followUpDates: [
      {
        id: generateId(),
        date: new Date().toISOString().split('T')[0],
        startTime: '09:30',
        endTime: '10:00',
        notes: 'Urgent walk-in - decreased fetal movement',
        completed: false,
        priority: 'urgent',
        aog: { weeks: 32 }
      }
    ],
    immunizations: [],
    // Legacy fields
    gender: 'F',
    nickname: 'Marga',
    guardianPhone: '',
    smsConsent: true,
    order: '',
    religion: 'Catholic',
    nationality: 'Filipino',
    referredBy: 'Self',
    prenatalBirthHistory: '',
    manner: '',
    birthplace: '',
    gestationalAge: '',
    apgar: '',
    bloodType: 'A+',
    momBloodType: '',
    dadBloodType: '',
    birthWeight: '',
    birthLength: '',
    headCircumference: '',
    chestCircumference: '',
    abdominalCircumference: '',
    newbornScreening: '',
    hearingTest: '',
    familyHistory: 'Mother has hypertension',
    pastMedicalHistory: 'No known medical conditions',
    medications: 'Prenatal vitamins, Iron supplements',
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
  },
  {
    id: generateId(),
    patientName: 'Hanson, Linda',
    birthday: '1995-03-10',
    address: '789 Pine Street, Makati',
    contactNumbers: '09193456789',
    emergencyContacts: [
      {
        id: generateId(),
        name: 'Michael Hanson',
        relationship: 'Husband',
        contactNumbers: '09193456790'
      }
    ],
    gravida: 1,
    para: 0,
    obstetricOutcomes: {
      termDeliveries: '0',
      pretermDeliveries: '0',
      abortionsPregnancyLosses: '0',
      livingChildren: '0'
    },
    previousPregnancies: [],
    lmp: calculateLMPFromAOG(16, 0),
    edd: calculateEDDFromLMP(calculateLMPFromAOG(16, 0)),
    currentPregnancyRecords: [
      {
        id: generateId(),
        recordDate: new Date().toISOString().split('T')[0],
        weight: '62 kg',
        bloodPressure: '110/70',
        gestationalAge: '16 weeks',
        urineTestResults: 'Normal',
        fetalHeartRate: '145 bpm',
        fetalMovement: 'Not yet felt (quickening)',
        fundalHeight: '',
        positionOfFetus: '',
        dilation: ''
      }
    ],
    screeningLabs: [],
    allergies: 'None known',
    medicalConditions: 'None',
    surgicalHistory: [],
    medication: 'Prenatal vitamins',
    dosage: '1 tablet daily',
    socialHistory: 'Non-smoker, no alcohol',
    laborDeliveryPostpartum: undefined,
    clinicalDocumentation: [
      {
        id: generateId(),
        visitDate: new Date().toISOString().split('T')[0],
        subjective: 'Quickening is not yet felt. No complaints.',
        objective: 'BP 110/70. Wt 62kg. FHT 145 bpm.',
        assessment: 'G1P0 @ 16 weeks AOG. Normal pregnancy.',
        plan: 'Continue prenatal vitamins. Schedule anatomy scan.',
        consentForm: '',
        patientEducationMaterials: '',
        imagingReports: ''
      }
    ],
    followUpDates: [
      {
        id: generateId(),
        date: new Date().toISOString().split('T')[0],
        startTime: '10:00',
        endTime: '10:30',
        notes: 'Routine check-up',
        completed: false,
        priority: 'routine',
        aog: { weeks: 16 }
      }
    ],
    immunizations: [],
    // Legacy fields
    gender: 'F',
    nickname: 'Linda',
    guardianPhone: '',
    smsConsent: true,
    order: '',
    religion: 'Protestant',
    nationality: 'Filipino',
    referredBy: 'Dr. Reyes',
    prenatalBirthHistory: '',
    manner: '',
    birthplace: '',
    gestationalAge: '',
    apgar: '',
    bloodType: 'B+',
    momBloodType: '',
    dadBloodType: '',
    birthWeight: '',
    birthLength: '',
    headCircumference: '',
    chestCircumference: '',
    abdominalCircumference: '',
    newbornScreening: '',
    hearingTest: '',
    familyHistory: 'No significant family history',
    pastMedicalHistory: 'No known medical conditions',
    medications: 'Prenatal vitamins',
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
  },
  {
    id: generateId(),
    patientName: 'Shaw, Elnora',
    birthday: '1988-11-28',
    address: '321 Elm Drive, Pasig',
    contactNumbers: '09204567890',
    emergencyContacts: [
      {
        id: generateId(),
        name: 'Robert Shaw',
        relationship: 'Husband',
        contactNumbers: '09204567891'
      }
    ],
    gravida: 3,
    para: 2,
    obstetricOutcomes: {
      termDeliveries: '2',
      pretermDeliveries: '0',
      abortionsPregnancyLosses: '0',
      livingChildren: '2'
    },
    previousPregnancies: [
      {
        id: generateId(),
        complications: 'None',
        modeOfDelivery: 'Normal Spontaneous Delivery',
        birthWeight: '3.0 kg',
        sex: 'Female'
      },
      {
        id: generateId(),
        complications: 'None',
        modeOfDelivery: 'Normal Spontaneous Delivery',
        birthWeight: '3.4 kg',
        sex: 'Male'
      }
    ],
    lmp: calculateLMPFromAOG(20, 0),
    edd: calculateEDDFromLMP(calculateLMPFromAOG(20, 0)),
    currentPregnancyRecords: [
      {
        id: generateId(),
        recordDate: new Date().toISOString().split('T')[0],
        weight: '64 kg',
        bloodPressure: '115/72',
        gestationalAge: '20 weeks',
        urineTestResults: 'Normal',
        fetalHeartRate: '142 bpm',
        fetalMovement: 'First fetal movements reported',
        fundalHeight: '20 cm',
        positionOfFetus: '',
        dilation: ''
      }
    ],
    screeningLabs: [],
    allergies: 'None known',
    medicalConditions: 'None',
    surgicalHistory: [],
    medication: 'Prenatal vitamins',
    dosage: '1 tablet daily',
    socialHistory: 'Non-smoker, no alcohol',
    laborDeliveryPostpartum: undefined,
    clinicalDocumentation: [
      {
        id: generateId(),
        visitDate: new Date().toISOString().split('T')[0],
        subjective: 'Reports first fetal movements.',
        objective: 'BP 115/72. Wt 64kg. Fundal Height (FH) 20cm. FHT 142 bpm.',
        assessment: 'G3P2 @ 20 weeks AOG. Normal pregnancy.',
        plan: 'Continue prenatal vitamins. Anatomy scan scheduled.',
        consentForm: '',
        patientEducationMaterials: '',
        imagingReports: ''
      }
    ],
    followUpDates: [
      {
        id: generateId(),
        date: new Date().toISOString().split('T')[0],
        startTime: '10:30',
        endTime: '11:00',
        notes: 'Routine check-up',
        completed: false,
        priority: 'routine',
        aog: { weeks: 20 }
      }
    ],
    immunizations: [],
    // Legacy fields
    gender: 'F',
    nickname: 'Nora',
    guardianPhone: '',
    smsConsent: true,
    order: '',
    religion: 'Catholic',
    nationality: 'Filipino',
    referredBy: 'Dr. Cruz',
    prenatalBirthHistory: '',
    manner: '',
    birthplace: '',
    gestationalAge: '',
    apgar: '',
    bloodType: 'AB+',
    momBloodType: '',
    dadBloodType: '',
    birthWeight: '',
    birthLength: '',
    headCircumference: '',
    chestCircumference: '',
    abdominalCircumference: '',
    newbornScreening: '',
    hearingTest: '',
    familyHistory: 'Father has diabetes',
    pastMedicalHistory: 'No known medical conditions',
    medications: 'Prenatal vitamins',
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
  },
  {
    id: generateId(),
    patientName: 'Clayton, Aisha',
    birthday: '1993-07-04',
    address: '654 Maple Lane, Taguig',
    contactNumbers: '09215678901',
    emergencyContacts: [
      {
        id: generateId(),
        name: 'Ahmed Clayton',
        relationship: 'Husband',
        contactNumbers: '09215678902'
      }
    ],
    gravida: 2,
    para: 1,
    obstetricOutcomes: {
      termDeliveries: '1',
      pretermDeliveries: '0',
      abortionsPregnancyLosses: '0',
      livingChildren: '1'
    },
    previousPregnancies: [
      {
        id: generateId(),
        complications: 'None',
        modeOfDelivery: 'Normal Spontaneous Delivery',
        birthWeight: '3.1 kg',
        sex: 'Female'
      }
    ],
    lmp: calculateLMPFromAOG(24, 0),
    edd: calculateEDDFromLMP(calculateLMPFromAOG(24, 0)),
    currentPregnancyRecords: [
      {
        id: generateId(),
        recordDate: new Date().toISOString().split('T')[0],
        weight: '66 kg',
        bloodPressure: '118/76',
        gestationalAge: '24 weeks',
        urineTestResults: 'Normal',
        fetalHeartRate: '148 bpm',
        fetalMovement: 'Active',
        fundalHeight: '24 cm',
        positionOfFetus: '',
        dilation: ''
      }
    ],
    screeningLabs: [],
    allergies: 'None known',
    medicalConditions: 'None',
    surgicalHistory: [],
    medication: 'Prenatal vitamins',
    dosage: '1 tablet daily',
    socialHistory: 'Non-smoker, no alcohol',
    laborDeliveryPostpartum: undefined,
    clinicalDocumentation: [
      {
        id: generateId(),
        visitDate: new Date().toISOString().split('T')[0],
        subjective: 'Occasional backache; active fetal movement.',
        objective: 'BP 118/76. Wt 66kg. FH 24cm. FHT 148 bpm.',
        assessment: 'G2P1 @ 24 weeks AOG. Normal pregnancy.',
        plan: 'Continue prenatal vitamins. GCT scheduled next visit.',
        consentForm: '',
        patientEducationMaterials: '',
        imagingReports: ''
      }
    ],
    followUpDates: [
      {
        id: generateId(),
        date: new Date().toISOString().split('T')[0],
        startTime: '11:00',
        endTime: '11:30',
        notes: 'Routine check-up',
        completed: false,
        priority: 'routine',
        aog: { weeks: 24 }
      }
    ],
    immunizations: [],
    // Legacy fields
    gender: 'F',
    nickname: 'Aisha',
    guardianPhone: '',
    smsConsent: true,
    order: '',
    religion: 'Islam',
    nationality: 'Filipino',
    referredBy: 'Self',
    prenatalBirthHistory: '',
    manner: '',
    birthplace: '',
    gestationalAge: '',
    apgar: '',
    bloodType: 'O-',
    momBloodType: '',
    dadBloodType: '',
    birthWeight: '',
    birthLength: '',
    headCircumference: '',
    chestCircumference: '',
    abdominalCircumference: '',
    newbornScreening: '',
    hearingTest: '',
    familyHistory: 'No significant family history',
    pastMedicalHistory: 'No known medical conditions',
    medications: 'Prenatal vitamins',
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
  },
  {
    id: generateId(),
    patientName: 'Bowers, Amie',
    birthday: '1991-12-15',
    address: '987 Cedar Road, Paranaque',
    contactNumbers: '09226789012',
    emergencyContacts: [
      {
        id: generateId(),
        name: 'James Bowers',
        relationship: 'Husband',
        contactNumbers: '09226789013'
      }
    ],
    gravida: 1,
    para: 0,
    obstetricOutcomes: {
      termDeliveries: '0',
      pretermDeliveries: '0',
      abortionsPregnancyLosses: '0',
      livingChildren: '0'
    },
    previousPregnancies: [],
    lmp: calculateLMPFromAOG(28, 0),
    edd: calculateEDDFromLMP(calculateLMPFromAOG(28, 0)),
    currentPregnancyRecords: [
      {
        id: generateId(),
        recordDate: new Date().toISOString().split('T')[0],
        weight: '68 kg',
        bloodPressure: '120/78',
        gestationalAge: '28 weeks',
        urineTestResults: 'Normal',
        fetalHeartRate: '146 bpm',
        fetalMovement: 'Good',
        fundalHeight: '28 cm',
        positionOfFetus: 'Cephalic',
        dilation: ''
      }
    ],
    screeningLabs: [],
    allergies: 'None known',
    medicalConditions: 'Mild leg edema (physiologic)',
    surgicalHistory: [],
    medication: 'Prenatal vitamins',
    dosage: '1 tablet daily',
    socialHistory: 'Non-smoker, no alcohol',
    laborDeliveryPostpartum: undefined,
    clinicalDocumentation: [
      {
        id: generateId(),
        visitDate: new Date().toISOString().split('T')[0],
        subjective: 'Good fetal movement. Mild leg edema.',
        objective: 'BP 120/78. Wt 68kg. FH 28cm. FHT 146 bpm.',
        assessment: 'G1P0 @ 28 weeks AOG. Normal pregnancy with mild physiologic edema.',
        plan: 'Continue prenatal vitamins. Elevate legs when resting.',
        consentForm: '',
        patientEducationMaterials: '',
        imagingReports: ''
      }
    ],
    followUpDates: [
      {
        id: generateId(),
        date: new Date().toISOString().split('T')[0],
        startTime: '11:30',
        endTime: '12:00',
        notes: 'Routine check-up',
        completed: false,
        priority: 'routine',
        aog: { weeks: 28 }
      }
    ],
    immunizations: [],
    // Legacy fields
    gender: 'F',
    nickname: 'Amie',
    guardianPhone: '',
    smsConsent: true,
    order: '',
    religion: 'Catholic',
    nationality: 'Filipino',
    referredBy: 'Dr. Tan',
    prenatalBirthHistory: '',
    manner: '',
    birthplace: '',
    gestationalAge: '',
    apgar: '',
    bloodType: 'A-',
    momBloodType: '',
    dadBloodType: '',
    birthWeight: '',
    birthLength: '',
    headCircumference: '',
    chestCircumference: '',
    abdominalCircumference: '',
    newbornScreening: '',
    hearingTest: '',
    familyHistory: 'No significant family history',
    pastMedicalHistory: 'No known medical conditions',
    medications: 'Prenatal vitamins',
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
  }
];

// Function to get sample alerts based on patient data
export const getSampleAlerts = (patients: PatientDocument[]) => {
  const alerts: { id: string; message: string; type: 'emergency' | 'warning' | 'info'; patientId?: string }[] = [];

  patients.forEach(patient => {
    patient.followUpDates?.forEach(followUp => {
      if (followUp.priority === 'emergency') {
        alerts.push({
          id: `alert-${patient.id}-${followUp.id}`,
          message: 'Emergency patient alert!',
          type: 'emergency',
          patientId: patient.id
        });
      } else if (followUp.priority === 'urgent') {
        alerts.push({
          id: `alert-${patient.id}-${followUp.id}`,
          message: 'New patient with symptomatic concern.',
          type: 'warning',
          patientId: patient.id
        });
      }
    });
  });

  return alerts;
};
