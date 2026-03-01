const express = require('express');
const smsService = require('../services/smsService');
const Patient = require('../models/Patient');
const router = express.Router();

// Auth middleware (same as patients.js)
const simpleAuth = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');

  if (!token) {
    return res.status(401).json({ message: 'No token provided' });
  }

  try {
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

/**
 * GET /api/sms/status
 * Check if SMS service is configured and get balance
 */
router.get('/status', simpleAuth, async (req, res) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    const userRole = getUserRole(token);

    if (userRole !== 'doctor') {
      return res.status(403).json({ message: 'Access denied. Doctor role required.' });
    }

    const isConfigured = smsService.isConfigured();

    if (!isConfigured) {
      return res.json({
        configured: false,
        message: 'SMS service not configured. Add SEMAPHORE_API_KEY to .env'
      });
    }

    const balanceResult = await smsService.getBalance();

    res.json({
      configured: true,
      balance: balanceResult.success ? balanceResult.balance : null,
      accountName: balanceResult.success ? balanceResult.accountName : null,
      error: balanceResult.error
    });
  } catch (error) {
    console.error('SMS status error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * POST /api/sms/validate-number
 * Validate a Philippine phone number
 */
router.post('/validate-number', simpleAuth, (req, res) => {
  const { phoneNumber } = req.body;

  if (!phoneNumber) {
    return res.status(400).json({ message: 'Phone number is required' });
  }

  const isValid = smsService.isValidPhoneNumber(phoneNumber);
  const formatted = smsService.formatPhoneNumber(phoneNumber);

  res.json({
    valid: isValid,
    formatted: isValid ? formatted : null,
    original: phoneNumber
  });
});

/**
 * POST /api/sms/send
 * Send a custom SMS message
 */
router.post('/send', simpleAuth, async (req, res) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    const userRole = getUserRole(token);

    if (userRole !== 'doctor') {
      return res.status(403).json({ message: 'Access denied. Doctor role required.' });
    }

    const { phoneNumber, message } = req.body;

    if (!phoneNumber || !message) {
      return res.status(400).json({ message: 'Phone number and message are required' });
    }

    if (message.length > 300) {
      return res.status(400).json({ message: 'Message too long (max 300 characters)' });
    }

    const result = await smsService.sendSMS(phoneNumber, message);

    if (result.success) {
      res.json({
        success: true,
        messageId: result.messageId,
        recipient: result.recipient
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error
      });
    }
  } catch (error) {
    console.error('Send SMS error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * POST /api/sms/send-reminder
 * Send follow-up reminder SMS for a patient
 */
router.post('/send-reminder', simpleAuth, async (req, res) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    const userRole = getUserRole(token);

    if (userRole !== 'doctor') {
      return res.status(403).json({ message: 'Access denied. Doctor role required.' });
    }

    const { patient, followUp, clinicName } = req.body;

    if (!patient || !followUp) {
      return res.status(400).json({ message: 'Patient and followUp data are required' });
    }

    const result = await smsService.sendFollowUpReminder(
      patient,
      followUp,
      clinicName || 'MY PEDIA Clinic'
    );

    if (result.success) {
      res.json({
        success: true,
        messageId: result.messageId,
        recipient: result.recipient,
        sentAt: result.sentAt
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error
      });
    }
  } catch (error) {
    console.error('Send reminder error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * POST /api/sms/test-scheduled
 * Manually trigger scheduled SMS reminders (for testing)
 * Body: { reminderType: '3day' | 'sameday' | 'both' }
 */
router.post('/test-scheduled', simpleAuth, async (req, res) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    const userRole = getUserRole(token);

    if (userRole !== 'doctor') {
      return res.status(403).json({ message: 'Access denied. Doctor role required.' });
    }

    const { reminderType = 'both' } = req.body;
    const results = {};

    if (reminderType === '3day' || reminderType === 'both') {
      results.threeDayReminder = await smsService.sendScheduledReminders(Patient, '3day');
    }

    if (reminderType === 'sameday' || reminderType === 'both') {
      results.sameDayReminder = await smsService.sendScheduledReminders(Patient, 'sameday');
    }

    res.json({
      success: true,
      message: 'Scheduled reminders triggered',
      results
    });
  } catch (error) {
    console.error('Test scheduled reminders error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

/**
 * GET /api/sms/upcoming-reminders
 * Get list of upcoming follow-ups that will receive reminders
 */
router.get('/upcoming-reminders', simpleAuth, async (req, res) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    const userRole = getUserRole(token);

    if (userRole !== 'doctor') {
      return res.status(403).json({ message: 'Access denied. Doctor role required.' });
    }

    // Get dates for today and 3 days from now
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const threeDaysFromNow = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    // Find patients with upcoming follow-ups
    const patients = await Patient.find({
      '_deleted': { $ne: true },
      'smsConsent': true,
      'guardianPhone': { $exists: true, $ne: '' },
      'followUpDates': {
        $elemMatch: {
          'date': { $in: [today, threeDaysFromNow] },
          'completed': { $ne: true },
          'smsReminder.enabled': true
        }
      }
    }).select('patientName nickname guardianPhone followUpDates');

    const upcomingReminders = [];

    for (const patient of patients) {
      for (const followUp of patient.followUpDates) {
        if (followUp.smsReminder?.enabled && !followUp.completed) {
          if (followUp.date === today) {
            upcomingReminders.push({
              patientName: patient.patientName,
              nickname: patient.nickname,
              phone: patient.guardianPhone,
              followUpDate: followUp.date,
              reminderType: 'sameday',
              alreadySent: !!followUp.smsReminder?.sentSameday
            });
          }
          if (followUp.date === threeDaysFromNow) {
            upcomingReminders.push({
              patientName: patient.patientName,
              nickname: patient.nickname,
              phone: patient.guardianPhone,
              followUpDate: followUp.date,
              reminderType: '3day',
              alreadySent: !!followUp.smsReminder?.sent3day
            });
          }
        }
      }
    }

    res.json({
      today,
      threeDaysFromNow,
      upcomingReminders
    });
  } catch (error) {
    console.error('Get upcoming reminders error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
