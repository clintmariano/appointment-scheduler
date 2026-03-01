import { db, LocalPatientDocument } from '../db/dexie';

// Sync response from server
interface SyncResponse {
  serverChanges: LocalPatientDocument[];
  syncedAt: string;
  appliedChanges: { id: string; operation: string; status: string }[];
  conflicts: unknown[];
}

// Sync status
export type SyncStatus =
  | 'idle'
  | 'syncing'
  | 'success'
  | 'error'
  | 'offline';

// Sync result
export interface SyncResult {
  status: SyncStatus;
  syncedAt?: string;
  serverChangesCount?: number;
  localChangesApplied?: number;
  error?: string;
}

// Event listeners
type SyncEventListener = (status: SyncStatus, result?: SyncResult) => void;

class SyncService {
  private listeners: Set<SyncEventListener> = new Set();
  private syncInProgress = false;
  private syncInterval: number | null = null;
  private status: SyncStatus = 'idle';

  // Subscribe to sync events
  subscribe(listener: SyncEventListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  // Notify all listeners
  private notify(status: SyncStatus, result?: SyncResult): void {
    this.status = status;
    this.listeners.forEach(listener => listener(status, result));
  }

  // Get current status
  getStatus(): SyncStatus {
    return this.status;
  }

  // Check if online
  isOnline(): boolean {
    return navigator.onLine;
  }

  // Get auth token
  private getAuthToken(): string | null {
    return localStorage.getItem('auth_token');
  }

  // Perform sync
  async sync(): Promise<SyncResult> {
    // Prevent concurrent syncs
    if (this.syncInProgress) {
      return { status: 'syncing' };
    }

    // Check online status
    if (!this.isOnline()) {
      this.notify('offline');
      return { status: 'offline' };
    }

    // Check auth
    const token = this.getAuthToken();
    if (!token) {
      return { status: 'error', error: 'Not authenticated' };
    }

    this.syncInProgress = true;
    this.notify('syncing');

    try {
      // Get sync metadata
      const lastSyncedAt = await db.getLastSyncTime();
      const deviceId = await db.getDeviceId();

      // Get pending local changes
      const pendingChanges = await db.getPendingChanges();

      // Format changes for API
      const changes = pendingChanges.map(change => ({
        operation: change.operation,
        data: change.data,
        timestamp: change.timestamp
      }));

      // Call sync API
      const response = await fetch('/api/patients/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          lastSyncedAt,
          deviceId,
          changes
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Sync failed: ${response.status}`);
      }

      const syncResponse: SyncResponse = await response.json();

      // Apply server changes to local DB
      if (syncResponse.serverChanges.length > 0) {
        await db.applyServerChanges(syncResponse.serverChanges);
      }

      // Clear successfully synced pending changes
      const successfulIds = pendingChanges
        .map((change, index) => ({
          id: change.id!,
          status: syncResponse.appliedChanges[index]?.status
        }))
        .filter(item => item.status === 'applied')
        .map(item => item.id);

      if (successfulIds.length > 0) {
        await db.clearPendingChanges(successfulIds);
      }

      // Update last sync time
      await db.setLastSyncTime(syncResponse.syncedAt);

      // Mark synced patients
      for (const change of syncResponse.serverChanges) {
        if (!change._deleted) {
          await db.markPatientSynced(change.id);
        }
      }

      const result: SyncResult = {
        status: 'success',
        syncedAt: syncResponse.syncedAt,
        serverChangesCount: syncResponse.serverChanges.length,
        localChangesApplied: successfulIds.length
      };

      this.notify('success', result);
      return result;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Sync failed';
      const result: SyncResult = {
        status: 'error',
        error: errorMessage
      };

      this.notify('error', result);
      return result;

    } finally {
      this.syncInProgress = false;
    }
  }

  // Start automatic background sync
  startAutoSync(intervalMs: number = 30000): void {
    this.stopAutoSync();

    // Initial sync
    this.sync();

    // Periodic sync
    this.syncInterval = window.setInterval(() => {
      if (this.isOnline()) {
        this.sync();
      }
    }, intervalMs);

    // Sync when coming back online
    window.addEventListener('online', this.handleOnline);
  }

  // Stop automatic sync
  stopAutoSync(): void {
    if (this.syncInterval) {
      window.clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
    window.removeEventListener('online', this.handleOnline);
  }

  // Handle coming back online
  private handleOnline = (): void => {
    console.log('Network online - triggering sync');
    this.sync();
  };

  // Force full sync (ignore lastSyncedAt)
  async fullSync(): Promise<SyncResult> {
    await db.syncMeta.delete('lastSync');
    return this.sync();
  }
}

// Singleton instance
export const syncService = new SyncService();
