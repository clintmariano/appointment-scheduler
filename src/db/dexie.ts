import Dexie, { Table } from 'dexie';
import { PatientDocument } from '../types';

// Extended patient interface with sync metadata
export interface LocalPatientDocument extends PatientDocument {
  _version?: number;
  _lastSyncedAt?: string | null;
  _deleted?: boolean;
  _pendingSync?: boolean;
  _syncOperation?: 'create' | 'update' | 'delete' | null;
}

// Pending sync operation
export interface PendingChange {
  id?: number; // Auto-increment
  patientId: string;
  operation: 'create' | 'update' | 'delete';
  data: LocalPatientDocument;
  timestamp: string;
  attempts: number;
}

// Sync metadata
export interface SyncMeta {
  key: string;
  value: string;
}

class EHRDatabase extends Dexie {
  patients!: Table<LocalPatientDocument, string>;
  pendingChanges!: Table<PendingChange, number>;
  syncMeta!: Table<SyncMeta, string>;

  constructor() {
    super('EHRDatabase');

    // Schema version 1
    this.version(1).stores({
      // Patients table - indexed by id, with secondary indexes
      patients: 'id, patientName, birthday, updatedAt, _deleted, _pendingSync',

      // Pending changes queue - indexed by auto id
      pendingChanges: '++id, patientId, operation, timestamp',

      // Sync metadata
      syncMeta: 'key'
    });
  }

  // Get all active (non-deleted) patients
  async getActivePatients(): Promise<LocalPatientDocument[]> {
    const patients = await this.patients
      .filter(p => !p._deleted)
      .toArray();
    // Sort by updatedAt descending (most recent first)
    return patients.sort((a, b) =>
      new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
  }

  // Get a single patient by ID
  async getPatient(id: string): Promise<LocalPatientDocument | undefined> {
    return this.patients.get(id);
  }

  // Save patient (create or update) and queue for sync
  async savePatient(
    patient: LocalPatientDocument,
    operation: 'create' | 'update'
  ): Promise<void> {
    const now = new Date().toISOString();

    const patientToSave: LocalPatientDocument = {
      ...patient,
      updatedAt: now,
      _pendingSync: true,
      _syncOperation: operation
    };

    await this.transaction('rw', [this.patients, this.pendingChanges], async () => {
      // Save/update patient
      await this.patients.put(patientToSave);

      // Add to pending changes queue
      await this.pendingChanges.add({
        patientId: patient.id,
        operation,
        data: patientToSave,
        timestamp: now,
        attempts: 0
      });
    });
  }

  // Mark patient as deleted (soft delete) and queue for sync
  async deletePatient(id: string): Promise<void> {
    const now = new Date().toISOString();
    const patient = await this.patients.get(id);

    if (!patient) return;

    const deletedPatient: LocalPatientDocument = {
      ...patient,
      _deleted: true,
      updatedAt: now,
      _pendingSync: true,
      _syncOperation: 'delete'
    };

    await this.transaction('rw', [this.patients, this.pendingChanges], async () => {
      await this.patients.put(deletedPatient);

      await this.pendingChanges.add({
        patientId: id,
        operation: 'delete',
        data: deletedPatient,
        timestamp: now,
        attempts: 0
      });
    });
  }

  // Get pending changes for sync
  async getPendingChanges(): Promise<PendingChange[]> {
    return this.pendingChanges.orderBy('timestamp').toArray();
  }

  // Clear pending changes after successful sync
  async clearPendingChanges(ids: number[]): Promise<void> {
    await this.pendingChanges.bulkDelete(ids);
  }

  // Apply server changes to local DB
  async applyServerChanges(changes: LocalPatientDocument[]): Promise<void> {
    await this.transaction('rw', this.patients, async () => {
      for (const change of changes) {
        const local = await this.patients.get(change.id);

        // Last-write-wins: apply if server is newer or local doesn't exist
        if (!local || change.updatedAt > local.updatedAt) {
          await this.patients.put({
            ...change,
            _pendingSync: false,
            _syncOperation: null
          });
        }
      }
    });
  }

  // Get/set last sync timestamp
  async getLastSyncTime(): Promise<string | null> {
    const meta = await this.syncMeta.get('lastSync');
    return meta?.value || null;
  }

  async setLastSyncTime(timestamp: string): Promise<void> {
    await this.syncMeta.put({ key: 'lastSync', value: timestamp });
  }

  // Get device ID (generate if not exists)
  async getDeviceId(): Promise<string> {
    const meta = await this.syncMeta.get('deviceId');
    if (!meta) {
      const deviceId = `device_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 11)}`;
      await this.syncMeta.put({ key: 'deviceId', value: deviceId });
      return deviceId;
    }
    return meta.value;
  }

  // Check if there are pending changes
  async hasPendingChanges(): Promise<boolean> {
    const count = await this.pendingChanges.count();
    return count > 0;
  }

  // Get pending changes count
  async getPendingChangesCount(): Promise<number> {
    return this.pendingChanges.count();
  }

  // Clear all local data (useful for logout)
  async clearAll(): Promise<void> {
    await this.transaction('rw', [this.patients, this.pendingChanges, this.syncMeta], async () => {
      await this.patients.clear();
      await this.pendingChanges.clear();
      await this.syncMeta.clear();
    });
  }

  // Mark patient as synced
  async markPatientSynced(id: string): Promise<void> {
    await this.patients.update(id, {
      _pendingSync: false,
      _syncOperation: null
    });
  }
}

// Single database instance
export const db = new EHRDatabase();

// Helper to generate IDs (matching existing pattern)
export function generateLocalId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
}
