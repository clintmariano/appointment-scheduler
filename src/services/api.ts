import { PatientDocument } from '../types';
import { db, LocalPatientDocument, generateLocalId } from '../db/dexie';
import { syncService } from './syncService';

const API_BASE_URL = '/api';

class ApiService {
  private getAuthHeaders() {
    const token = localStorage.getItem('auth_token');
    return {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` })
    };
  }

  // Check if we should try server (online + authenticated)
  private canReachServer(): boolean {
    return navigator.onLine && !!localStorage.getItem('auth_token');
  }

  // Get all patients - LOCAL FIRST
  async getPatients(): Promise<PatientDocument[]> {
    // Always read from local DB first
    const localPatients = await db.getActivePatients();

    // Trigger background sync if online (don't await)
    if (this.canReachServer()) {
      syncService.sync().catch(console.error);
    }

    return localPatients as PatientDocument[];
  }

  // Get single patient - LOCAL FIRST
  async getPatient(id: string): Promise<PatientDocument> {
    const patient = await db.getPatient(id);

    if (!patient || patient._deleted) {
      throw new Error('Patient not found');
    }

    return patient as PatientDocument;
  }

  // Check for duplicate patient on server
  async checkDuplicate(patient: PatientDocument): Promise<{
    duplicate: boolean;
    existingPatient?: {
      id: string;
      patientName: string;
      birthday: string;
      gender: string;
      motherName?: string;
      fatherName?: string;
    };
  }> {
    if (!this.canReachServer()) {
      // Can't check duplicates when offline
      return { duplicate: false };
    }

    try {
      const response = await fetch(`${API_BASE_URL}/patients/check-duplicate`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({
          patientName: patient.patientName,
          birthday: patient.birthday,
          gender: patient.gender,
          motherName: patient.motherName,
          fatherName: patient.fatherName
        })
      });

      if (response.status === 409) {
        const data = await response.json();
        return {
          duplicate: true,
          existingPatient: data.existingPatient
        };
      }

      return { duplicate: false };
    } catch (error) {
      console.error('Error checking duplicate:', error);
      // On error, allow creation (fail-open for offline-first UX)
      return { duplicate: false };
    }
  }

  // Create patient - SAVE LOCALLY, SYNC LATER
  async createPatient(patient: PatientDocument): Promise<PatientDocument> {
    const now = new Date().toISOString();

    const newPatient: LocalPatientDocument = {
      ...patient,
      id: patient.id || generateLocalId(),
      createdAt: patient.createdAt || now,
      updatedAt: now,
      _version: 1,
      _deleted: false,
      _pendingSync: true,
      _syncOperation: 'create'
    };

    // Save to local DB
    await db.savePatient(newPatient, 'create');

    // Trigger sync if online (don't await)
    if (this.canReachServer()) {
      syncService.sync().catch(console.error);
    }

    return newPatient as PatientDocument;
  }

  // Update patient - SAVE LOCALLY, SYNC LATER
  async updatePatient(id: string, patient: PatientDocument): Promise<PatientDocument> {
    const existing = await db.getPatient(id);

    if (!existing) {
      throw new Error('Patient not found');
    }

    const now = new Date().toISOString();

    const updatedPatient: LocalPatientDocument = {
      ...patient,
      id,
      updatedAt: now,
      _version: (existing._version || 0) + 1,
      _pendingSync: true,
      _syncOperation: 'update'
    };

    // Save to local DB
    await db.savePatient(updatedPatient, 'update');

    // Trigger sync if online (don't await)
    if (this.canReachServer()) {
      syncService.sync().catch(console.error);
    }

    return updatedPatient as PatientDocument;
  }

  // Delete patient - SOFT DELETE LOCALLY, SYNC LATER
  async deletePatient(id: string): Promise<void> {
    await db.deletePatient(id);

    // Trigger sync if online (don't await)
    if (this.canReachServer()) {
      syncService.sync().catch(console.error);
    }
  }

  // ===================
  // FOLLOW-UP UPDATE (for assistants)
  // ===================

  async updateFollowUpStatus(
    patientId: string,
    followUpId: string,
    updates: { reminded?: boolean; confirmed?: boolean }
  ): Promise<void> {
    console.log('updateFollowUpStatus called:', { patientId, followUpId, updates });

    // Update local DB first
    const patient = await db.getPatient(patientId);
    if (patient && patient.followUpDates) {
      const followUpIndex = patient.followUpDates.findIndex(f => f.id === followUpId);
      if (followUpIndex !== -1) {
        if (updates.reminded !== undefined) {
          patient.followUpDates[followUpIndex].reminded = updates.reminded;
        }
        if (updates.confirmed !== undefined) {
          patient.followUpDates[followUpIndex].confirmed = updates.confirmed;
        }
        patient.updatedAt = new Date().toISOString();
        await db.patients.put(patient);
        console.log('Local DB updated');
      }
    }

    // Also update server if online
    if (this.canReachServer()) {
      try {
        console.log('Sending PATCH to server...');
        const response = await fetch(`${API_BASE_URL}/patients/${patientId}/followups/${followUpId}`, {
          method: 'PATCH',
          headers: this.getAuthHeaders(),
          body: JSON.stringify(updates)
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error('Failed to update follow-up on server:', response.status, errorText);
        } else {
          const result = await response.json();
          console.log('Server update successful:', result);
        }
      } catch (error) {
        console.error('Error updating follow-up on server:', error);
      }
    } else {
      console.log('Cannot reach server - offline or not authenticated');
    }
  }

  // Update follow-up with intake data (S and O) - for assistant check-in
  async updateFollowUpIntake(
    patientId: string,
    followUpId: string,
    intake: {
      subjective?: string;
      objective?: string;
      checkedInBy?: string;
    }
  ): Promise<void> {
    console.log('updateFollowUpIntake called:', { patientId, followUpId, intake });

    // Update local DB first
    const patient = await db.getPatient(patientId);
    if (patient && patient.followUpDates) {
      const followUpIndex = patient.followUpDates.findIndex(f => f.id === followUpId);
      if (followUpIndex !== -1) {
        const now = new Date().toISOString();
        patient.followUpDates[followUpIndex].intake = {
          ...patient.followUpDates[followUpIndex].intake,
          ...intake,
          checkedInAt: now
        };
        patient.followUpDates[followUpIndex].checkInStatus = 'checked_in';
        patient.updatedAt = now;
        await db.patients.put(patient);
        console.log('Local DB updated with intake');
      }
    }

    // Also update server if online
    if (this.canReachServer()) {
      try {
        const response = await fetch(`${API_BASE_URL}/patients/${patientId}/followups/${followUpId}`, {
          method: 'PATCH',
          headers: this.getAuthHeaders(),
          body: JSON.stringify({
            intake: {
              ...intake,
              checkedInAt: new Date().toISOString()
            },
            checkInStatus: 'checked_in'
          })
        });

        if (!response.ok) {
          console.error('Failed to update intake on server:', response.status);
        }
      } catch (error) {
        console.error('Error updating intake on server:', error);
      }
    }
  }

  // ===================
  // SERVER CALLS (for initialization/migration)
  // ===================

  async getPatientFromServer(id: string): Promise<PatientDocument> {
    const response = await fetch(`${API_BASE_URL}/patients/${id}`, {
      headers: this.getAuthHeaders()
    });

    if (!response.ok) {
      throw new Error('Failed to fetch patient');
    }

    return response.json();
  }

  async getPatientsFromServer(): Promise<PatientDocument[]> {
    const response = await fetch(`${API_BASE_URL}/patients`, {
      headers: this.getAuthHeaders()
    });

    if (!response.ok) {
      throw new Error('Failed to fetch patients');
    }

    return response.json();
  }

  // Initialize local DB from server (first-time setup)
  async initializeFromServer(): Promise<void> {
    if (!this.canReachServer()) {
      console.log('Offline - skipping server initialization');
      return;
    }

    try {
      const serverPatients = await this.getPatientsFromServer();

      // Save all patients to local DB
      for (const patient of serverPatients) {
        const localPatient: LocalPatientDocument = {
          ...patient,
          _version: 1,
          _deleted: false,
          _pendingSync: false,
          _syncOperation: null
        };
        await db.patients.put(localPatient);
      }

      // Set initial sync time
      await db.setLastSyncTime(new Date().toISOString());

      console.log(`Initialized local DB with ${serverPatients.length} patients`);
    } catch (error) {
      console.error('Failed to initialize from server:', error);
      // Don't throw - allow app to work offline with empty DB
    }
  }

  // Check if local DB has data
  async hasLocalData(): Promise<boolean> {
    const count = await db.patients.count();
    return count > 0;
  }

  // Clear local data (for logout)
  async clearLocalData(): Promise<void> {
    await db.clearAll();
  }
}

export const apiService = new ApiService();
