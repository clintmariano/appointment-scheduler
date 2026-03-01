/**
 * SMS Service using Semaphore API
 * https://semaphore.co/docs
 */

const SEMAPHORE_API_URL = 'https://api.semaphore.co/api/v4/messages';

class SMSService {
  constructor() {
    this.apiKey = process.env.SEMAPHORE_API_KEY;
    this.senderName = process.env.SEMAPHORE_SENDER_NAME || 'MYPEDIA';
  }

  /**
   * Check if SMS service is configured
   */
  isConfigured() {
    return !!this.apiKey;
  }

  /**
   * Format Philippine phone number to international format
   * Accepts: 09171234567, 9171234567, +639171234567, 639171234567
   * Returns: 639171234567 (without +)
   */
  formatPhoneNumber(phone) {
    if (!phone) return null;

    // Remove all non-numeric characters except +
    let cleaned = phone.replace(/[^\d+]/g, '');

    // Remove leading +
    cleaned = cleaned.replace(/^\+/, '');

    // Handle different formats
    if (cleaned.startsWith('09') && cleaned.length === 11) {
      // 09171234567 -> 639171234567
      return '63' + cleaned.substring(1);
    } else if (cleaned.startsWith('9') && cleaned.length === 10) {
      // 9171234567 -> 639171234567
      return '63' + cleaned;
    } else if (cleaned.startsWith('63') && cleaned.length === 12) {
      // Already in correct format
      return cleaned;
    }

    // Return as-is if format not recognized
    return cleaned;
  }

  /**
   * Validate Philippine phone number
   */
  isValidPhoneNumber(phone) {
    const formatted = this.formatPhoneNumber(phone);
    if (!formatted) return false;

    // Must be 12 digits starting with 63
    if (!/^63\d{10}$/.test(formatted)) return false;

    // Check for valid Philippine mobile prefixes (Globe, Smart, Sun, etc.)
    const validPrefixes = [
      '817', '905', '906', '907', '908', '909', '910', '911', '912', '913',
      '914', '915', '916', '917', '918', '919', '920', '921', '922', '923',
      '924', '925', '926', '927', '928', '929', '930', '931', '932', '933',
      '934', '935', '936', '937', '938', '939', '940', '941', '942', '943',
      '944', '945', '946', '947', '948', '949', '950', '951', '953', '954',
      '955', '956', '957', '958', '959', '960', '961', '963', '965', '966',
      '967', '968', '969', '970', '971', '973', '974', '975', '976', '977',
      '978', '979', '981', '989', '991', '992', '993', '994', '995', '996',
      '997', '998', '999'
    ];

    const prefix = formatted.substring(2, 5);
    return validPrefixes.includes(prefix);
  }

  /**
   * Send SMS via Semaphore API
   * @param {string} to - Phone number
   * @param {string} message - Message content (max 160 chars for 1 SMS)
   * @returns {Promise<{success: boolean, messageId?: string, error?: string}>}
   */
  async sendSMS(to, message) {
    if (!this.isConfigured()) {
      return {
        success: false,
        error: 'SMS service not configured. Set SEMAPHORE_API_KEY in .env'
      };
    }

    const formattedNumber = this.formatPhoneNumber(to);
    if (!formattedNumber) {
      return {
        success: false,
        error: 'Invalid phone number format'
      };
    }

    try {
      const response = await fetch(SEMAPHORE_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          apikey: this.apiKey,
          number: formattedNumber,
          message: message,
          sendername: this.senderName
        })
      });

      const data = await response.json();

      if (response.ok && data[0]?.message_id) {
        console.log(`SMS sent successfully to ${formattedNumber}, ID: ${data[0].message_id}`);
        return {
          success: true,
          messageId: data[0].message_id,
          recipient: formattedNumber
        };
      } else {
        const errorMsg = data.error || data.message || 'Unknown error';
        console.error(`SMS failed to ${formattedNumber}:`, errorMsg);
        return {
          success: false,
          error: errorMsg
        };
      }
    } catch (error) {
      console.error('SMS service error:', error);
      return {
        success: false,
        error: error.message || 'Network error'
      };
    }
  }

  /**
   * Send follow-up reminder SMS (manual trigger)
   * @param {Object} patient - Patient document
   * @param {Object} followUp - Follow-up appointment
   * @param {string} clinicName - Clinic name for the message
   */
  async sendFollowUpReminder(patient, followUp, clinicName = 'MY PEDIA Clinic') {
    const guardianPhone = patient.guardianPhone || patient.contactNumbers?.split(',')[0];

    if (!guardianPhone) {
      return {
        success: false,
        error: 'No contact number available'
      };
    }

    // Format the date nicely
    const followUpDate = new Date(followUp.date);
    const formattedDate = followUpDate.toLocaleDateString('en-PH', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    // Get patient's first name (given name)
    const patientName = patient.patientName?.split(',')[1]?.trim() || patient.nickname || 'your child';

    // Compose message (keep under 160 chars for single SMS)
    const message = `Hi! This is a reminder that ${patientName}'s follow-up appointment is on ${formattedDate}. Please call to confirm. - ${clinicName}`;

    const result = await this.sendSMS(guardianPhone, message);

    return {
      ...result,
      patientId: patient.id,
      followUpId: followUp.id,
      sentAt: new Date().toISOString()
    };
  }

  /**
   * Get SMS account balance (Semaphore)
   */
  async getBalance() {
    if (!this.isConfigured()) {
      return { success: false, error: 'SMS service not configured' };
    }

    try {
      const response = await fetch(`https://api.semaphore.co/api/v4/account?apikey=${this.apiKey}`);
      const data = await response.json();

      if (response.ok) {
        return {
          success: true,
          balance: data.credit_balance,
          accountName: data.account_name
        };
      } else {
        return {
          success: false,
          error: data.error || 'Failed to get balance'
        };
      }
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Send scheduled reminders for follow-ups
   * - 3 days before at 7:00 AM
   * - Day of appointment at 7:00 AM
   * @param {Object} PatientModel - Mongoose Patient model
   * @param {string} reminderType - '3day' or 'sameday'
   * @returns {Promise<{sent: number, failed: number, details: Array}>}
   */
  async sendScheduledReminders(PatientModel, reminderType = '3day') {
    console.log(`=== Running Scheduled SMS Reminders (${reminderType}) ===`);
    console.log('Time:', new Date().toISOString());

    const results = {
      sent: 0,
      failed: 0,
      details: []
    };

    if (!this.isConfigured()) {
      console.log('SMS service not configured, skipping scheduled reminders');
      return results;
    }

    try {
      // Calculate target date in YYYY-MM-DD format (Manila timezone)
      const now = new Date();
      const manilaOffset = 8 * 60;
      const localOffset = now.getTimezoneOffset();
      const manilaTime = new Date(now.getTime() + (manilaOffset + localOffset) * 60 * 1000);

      const targetDate = new Date(manilaTime);
      if (reminderType === '3day') {
        targetDate.setDate(targetDate.getDate() + 3);
      }
      // For 'sameday', targetDate stays as today
      const targetDateStr = targetDate.toISOString().split('T')[0];

      // Determine which status field to check
      const statusField = reminderType === '3day' ? 'sent3day' : 'sentSameday';

      console.log(`Looking for follow-ups on: ${targetDateStr} (${reminderType} reminder)`);

      // Find all patients with eligible follow-ups
      const patients = await PatientModel.find({
        '_deleted': { $ne: true },
        'smsConsent': true,
        'guardianPhone': { $exists: true, $ne: '' },
        'followUpDates': {
          $elemMatch: {
            'date': targetDateStr,
            'completed': { $ne: true },
            'smsReminder.enabled': true
          }
        }
      });

      console.log(`Found ${patients.length} patients with follow-ups on ${targetDateStr}`);

      for (const patient of patients) {
        const eligibleFollowUps = patient.followUpDates.filter(fu =>
          fu.date === targetDateStr &&
          !fu.completed &&
          fu.smsReminder?.enabled &&
          !fu.smsReminder?.[statusField]
        );

        for (const followUp of eligibleFollowUps) {
          console.log(`Sending ${reminderType} reminder to ${patient.patientName} for follow-up ${followUp.id}`);

          // Customize message based on reminder type
          const result = await this.sendFollowUpReminderCustom(patient, followUp, reminderType);

          if (result.success) {
            // Update the follow-up's SMS status
            const updateField = `followUpDates.$.smsReminder.${statusField}`;
            await PatientModel.updateOne(
              { 'id': patient.id, 'followUpDates.id': followUp.id },
              {
                $set: {
                  [updateField]: new Date().toISOString(),
                  'followUpDates.$.smsReminder.status': 'sent',
                  'followUpDates.$.smsReminder.lastMessageId': result.messageId
                }
              }
            );

            results.sent++;
            results.details.push({
              patientName: patient.patientName,
              followUpId: followUp.id,
              followUpDate: followUp.date,
              reminderType,
              status: 'sent',
              messageId: result.messageId
            });
          } else {
            results.failed++;
            results.details.push({
              patientName: patient.patientName,
              followUpId: followUp.id,
              followUpDate: followUp.date,
              reminderType,
              status: 'failed',
              error: result.error
            });
          }
        }
      }

      console.log(`=== ${reminderType} Reminder Results: Sent ${results.sent}, Failed ${results.failed} ===`);
      return results;
    } catch (error) {
      console.error('Error in scheduled SMS reminders:', error);
      return { ...results, error: error.message };
    }
  }

  /**
   * Send follow-up reminder with custom message based on timing
   */
  async sendFollowUpReminderCustom(patient, followUp, reminderType, clinicName = 'MY PEDIA Clinic') {
    const guardianPhone = patient.guardianPhone || patient.contactNumbers?.split(',')[0];

    if (!guardianPhone) {
      return { success: false, error: 'No contact number available' };
    }

    const followUpDate = new Date(followUp.date);
    const formattedDate = followUpDate.toLocaleDateString('en-PH', {
      weekday: 'long',
      month: 'long',
      day: 'numeric'
    });

    const patientName = patient.patientName?.split(',')[1]?.trim() || patient.nickname || 'your child';

    let message;
    if (reminderType === '3day') {
      message = `Reminder: ${patientName}'s follow-up is on ${formattedDate} (3 days from now). Please call to confirm. - ${clinicName}`;
    } else {
      message = `Reminder: ${patientName}'s follow-up is TODAY, ${formattedDate}. See you at the clinic! - ${clinicName}`;
    }

    return await this.sendSMS(guardianPhone, message);
  }
}

// Export singleton instance
const smsService = new SMSService();
module.exports = smsService;
