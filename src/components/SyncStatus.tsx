import React from 'react';
import {
  Cloud,
  CloudOff,
  RefreshCw,
  Check,
  AlertCircle,
  Upload
} from 'lucide-react';
import { useSync } from '../hooks/useSync';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { formatDateObj } from '../utils/documentUtils';

export function SyncStatus() {
  const { status, pendingChangesCount, lastSyncedAt, sync, error } = useSync();
  const { isOnline, wasOffline } = useOnlineStatus();

  // Format last sync time
  const formatLastSync = (isoString: string | null): string => {
    if (!isoString) return 'Never';
    const date = new Date(isoString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
    return formatDateObj(date);
  };

  // Determine icon and color (for use in teal header)
  const getStatusDisplay = () => {
    if (!isOnline) {
      return {
        icon: <CloudOff size={14} />,
        color: 'text-white/70',
        bgColor: 'bg-white/10',
        label: 'Offline'
      };
    }

    switch (status) {
      case 'syncing':
        return {
          icon: <RefreshCw size={14} className="animate-spin" />,
          color: 'text-white',
          bgColor: 'bg-white/20',
          label: 'Syncing'
        };
      case 'success':
        return {
          icon: <Check size={14} />,
          color: 'text-emerald-200',
          bgColor: 'bg-emerald-500/20',
          label: 'Synced'
        };
      case 'error':
        return {
          icon: <AlertCircle size={14} />,
          color: 'text-red-200',
          bgColor: 'bg-red-500/20',
          label: 'Error'
        };
      default:
        return {
          icon: <Cloud size={14} />,
          color: 'text-white/80',
          bgColor: 'bg-white/10',
          label: 'Ready'
        };
    }
  };

  const statusDisplay = getStatusDisplay();

  return (
    <div className="flex items-center gap-2 relative">
      {/* Pending changes indicator */}
      {pendingChangesCount > 0 && (
        <div className="flex items-center gap-1 text-amber-200 bg-amber-500/20 px-1.5 py-0.5 rounded-full text-[10px]">
          <Upload size={10} />
          <span>{pendingChangesCount}</span>
        </div>
      )}

      {/* Online/offline status with sync button */}
      <button
        onClick={() => sync()}
        disabled={!isOnline || status === 'syncing'}
        className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium transition-all ${statusDisplay.bgColor} ${statusDisplay.color} hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed`}
        title={`Last sync: ${formatLastSync(lastSyncedAt)}${error ? `\nError: ${error}` : ''}`}
      >
        {statusDisplay.icon}
        <span className="hidden sm:inline">{statusDisplay.label}</span>
      </button>

      {/* Back online notification */}
      {wasOffline && isOnline && (
        <div className="absolute top-full right-0 mt-2 bg-emerald-500 text-white px-3 py-1.5 rounded-lg shadow-lg text-xs whitespace-nowrap z-50">
          Back online - syncing...
        </div>
      )}
    </div>
  );
}
