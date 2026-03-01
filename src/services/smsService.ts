import { PatientDocument, FollowUpDate } from '../types';

const API_BASE_URL = '/api';

class SMSApiService {
  private getAuthHeaders() {
    const token = localStorage.getItem('auth_token');
    return {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` })
    };
  }

  /**
   * Check SMS service status and balance
   */
  async getStatus(): Promise<{
    configured: boolean;
    balance?: number | null;
    accountName?: string | null;
    error?: string;
  }> {
    const response = await fetch(`${API_BASE_URL}/sms/status`, {
      headers: this.getAuthHeaders()
    });

    if (!response.ok) {
      throw new Error('Failed to get SMS status');
    }

    return response.json();
  }

  /**
   * Validate a phone number
   */
  async validateNumber(phoneNumber: string): Promise<{
    valid: boolean;
    formatted: string | null;
    original: string;
  }> {
    const response = await fetch(`${API_BASE_URL}/sms/validate-number`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ phoneNumber })
    });

    if (!response.ok) {
      throw new Error('Failed to validate number');
    }

    return response.json();
  }

  /**
   * Send a follow-up reminder SMS
   */
  async sendReminder(
    patient: PatientDocument,
    followUp: FollowUpDate,
    clinicName?: string
  ): Promise<{
    success: boolean;
    messageId?: string;
    recipient?: string;
    sentAt?: string;
    error?: string;
  }> {
    const response = await fetch(`${API_BASE_URL}/sms/send-reminder`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({
        patient,
        followUp,
        clinicName
      })
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.error || data.message || 'Failed to send SMS'
      };
    }

    return data;
  }

  /**
   * Send a custom SMS
   */
  async sendSMS(phoneNumber: string, message: string): Promise<{
    success: boolean;
    messageId?: string;
    recipient?: string;
    error?: string;
  }> {
    const response = await fetch(`${API_BASE_URL}/sms/send`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ phoneNumber, message })
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.error || data.message || 'Failed to send SMS'
      };
    }

    return data;
  }
}

export const smsApiService = new SMSApiService();
