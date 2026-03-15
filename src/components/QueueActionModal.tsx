import React, { useState } from 'react';
import { QueueTicket, QueueStatus, TicketUrgency, getStatusDisplay, formatWaitTime } from '../types/queue';
import {
  X,
  Phone,
  Play,
  CheckCircle,
  SkipForward,
  UserX,
  AlertTriangle,
  AlertCircle,
  Clock,
  Calendar
} from 'lucide-react';

interface QueueActionModalProps {
  ticket: QueueTicket;
  queueStatus: QueueStatus;
  onClose: () => void;
  onCall: () => void;
  onStartService: () => void;
  onComplete: () => void;
  onSkip: () => void;
  onNoShow: () => void;
  onChangeUrgency: (urgency: TicketUrgency) => void;
  isLoading?: boolean;
}

export function QueueActionModal({
  ticket,
  queueStatus,
  onClose,
  onCall,
  onStartService,
  onComplete,
  onSkip,
  onNoShow,
  onChangeUrgency,
  isLoading = false
}: QueueActionModalProps) {
  const queueActive = queueStatus === 'active';
  const [showUrgencyMenu, setShowUrgencyMenu] = useState(false);

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className={`
          p-4 border-b flex items-center justify-between
          ${ticket.urgency === 'emergency' ? 'bg-red-50' :
            ticket.urgency === 'urgent' ? 'bg-amber-50' :
            'bg-gray-50'}
        `}>
          <div className="flex items-center gap-3">
            {ticket.urgency === 'emergency' && <AlertCircle className="text-red-500" size={24} />}
            {ticket.urgency === 'urgent' && <AlertTriangle className="text-amber-500" size={24} />}
            <div>
              <h2 className="text-lg font-semibold text-gray-900">{ticket.patientName}</h2>
              <p className="text-sm text-gray-500">{getStatusDisplay(ticket.status)}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          {/* Ticket Details */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-gray-500 uppercase">Source</p>
              <p className="font-medium">
                {ticket.source === 'scheduled' ? 'Scheduled' : 'Walk-in'}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase">Patient Group</p>
              <p className="font-medium">
                {ticket.attributes?.patientGroup === 'pregnant' ? 'OB Patient' :
                 ticket.attributes?.patientGroup || 'General'}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase">Wait Time</p>
              <p className="font-medium flex items-center gap-1">
                <Clock size={14} />
                {ticket.waitTime !== undefined ? formatWaitTime(ticket.waitTime) : 'N/A'}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase">Queue Entry</p>
              <p className="font-medium flex items-center gap-1">
                <Calendar size={14} />
                {formatDate(ticket.queueEnteredAt)}
              </p>
            </div>
          </div>

          {/* Notes */}
          {ticket.notes && (
            <div>
              <p className="text-xs text-gray-500 uppercase mb-1">Notes</p>
              <p className="p-3 bg-gray-50 rounded-lg text-sm">{ticket.notes}</p>
            </div>
          )}

          {/* Urgency Selector */}
          <div className="relative">
            <p className="text-xs text-gray-500 uppercase mb-2">Urgency</p>
            <div className="flex gap-2">
              <button
                onClick={() => onChangeUrgency('normal')}
                disabled={isLoading || ticket.urgency === 'normal'}
                className={`
                  flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors
                  ${ticket.urgency === 'normal'
                    ? 'bg-gray-200 text-gray-700'
                    : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}
                `}
              >
                Normal
              </button>
              <button
                onClick={() => onChangeUrgency('urgent')}
                disabled={isLoading || ticket.urgency === 'urgent'}
                className={`
                  flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors
                  ${ticket.urgency === 'urgent'
                    ? 'bg-amber-200 text-amber-700'
                    : 'bg-amber-100 text-amber-500 hover:bg-amber-200'}
                `}
              >
                Urgent
              </button>
              <button
                onClick={() => onChangeUrgency('emergency')}
                disabled={isLoading || ticket.urgency === 'emergency'}
                className={`
                  flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors
                  ${ticket.urgency === 'emergency'
                    ? 'bg-red-200 text-red-700'
                    : 'bg-red-100 text-red-500 hover:bg-red-200'}
                `}
              >
                Emergency
              </button>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="p-4 border-t bg-gray-50 space-y-3">
          {/* Primary Actions based on status */}
          {ticket.status === 'waiting' && (
            <button
              onClick={onCall}
              disabled={isLoading || !queueActive}
              title={!queueActive ? 'Queue must be started first' : undefined}
              className="w-full py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Phone size={18} />
              {queueActive ? 'Call Patient' : 'Call Patient (Start Queue First)'}
            </button>
          )}

          {ticket.status === 'called' && (
            <button
              onClick={onStartService}
              disabled={isLoading || !queueActive}
              title={!queueActive ? 'Queue must be started first' : undefined}
              className="w-full py-3 bg-teal-600 text-white rounded-lg font-medium hover:bg-teal-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Play size={18} />
              {queueActive ? 'Start Service' : 'Start Service (Start Queue First)'}
            </button>
          )}

          {ticket.status === 'in_progress' && (
            <button
              onClick={onComplete}
              disabled={isLoading}
              className="w-full py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <CheckCircle size={18} />
              Complete
            </button>
          )}

          {/* Secondary Actions */}
          {['waiting', 'called'].includes(ticket.status) && (
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={onSkip}
                disabled={isLoading}
                className="py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-100 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <SkipForward size={16} />
                Skip
              </button>
              <button
                onClick={onNoShow}
                disabled={isLoading}
                className="py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-100 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <UserX size={16} />
                No Show
              </button>
            </div>
          )}

          {/* Cancel Button */}
          <button
            onClick={onClose}
            className="w-full py-2 text-gray-500 hover:text-gray-700 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
