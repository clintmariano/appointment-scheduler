const express = require('express');
const csv = require('csv-parser');
const { Readable } = require('stream');
const Patient = require('../models/Patient');
const { VACCINES } = require('../utils/constants');
const multer = require('multer');
const router = express.Router();

// Memory storage for cleaner handling
const upload = multer({ storage: multer.memoryStorage() });

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

// POST /api/import/patients
router.post('/patients', simpleAuth, upload.single('csv'), async (req, res) => {
  try {
    // Check for doctor role
    const token = req.header('Authorization')?.replace('Bearer ', '');
    const userRole = getUserRole(token);

    if (userRole !== 'doctor') {
      return res.status(403).json({ message: 'Access denied. Doctor role required.' });
    }

    if (!req.file) {
      return res.status(400).json({ message: 'No CSV file uploaded' });
    }

    if (!req.isMongoConnected) {
      return res.status(503).json({ message: 'Import requires MongoDB connection.' });
    }

    const results = [];
    const errors = [];
    const now = new Date().toISOString();

    // Parse CSV from memory buffer
    const bufferStream = new Readable();
    bufferStream.push(req.file.buffer);
    bufferStream.push(null);

    await new Promise((resolve, reject) => {
      bufferStream
        .pipe(csv({
          skipEmptyLines: true,
          trim: true,
          mapHeaders: ({ header }) => header.trim()
        }))
        .on('data', (data) => {
          results.push(data);
        })
        .on('end', resolve)
        .on('error', reject);
    });

    // Process results
    const patients = [];

    for (const row of results) {
      try {
        // Validate required fields
        if (!row.patientName || !row.birthday || !row.gender) {
          errors.push({ row: { patientName: row.patientName || '(no name)' }, error: 'Missing required fields: patientName, birthday, gender' });
          continue;
        }

        // Validate gender
        const gender = row.gender.toUpperCase();
        if (gender !== 'M' && gender !== 'F') {
          errors.push({ row: { patientName: row.patientName }, error: 'Gender must be M or F' });
          continue;
        }

        // Validate and convert date format (accepts MM/DD/YYYY or YYYY-MM-DD)
        let birthday = row.birthday;
        const mmddyyyyRegex = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/;
        const yyyymmddRegex = /^\d{4}-\d{2}-\d{2}$/;

        if (mmddyyyyRegex.test(birthday)) {
          // Convert MM/DD/YYYY to YYYY-MM-DD
          const match = birthday.match(mmddyyyyRegex);
          const month = match[1].padStart(2, '0');
          const day = match[2].padStart(2, '0');
          const year = match[3];
          birthday = `${year}-${month}-${day}`;
        } else if (!yyyymmddRegex.test(birthday)) {
          errors.push({ row: { patientName: row.patientName }, error: 'Birthday must be in MM/DD/YYYY format (e.g., 03/15/2023)' });
          continue;
        }

        // Create patient document
        const patient = {
          id: row.id || `PAT_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          patientName: row.patientName.trim(),
          birthday: birthday,
          gender: gender,
          nickname: row.nickname || '',
          address: row.address || '',
          contactNumbers: row.contactNumbers || '',
          guardianPhone: row.guardianPhone || '',
          smsConsent: row.smsConsent?.toLowerCase() === 'true',
          order: row.order || '',
          religion: row.religion || '',
          nationality: row.nationality || '',
          referredBy: row.referredBy || '',
          prenatalBirthHistory: '',
          manner: row.manner || '',
          birthplace: row.birthplace || '',
          gestationalAge: row.gestationalAge || '',
          apgar: row.apgar || '',
          bloodType: row.bloodType || '',
          momBloodType: row.momBloodType || '',
          dadBloodType: row.dadBloodType || '',
          birthWeight: row.birthWeight || '',
          birthLength: row.birthLength || '',
          headCircumference: row.headCircumference || '',
          chestCircumference: row.chestCircumference || '',
          abdominalCircumference: row.abdominalCircumference || '',
          newbornScreening: '',
          hearingTest: '',
          familyHistory: '',
          pastMedicalHistory: '',
          medications: '',
          fatherName: row.fatherName || '',
          fatherAge: row.fatherAge || '',
          fatherOccupation: row.fatherOccupation || '',
          motherName: row.motherName || '',
          motherAge: row.motherAge || '',
          motherOccupation: row.motherOccupation || '',
          followUpDates: [],
          immunizations: VACCINES.map(v => ({
            vaccine: v,
            first: '',
            second: '',
            third: '',
            boosters: []
          })),
          soapVisits: [],
          createdAt: now,
          updatedAt: now,
          _version: 1,
          _deleted: false
        };

        // Check for duplicate before adding to patients array
        const isDuplicate = await Patient.findOne({
          patientName: { $regex: new RegExp(`^${patient.patientName}$`, 'i') },
          birthday: patient.birthday,
          gender: patient.gender,
          motherName: { $regex: new RegExp(`^${patient.motherName || ''}$`, 'i') },
          fatherName: { $regex: new RegExp(`^${patient.fatherName || ''}$`, 'i') },
          _deleted: { $ne: true }
        });

        if (isDuplicate) {
          errors.push({
            row: { patientName: patient.patientName },
            error: `Duplicate: Patient already exists (ID: ${isDuplicate.id})`
          });
          continue; // Skip this record
        }

        patients.push(patient);
      } catch (err) {
        errors.push({ row: { patientName: row.patientName || '(no name)' }, error: err.message });
      }
    }

    // Insert to MongoDB in batch
    if (patients.length > 0) {
      await Patient.insertMany(patients);
    }

    res.json({
      success: true,
      imported: patients.length,
      errors: errors.length,
      errorDetails: errors
    });
  } catch (error) {
    console.error('CSV import error:', error);
    res.status(500).json({ message: 'Import failed', error: error.message });
  }
});

module.exports = router;
