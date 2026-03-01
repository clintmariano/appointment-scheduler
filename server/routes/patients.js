const express = require('express');
const { generateId } = require('../utils/helpers');
const Patient = require('../models/Patient');
const router = express.Router();

// Fake patient data (fallback when MongoDB is not connected)
let FAKE_PATIENTS = [
  {
    id: 'patient_001',
    patientName: 'Emma Johnson',
    birthday: '2020-03-15',
    gender: 'F',
    nickname: 'Emmy',
    address: '123 Maple Street, Springfield, IL 62701',
    contactNumbers: '(555) 123-4567, (555) 987-6543',
    order: '1st child',
    religion: 'Christian',
    nationality: 'American',
    referredBy: 'Dr. Sarah Wilson',
    prenatalBirthHistory: 'Normal pregnancy, no complications',
    manner: 'Normal vaginal delivery',
    birthplace: 'Springfield General Hospital',
    gestationalAge: '39 weeks',
    apgar: '9/10',
    bloodType: 'O+',
    momBloodType: 'A+',
    dadBloodType: 'O+',
    birthWeight: '3.2 kg',
    birthLength: '50 cm',
    headCircumference: '35 cm',
    chestCircumference: '33 cm',
    abdominalCircumference: '32 cm',
    newbornScreening: 'Normal',
    hearingTest: 'Passed',
    familyHistory: 'No significant family history',
    pastMedicalHistory: 'Healthy child, regular checkups',
    medications: 'Vitamin D drops',
    fatherName: 'Michael Johnson',
    fatherAge: '32',
    fatherOccupation: 'Engineer',
    motherName: 'Lisa Johnson',
    motherAge: '29',
    motherOccupation: 'Teacher',
    followUpDates: [
      {
        id: 'follow_001',
        date: '2025-02-15',
        notes: 'Regular 6-month checkup',
        completed: false
      },
      {
        id: 'follow_002',
        date: '2024-12-15',
        notes: '4-month vaccination',
        completed: true
      }
    ],
    immunizations: [
      { vaccine: 'BCG', first: '2020-03-16', second: '', third: '', boosters: '', reaction: 'None' },
      { vaccine: 'HEPATITIS B', first: '2020-03-16', second: '2020-04-16', third: '2020-09-16', boosters: '', reaction: 'Mild redness' },
      { vaccine: 'DPT', first: '2020-05-15', second: '2020-07-15', third: '2020-09-15', boosters: '2021-03-15', reaction: 'None' }
    ],
    createdAt: '2024-03-15T10:30:00.000Z',
    updatedAt: '2024-12-15T14:20:00.000Z'
  },
  {
    id: 'patient_002',
    patientName: 'Lucas Martinez',
    birthday: '2019-08-22',
    gender: 'M',
    nickname: 'Luke',
    address: '456 Oak Avenue, Springfield, IL 62702',
    contactNumbers: '(555) 234-5678',
    order: '2nd child',
    religion: 'Catholic',
    nationality: 'American',
    referredBy: 'Dr. James Rodriguez',
    prenatalBirthHistory: 'Gestational diabetes managed with diet',
    manner: 'Cesarean section',
    birthplace: 'Springfield Medical Center',
    gestationalAge: '38 weeks',
    apgar: '8/9',
    bloodType: 'A+',
    momBloodType: 'A+',
    dadBloodType: 'B+',
    birthWeight: '3.5 kg',
    birthLength: '52 cm',
    headCircumference: '36 cm',
    chestCircumference: '34 cm',
    abdominalCircumference: '33 cm',
    newbornScreening: 'Normal',
    hearingTest: 'Passed',
    familyHistory: 'Maternal diabetes',
    pastMedicalHistory: 'Mild jaundice at birth, resolved',
    medications: 'None currently',
    fatherName: 'Carlos Martinez',
    fatherAge: '35',
    fatherOccupation: 'Mechanic',
    motherName: 'Maria Martinez',
    motherAge: '31',
    motherOccupation: 'Nurse',
    followUpDates: [
      {
        id: 'follow_003',
        date: '2025-01-22',
        notes: 'Annual physical exam',
        completed: false
      },
      {
        id: 'follow_004',
        date: '2024-08-22',
        notes: '5-year birthday checkup',
        completed: true
      }
    ],
    immunizations: [
      { vaccine: 'BCG', first: '2019-08-23', second: '', third: '', boosters: '', reaction: 'None' },
      { vaccine: 'HEPATITIS B', first: '2019-08-23', second: '2019-09-23', third: '2020-02-23', boosters: '', reaction: 'None' },
      { vaccine: 'DPT', first: '2019-10-22', second: '2019-12-22', third: '2020-02-22', boosters: '2020-08-22, 2024-08-22', reaction: 'Mild fever' },
      { vaccine: 'MMR', first: '2020-08-22', second: '2024-08-22', third: '', boosters: '', reaction: 'None' }
    ],
    createdAt: '2019-08-22T08:15:00.000Z',
    updatedAt: '2024-08-22T16:45:00.000Z'
  },
  {
    id: 'patient_003',
    patientName: 'Sophia Chen',
    birthday: '2021-11-10',
    gender: 'F',
    nickname: 'Sophie',
    address: '789 Pine Road, Springfield, IL 62703',
    contactNumbers: '(555) 345-6789, (555) 876-5432',
    order: '1st child',
    religion: 'Buddhist',
    nationality: 'American',
    referredBy: 'Dr. Amy Liu',
    prenatalBirthHistory: 'Premature rupture of membranes at 37 weeks',
    manner: 'Induced vaginal delivery',
    birthplace: 'Springfield Children\'s Hospital',
    gestationalAge: '37 weeks',
    apgar: '7/8',
    bloodType: 'B+',
    momBloodType: 'B+',
    dadBloodType: 'AB+',
    birthWeight: '2.8 kg',
    birthLength: '48 cm',
    headCircumference: '34 cm',
    chestCircumference: '32 cm',
    abdominalCircumference: '31 cm',
    newbornScreening: 'Normal',
    hearingTest: 'Passed',
    familyHistory: 'No significant history',
    pastMedicalHistory: 'Mild respiratory distress at birth, resolved',
    medications: 'Multivitamin drops',
    fatherName: 'David Chen',
    fatherAge: '28',
    fatherOccupation: 'Software Developer',
    motherName: 'Jennifer Chen',
    motherAge: '26',
    motherOccupation: 'Graphic Designer',
    followUpDates: [
      {
        id: 'follow_005',
        date: '2025-03-10',
        notes: '3-year developmental assessment',
        completed: false
      },
      {
        id: 'follow_006',
        date: '2024-11-10',
        notes: '3rd birthday checkup',
        completed: true
      }
    ],
    immunizations: [
      { vaccine: 'BCG', first: '2021-11-11', second: '', third: '', boosters: '', reaction: 'None' },
      { vaccine: 'HEPATITIS B', first: '2021-11-11', second: '2021-12-11', third: '2022-05-11', boosters: '', reaction: 'None' },
      { vaccine: 'DPT', first: '2022-01-10', second: '2022-03-10', third: '2022-05-10', boosters: '', reaction: 'Mild swelling' },
      { vaccine: 'ROTAVIRUS', first: '2022-01-10', second: '2022-03-10', third: '2022-05-10', boosters: '', reaction: 'None' }
    ],
    createdAt: '2021-11-10T12:00:00.000Z',
    updatedAt: '2024-11-10T09:30:00.000Z'
  }
];

// Simple auth middleware - just checks if token exists
const simpleAuth = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');

  if (!token) {
    return res.status(401).json({ message: 'No token provided' });
  }

  try {
    // Decode the simple token
    const decoded = JSON.parse(atob(token));
    req.userId = decoded.userId;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid token' });
  }
};

// Get user role from token
const getUserRole = (token) => {
  try {
    const decoded = JSON.parse(atob(token));
    // Map user IDs to roles (matching frontend)
    const roleMap = {
      '1': 'doctor',
      '2': 'assistant1',
      '3': 'assistant2'
    };
    return roleMap[decoded.userId] || null;
  } catch (error) {
    return null;
  }
};

// Helper: Choose data source based on MongoDB connection
const getDataSource = (req) => req.isMongoConnected ? 'mongodb' : 'memory';

// Helper: Filter patient data for assistants
const filterForAssistant = (patient) => ({
  id: patient.id,
  patientName: patient.patientName,
  nickname: patient.nickname,
  birthday: patient.birthday,
  gender: patient.gender,
  followUpDates: patient.followUpDates,
  createdAt: patient.createdAt,
  updatedAt: patient.updatedAt
});

// ==========================================
// CRUD ENDPOINTS (WITH MONGODB SUPPORT)
// ==========================================

// GET all patients
router.get('/', simpleAuth, async (req, res) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    const userRole = getUserRole(token);

    let patients;

    if (getDataSource(req) === 'mongodb') {
      // MongoDB: exclude soft-deleted records
      patients = await Patient.find({ _deleted: { $ne: true } })
        .sort({ updatedAt: -1 })
        .lean();
      // Transform immunization data for compatibility
      patients = patients.map(transformPatientForRead);
    } else {
      patients = FAKE_PATIENTS;
    }

    if (userRole === 'doctor') {
      res.json(patients);
    } else {
      const limitedData = patients.map(filterForAssistant);
      res.json(limitedData);
    }
  } catch (error) {
    console.error('Get patients error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET single patient
router.get('/:id', simpleAuth, async (req, res) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    const userRole = getUserRole(token);

    let patient;

    if (getDataSource(req) === 'mongodb') {
      patient = await Patient.findOne({
        id: req.params.id,
        _deleted: { $ne: true }
      }).lean();
      // Transform immunization data for compatibility
      patient = transformPatientForRead(patient);
    } else {
      patient = FAKE_PATIENTS.find(p => p.id === req.params.id);
    }

    if (!patient) {
      return res.status(404).json({ message: 'Patient not found' });
    }

    if (userRole === 'doctor') {
      res.json(patient);
    } else {
      res.json(filterForAssistant(patient));
    }
  } catch (error) {
    console.error('Get patient error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST check for duplicate patient
router.post('/check-duplicate', simpleAuth, async (req, res) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    const userRole = getUserRole(token);

    if (userRole !== 'doctor') {
      return res.status(403).json({ message: 'Access denied. Doctor role required.' });
    }

    if (getDataSource(req) !== 'mongodb') {
      // Memory mode doesn't support duplicate checking
      return res.json({ duplicate: false });
    }

    const { patientName, birthday, gender, motherName, fatherName } = req.body;

    if (!patientName || !birthday) {
      return res.json({ duplicate: false });
    }

    const existingPatient = await Patient.findOne({
      patientName: { $regex: new RegExp(`^${patientName.trim()}$`, 'i') },
      birthday: birthday,
      gender: gender,
      motherName: { $regex: new RegExp(`^${(motherName || '').trim()}$`, 'i') },
      fatherName: { $regex: new RegExp(`^${(fatherName || '').trim()}$`, 'i') },
      _deleted: { $ne: true }
    });

    if (existingPatient) {
      return res.status(409).json({
        message: 'Potential duplicate patient found',
        duplicate: true,
        existingPatient: {
          id: existingPatient.id,
          patientName: existingPatient.patientName,
          birthday: existingPatient.birthday,
          gender: existingPatient.gender,
          motherName: existingPatient.motherName,
          fatherName: existingPatient.fatherName
        }
      });
    }

    res.json({ duplicate: false });
  } catch (error) {
    console.error('Check duplicate error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST create patient
router.post('/', simpleAuth, async (req, res) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    const userRole = getUserRole(token);

    if (userRole !== 'doctor') {
      return res.status(403).json({ message: 'Access denied. Doctor role required.' });
    }

    // Check for duplicate patient (only for MongoDB)
    if (getDataSource(req) === 'mongodb' && req.body.patientName && req.body.birthday) {
      const existingPatient = await Patient.findOne({
        patientName: { $regex: new RegExp(`^${req.body.patientName.trim()}$`, 'i') },
        birthday: req.body.birthday,
        gender: req.body.gender,
        motherName: { $regex: new RegExp(`^${(req.body.motherName || '').trim()}$`, 'i') },
        fatherName: { $regex: new RegExp(`^${(req.body.fatherName || '').trim()}$`, 'i') },
        _deleted: { $ne: true }
      });

      if (existingPatient) {
        return res.status(409).json({
          message: 'Potential duplicate patient found',
          duplicate: true,
          existingPatient: {
            id: existingPatient.id,
            patientName: existingPatient.patientName,
            birthday: existingPatient.birthday,
            gender: existingPatient.gender,
            motherName: existingPatient.motherName,
            fatherName: existingPatient.fatherName
          }
        });
      }
    }

    const now = new Date().toISOString();
    const newPatient = {
      ...req.body,
      id: req.body.id || generateId(),
      createdAt: req.body.createdAt || now,
      updatedAt: now,
      _version: 1,
      _deleted: false
    };

    if (getDataSource(req) === 'mongodb') {
      const patient = new Patient(newPatient);
      await patient.save();
      console.log('Patient created (MongoDB):', newPatient.patientName);
      res.status(201).json(patient.toObject());
    } else {
      FAKE_PATIENTS.unshift(newPatient);
      console.log('Patient created (memory):', newPatient.patientName);
      res.status(201).json(newPatient);
    }
  } catch (error) {
    console.error('Create patient error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Helper: Transform immunizations to ensure boosters is always an array (for writing)
const transformImmunizations = (immunizations) => {
  if (!Array.isArray(immunizations)) return immunizations;

  return immunizations.map(imm => {
    // If boosters is a string (old format), convert to empty array
    if (typeof imm.boosters === 'string') {
      return {
        ...imm,
        boosters: []
      };
    }
    // If boosters is already an array, keep it
    return imm;
  });
};

// Helper: Transform patient data for reading (ensure boosters is always an array)
const transformPatientForRead = (patient) => {
  if (!patient) return patient;

  if (patient.immunizations && Array.isArray(patient.immunizations)) {
    patient.immunizations = patient.immunizations.map(imm => ({
      ...imm,
      boosters: Array.isArray(imm.boosters) ? imm.boosters : []
    }));
  }

  return patient;
};

// PUT update patient
router.put('/:id', simpleAuth, async (req, res) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    const userRole = getUserRole(token);

    if (userRole !== 'doctor') {
      return res.status(403).json({ message: 'Access denied. Doctor role required.' });
    }

    const now = new Date().toISOString();

    if (getDataSource(req) === 'mongodb') {
      // Exclude _version from body to avoid conflict with $inc
      const { _version, ...bodyWithoutVersion } = req.body;

      // Transform immunizations to ensure proper format
      if (bodyWithoutVersion.immunizations) {
        bodyWithoutVersion.immunizations = transformImmunizations(bodyWithoutVersion.immunizations);
      }

      const updatedPatient = await Patient.findOneAndUpdate(
        { id: req.params.id, _deleted: { $ne: true } },
        {
          $set: { ...bodyWithoutVersion, updatedAt: now },
          $inc: { _version: 1 }
        },
        { new: true, runValidators: false }
      ).lean();

      if (!updatedPatient) {
        return res.status(404).json({ message: 'Patient not found' });
      }

      console.log('Patient updated (MongoDB):', updatedPatient.patientName);
      // Log immunization data for debugging
      if (updatedPatient.immunizations) {
        const withBoosters = updatedPatient.immunizations.filter(i => i.boosters && i.boosters.length > 0);
        console.log(`  - Immunizations with boosters: ${withBoosters.length}`);
      }
      res.json(updatedPatient);
    } else {
      const patientIndex = FAKE_PATIENTS.findIndex(p => p.id === req.params.id);

      if (patientIndex === -1) {
        return res.status(404).json({ message: 'Patient not found' });
      }

      const updatedPatient = {
        ...FAKE_PATIENTS[patientIndex],
        ...req.body,
        updatedAt: now,
      };
      FAKE_PATIENTS[patientIndex] = updatedPatient;
      console.log('Patient updated (memory):', updatedPatient.patientName);
      res.json(updatedPatient);
    }
  } catch (error) {
    console.error('Update patient error:', error);
    console.error('Error details:', error.message);
    if (error.errors) {
      console.error('Validation errors:', JSON.stringify(error.errors, null, 2));
    }
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// DELETE patient (soft delete for MongoDB)
router.delete('/:id', simpleAuth, async (req, res) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    const userRole = getUserRole(token);

    if (userRole !== 'doctor') {
      return res.status(403).json({ message: 'Access denied. Doctor role required.' });
    }

    const now = new Date().toISOString();

    if (getDataSource(req) === 'mongodb') {
      // Soft delete: mark as deleted instead of removing
      const result = await Patient.findOneAndUpdate(
        { id: req.params.id },
        {
          $set: { _deleted: true, updatedAt: now },
          $inc: { _version: 1 }
        },
        { new: true }
      );

      if (!result) {
        return res.status(404).json({ message: 'Patient not found' });
      }

      console.log('Patient deleted (MongoDB, soft):', result.patientName);
      res.status(204).send();
    } else {
      const patientIndex = FAKE_PATIENTS.findIndex(p => p.id === req.params.id);

      if (patientIndex === -1) {
        return res.status(404).json({ message: 'Patient not found' });
      }

      const [deletedPatient] = FAKE_PATIENTS.splice(patientIndex, 1);
      console.log('Patient deleted (memory):', deletedPatient.patientName);
      res.status(204).send();
    }
  } catch (error) {
    console.error('Delete patient error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// ==========================================
// ASSISTANT FOLLOW-UP UPDATE ENDPOINT
// ==========================================

/**
 * PATCH /api/patients/:patientId/followups/:followUpId
 *
 * Allows assistants to update reminded/confirmed status of follow-ups.
 * This is a limited update endpoint for assistants only.
 */
router.patch('/:patientId/followups/:followUpId', simpleAuth, async (req, res) => {
  try {
    const { patientId, followUpId } = req.params;
    const { reminded, confirmed } = req.body;

    console.log(`PATCH follow-up: patient=${patientId}, followUp=${followUpId}, reminded=${reminded}, confirmed=${confirmed}`);

    let patient;
    let followUpDates;

    if (getDataSource(req) === 'mongodb') {
      // Use .lean() to get plain JavaScript object
      patient = await Patient.findOne({
        id: patientId,
        _deleted: { $ne: true }
      }).lean();

      if (!patient) {
        return res.status(404).json({ message: 'Patient not found' });
      }

      // Make a copy of followUpDates array
      followUpDates = patient.followUpDates ? [...patient.followUpDates] : [];
    } else {
      patient = FAKE_PATIENTS.find(p => p.id === patientId);
      if (!patient) {
        return res.status(404).json({ message: 'Patient not found' });
      }
      followUpDates = patient.followUpDates ? [...patient.followUpDates] : [];
    }

    // Find the follow-up
    const followUpIndex = followUpDates.findIndex(f => f.id === followUpId);

    if (followUpIndex === -1) {
      return res.status(404).json({ message: 'Follow-up not found' });
    }

    // Update only allowed fields - create new object to ensure clean data
    followUpDates[followUpIndex] = {
      ...followUpDates[followUpIndex],
      ...(reminded !== undefined && { reminded }),
      ...(confirmed !== undefined && { confirmed })
    };

    const now = new Date().toISOString();

    if (getDataSource(req) === 'mongodb') {
      const result = await Patient.findOneAndUpdate(
        { id: patientId },
        {
          $set: {
            followUpDates: followUpDates,
            updatedAt: now
          },
          $inc: { _version: 1 }
        },
        { new: true }
      );
      console.log(`Assistant updated follow-up ${followUpId} for patient ${patientId}:`,
        result ? 'success' : 'failed');
    } else {
      // Update in-memory
      const patientIndex = FAKE_PATIENTS.findIndex(p => p.id === patientId);
      FAKE_PATIENTS[patientIndex] = { ...patient, followUpDates, updatedAt: now };
    }

    res.json({
      message: 'Follow-up updated',
      followUp: followUpDates[followUpIndex]
    });
  } catch (error) {
    console.error('Update follow-up error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// ==========================================
// SYNC ENDPOINT
// ==========================================

/**
 * POST /api/patients/sync
 *
 * Bi-directional sync endpoint using last-write-wins strategy.
 *
 * Request body:
 * {
 *   lastSyncedAt: string | null,  // ISO timestamp of last successful sync
 *   deviceId: string,              // Unique device identifier
 *   changes: [                     // Local changes since last sync
 *     {
 *       operation: 'create' | 'update' | 'delete',
 *       data: PatientDocument,
 *       timestamp: string          // When the change was made locally
 *     }
 *   ]
 * }
 *
 * Response:
 * {
 *   serverChanges: PatientDocument[],  // Changes from server since lastSyncedAt
 *   syncedAt: string,                   // New sync timestamp
 *   appliedChanges: [],                 // Status of each applied change
 *   conflicts: []                       // (Empty for last-write-wins)
 * }
 */
router.post('/sync', simpleAuth, async (req, res) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    const userRole = getUserRole(token);

    if (userRole !== 'doctor') {
      return res.status(403).json({ message: 'Access denied. Doctor role required.' });
    }

    if (getDataSource(req) !== 'mongodb') {
      return res.status(503).json({
        message: 'Sync not available in memory mode. Configure MongoDB.'
      });
    }

    const { lastSyncedAt, deviceId, changes = [] } = req.body;
    const syncTimestamp = new Date().toISOString();

    console.log(`Sync request from device ${deviceId}: ${changes.length} changes, lastSync: ${lastSyncedAt || 'never'}`);

    // Step 1: Apply local changes to server using last-write-wins
    const appliedChanges = [];

    for (const change of changes) {
      const { operation, data: rawData, timestamp } = change;

      // Transform immunizations in sync data
      const data = {
        ...rawData,
        immunizations: rawData.immunizations ? transformImmunizations(rawData.immunizations) : rawData.immunizations
      };

      try {
        if (operation === 'create') {
          // Check if already exists (might have been synced from another device)
          const existing = await Patient.findOne({ id: data.id });

          if (existing) {
            // Last-write-wins: update if local is newer
            if (data.updatedAt > existing.updatedAt) {
              // Exclude _version to avoid conflict with $inc
              const { _version, ...dataWithoutVersion } = data;
              await Patient.findOneAndUpdate(
                { id: data.id },
                {
                  $set: { ...dataWithoutVersion, _lastSyncedAt: syncTimestamp, _deviceId: deviceId },
                  $inc: { _version: 1 }
                }
              );
              console.log(`Sync: Updated existing patient ${data.id} (local newer)`);
            }
          } else {
            // New record
            const patient = new Patient({
              ...data,
              _lastSyncedAt: syncTimestamp,
              _deviceId: deviceId,
              _version: 1
            });
            await patient.save();
            console.log(`Sync: Created new patient ${data.id}`);
          }
          appliedChanges.push({ id: data.id, operation, status: 'applied' });

        } else if (operation === 'update') {
          const existing = await Patient.findOne({ id: data.id });

          if (!existing) {
            // Record doesn't exist, create it
            const patient = new Patient({
              ...data,
              _lastSyncedAt: syncTimestamp,
              _deviceId: deviceId,
              _version: 1
            });
            await patient.save();
            console.log(`Sync: Created patient ${data.id} (was update, didn't exist)`);
          } else if (data.updatedAt > existing.updatedAt) {
            // Last-write-wins: local is newer
            // Exclude _version to avoid conflict with $inc
            const { _version, ...dataWithoutVersion } = data;
            await Patient.findOneAndUpdate(
              { id: data.id },
              {
                $set: { ...dataWithoutVersion, _lastSyncedAt: syncTimestamp, _deviceId: deviceId },
                $inc: { _version: 1 }
              }
            );
            console.log(`Sync: Updated patient ${data.id} (local newer)`);
          } else {
            console.log(`Sync: Skipped update for ${data.id} (server newer)`);
          }
          appliedChanges.push({ id: data.id, operation, status: 'applied' });

        } else if (operation === 'delete') {
          const existing = await Patient.findOne({ id: data.id });

          if (existing && data.updatedAt > existing.updatedAt) {
            // Soft delete
            await Patient.findOneAndUpdate(
              { id: data.id },
              {
                $set: {
                  _deleted: true,
                  updatedAt: data.updatedAt,
                  _lastSyncedAt: syncTimestamp,
                  _deviceId: deviceId
                },
                $inc: { _version: 1 }
              }
            );
            console.log(`Sync: Soft deleted patient ${data.id}`);
          }
          appliedChanges.push({ id: data.id, operation, status: 'applied' });
        }
      } catch (err) {
        console.error(`Sync error for ${operation} ${data.id}:`, err);
        appliedChanges.push({ id: data.id, operation, status: 'error', error: err.message });
      }
    }

    // Step 2: Get server changes since lastSyncedAt
    let serverChanges;

    if (lastSyncedAt) {
      // Incremental sync: only changes after lastSyncedAt
      serverChanges = await Patient.find({
        updatedAt: { $gt: lastSyncedAt }
      }).lean();
    } else {
      // Full sync: all records (including deleted for sync awareness)
      serverChanges = await Patient.find({}).lean();
    }

    // Filter out changes that came from this device in this sync
    serverChanges = serverChanges.filter(p =>
      !(p._deviceId === deviceId && p._lastSyncedAt === syncTimestamp)
    );

    // Transform immunization data for compatibility
    serverChanges = serverChanges.map(transformPatientForRead);

    console.log(`Sync response: ${serverChanges.length} server changes, ${appliedChanges.length} applied`);

    res.json({
      serverChanges,
      syncedAt: syncTimestamp,
      appliedChanges,
      conflicts: [] // Empty for last-write-wins
    });

  } catch (error) {
    console.error('Sync error:', error);
    res.status(500).json({ message: 'Sync failed', error: error.message });
  }
});

module.exports = router;
