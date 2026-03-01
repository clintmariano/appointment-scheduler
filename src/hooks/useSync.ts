import { useState, useEffect, useCallback } from 'react';
import { syncService, SyncStatus, SyncResult } from '../services/syncService';
import { db } from '../db/dexie';

export interface UseSyncReturn {
  status: SyncStatus;
  pendingChangesCount: number;
  lastSyncedAt: string | null;
  sync: () => Promise<SyncResult>;
  fullSync: () => Promise<SyncResult>;
  error: string | null;
}

export function useSync(autoSync: boolean = true): UseSyncReturn {
  const [status, setStatus] = useState<SyncStatus>(syncService.getStatus());
  const [pendingChangesCount, setPendingChangesCount] = useState<number>(0);
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Update pending changes count
  const updatePendingCount = useCallback(async () => {
    try {
      const count = await db.getPendingChangesCount();
      setPendingChangesCount(count);
    } catch (err) {
      console.error('Error getting pending changes count:', err);
    }
  }, []);

  // Update last sync time
  const updateLastSyncTime = useCallback(async () => {
    try {
      const time = await db.getLastSyncTime();
      setLastSyncedAt(time);
    } catch (err) {
      console.error('Error getting last sync time:', err);
    }
  }, []);

  // Subscribe to sync events
  useEffect(() => {
    const unsubscribe = syncService.subscribe((newStatus, result) => {
      setStatus(newStatus);

      if (result?.error) {
        setError(result.error);
      } else if (newStatus === 'success') {
        setError(null);
        updatePendingCount();
        updateLastSyncTime();
      }
    });

    // Initial load
    updatePendingCount();
    updateLastSyncTime();

    // Start auto sync if enabled
    if (autoSync) {
      try {
        syncService.startAutoSync(30000); // Sync every 30 seconds
      } catch (err) {
        console.error('Error starting auto sync:', err);
      }
    }

    return () => {
      unsubscribe();
      if (autoSync) {
        syncService.stopAutoSync();
      }
    };
  }, [autoSync, updatePendingCount, updateLastSyncTime]);

  // Manual sync trigger
  const sync = useCallback(async () => {
    const result = await syncService.sync();
    await updatePendingCount();
    await updateLastSyncTime();
    return result;
  }, [updatePendingCount, updateLastSyncTime]);

  // Full sync trigger
  const fullSync = useCallback(async () => {
    const result = await syncService.fullSync();
    await updatePendingCount();
    await updateLastSyncTime();
    return result;
  }, [updatePendingCount, updateLastSyncTime]);

  return {
    status,
    pendingChangesCount,
    lastSyncedAt,
    sync,
    fullSync,
    error
  };
}
