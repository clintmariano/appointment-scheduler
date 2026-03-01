#!/usr/bin/env node

/**
 * CSV Patient Import CLI Script
 *
 * Usage:
 *   node scripts/import-csv.js path/to/patients.csv
 *
 * Requirements:
 *   - MongoDB must be connected
 *   - CSV file must follow the template format
 */

const fs = require('fs');
const csv = require('csv-parser');
const path = require('path');
require('dotenv').config();

const mongoose = require('mongoose');
const Patient = require('../server/models/Patient');
const { VACCINES } = require('../server/utils/constants');

// CSV headers for validation
const REQUIRED_HEADERS = ['patientName', 'birthday', 'gender'];

// Parse CSV and return rows
async function parseCSV(filePath) {
  return new Promise((resolve, reject) => {
    const results = [];

    fs.createReadStream(filePath)
      .pipe(csv({
        skipEmptyLines: true,
        trim: true,
        mapHeaders: ({ header }) => header.trim(),
        // Ensure quotes are handled properly
        quote: '"',
        escape: '"',
        relaxColumnCount: false
      }))
      .on('data', (data) => {
        results.push(data);
      })
      .on('end', () => {
        // Debug: show first row keys
        if (results.length > 0) {
          console.log('🔍 CSV Headers detected:');
          console.log('   ' + Object.keys(results[0]).join(', '));
          console.log();
        }
        resolve(results);
      })
      .on('error', reject);
  });
}

// Validate and transform row to patient document
function transformRow(row, index) {
  const errors = [];

  // Validate required fields
  if (!row.patientName) errors.push('Missing patientName');
  if (!row.birthday) errors.push('Missing birthday');
  if (!row.gender) errors.push('Missing gender');

  // Validate gender
  const gender = row.gender?.toUpperCase();
  if (gender !== 'M' && gender !== 'F') {
    errors.push('Gender must be M or F');
  }

  // Validate date format
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (row.birthday && !dateRegex.test(row.birthday)) {
    errors.push('Birthday must be in YYYY-MM-DD format');
  }

  if (errors.length > 0) {
    return { error: errors.join(', '), row };
  }

  const now = new Date().toISOString();

  // Always generate a random ID (ignore CSV id column)
  const generateId = () => {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substr(2, 9);
    return `PAT_${timestamp}${random}`;
  };

  return {
    patient: {
      id: generateId(),
      patientName: row.patientName.trim(),
      birthday: row.birthday,
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
    },
    row
  };
}

// Main import function
async function importCSV(filePath) {
  console.log(`\n📂 Reading CSV file: ${filePath}\n`);

  // Parse CSV
  const rows = await parseCSV(filePath);
  console.log(`📊 Found ${rows.length} row(s) in CSV\n`);

  if (rows.length === 0) {
    console.log('⚠️  No data found in CSV file');
    return;
  }

  // Transform rows
  const patients = [];
  const errors = [];

  rows.forEach((row, index) => {
    const result = transformRow(row, index + 1);
    if (result.error) {
      errors.push({ row: index + 1, name: row.patientName || '(no name)', error: result.error });
    } else {
      patients.push(result.patient);
    }
  });

  // Show errors
  if (errors.length > 0) {
    console.log('⚠️  Validation errors:\n');
    errors.forEach(err => {
      console.log(`   Row ${err.row} (${err.name}): ${err.error}`);
    });
    console.log();
  }

  if (patients.length === 0) {
    console.log('❌ No valid patients to import');
    return;
  }

  console.log(`✅ ${patients.length} valid patient(s) ready to import`);
  console.log(`⚠️  ${errors.length} row(s) skipped due to errors\n`);

  // Import to MongoDB
  try {
    console.log('💾 Inserting into MongoDB...');
    await Patient.insertMany(patients);
    console.log(`\n✅ Successfully imported ${patients.length} patient(s)!\n`);

    // Show summary
    console.log('📋 Import Summary:');
    console.log(`   Total rows: ${rows.length}`);
    console.log(`   Imported: ${patients.length}`);
    console.log(`   Skipped: ${errors.length}\n`);

    // List imported patients
    console.log('📝 Imported Patients:');
    patients.forEach((p, i) => {
      console.log(`   ${i + 1}. ${p.patientName} (${p.id})`);
    });
    console.log();

  } catch (error) {
    // Check for duplicate key errors
    if (error.code === 11000) {
      const dupField = Object.keys(error.keyPattern)[0];
      const dupValue = error.keyPattern[dupField];
      console.log(`\n❌ Duplicate key error: ${dupField}="${dupValue}"`);
      console.log('   A patient with this ID already exists in the database.\n');
    } else {
      console.log(`\n❌ Import failed: ${error.message}\n`);
    }
  }
}

// Main
(async () => {
  const filePath = process.argv[2];

  if (!filePath) {
    console.log('\n❌ Error: Please provide a CSV file path\n');
    console.log('Usage: node scripts/import-csv.js <path-to-csv>\n');
    console.log('Example: node scripts/import-csv.js ./patients.csv\n');
    process.exit(1);
  }

  const fullPath = path.resolve(filePath);

  if (!fs.existsSync(fullPath)) {
    console.log(`\n❌ Error: File not found: ${fullPath}\n`);
    process.exit(1);
  }

  // Connect to MongoDB
  console.log('🔌 Connecting to MongoDB...');
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      retryWrites: true,
      w: 'majority'
    });
    console.log('✅ Connected to MongoDB\n');
  } catch (error) {
    console.log(`\n❌ MongoDB connection failed: ${error.message}\n`);
    console.log('Make sure MONGODB_URI is set in your .env file\n');
    process.exit(1);
  }

  // Run import
  await importCSV(fullPath);

  // Close connection
  await mongoose.connection.close();
  console.log('👋 Done!\n');
})();
