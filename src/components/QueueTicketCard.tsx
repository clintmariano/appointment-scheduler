import React from 'react';
import { QueueTicket, formatWaitTime } from '../types/queue';
import { User, Clock, AlertTriangle, AlertCircle } from 'lucide-react';

interface QueueTicketCardProps {
  ticket: QueueTicket;
  onClick: () => void;
  showWaitTime?: boolean;
}

export function QueueTicketCard({ ticket, onClick, showWaitTime = true }: QueueTicketCardProps) {
  // Determine background color based on urgency and patient group
  const getBackgroundColor = () => {
    if (ticket.urgency === 'emergency') {
      return 'bg-red-50 border-red-200 hover:bg-red-100';
    }
    if (ticket.urgency === 'urgent') {
      return 'bg-amber-50 border-amber-200 hover:bg-amber-100';
    }
    if (ticket.attributes?.patientGroup === 'pregnant') {
      return 'bg-teal-50 border-teal-200 hover:bg-teal-100';
    }
    return 'bg-white border-gray-200 hover:bg-gray-50';
  };

  // Get urgency icon
  const getUrgencyIcon = () => {
    if (ticket.urgency === 'emergency') {
      return <AlertCircle size={16} className="text-red-500" />;
    }
    if (ticket.urgency === 'urgent') {
      return <AlertTriangle size={16} className="text-amber-500" />;
    }
    return null;
  };

  // Get patient group label
  const getPatientGroupLabel = () => {
    if (ticket.attributes?.patientGroup === 'pregnant') {
      return 'OB Patient';
    }
    if (ticket.attributes?.patientGroup === 'pediatric') {
      return 'Pediatric';
    }
    return ticket.attributes?.serviceType || '';
  };

  return (
    <div
      onClick={onClick}
      className={`
        p-4 rounded-lg border cursor-pointer transition-all
        ${getBackgroundColor()}
      `}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3">
          {/* Avatar */}
          <div className={`
            w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0
            ${ticket.urgency === 'emergency' ? 'bg-red-200' :
              ticket.urgency === 'urgent' ? 'bg-amber-200' :
              ticket.attributes?.patientGroup === 'pregnant' ? 'bg-teal-200' :
              'bg-gray-200'}
          `}>
            <User size={20} className={`
              ${ticket.urgency === 'emergency' ? 'text-red-600' :
                ticket.urgency === 'urgent' ? 'text-amber-600' :
                ticket.attributes?.patientGroup === 'pregnant' ? 'text-teal-600' :
                'text-gray-600'}
            `} />
          </div>

          {/* Patient Info */}
          <div>
            <div className="flex items-center gap-2">
              <h4 className="font-semibold text-gray-900">{ticket.patientName}</h4>
              {getUrgencyIcon()}
            </div>
            <p className="text-sm text-gray-500">
              {getPatientGroupLabel()}
            </p>
          </div>
        </div>

        {/* Wait Time */}
        {showWaitTime && ticket.waitTime !== undefined && (
          <div className="flex items-center gap-1 text-gray-500">
            <Clock size={14} />
            <span className="text-sm font-medium">
              {formatWaitTime(ticket.waitTime)}
            </span>
          </div>
        )}
      </div>

      {/* Notes preview */}
      {ticket.notes && (
        <p className="mt-2 text-sm text-gray-500 truncate">
          {ticket.notes}
        </p>
      )}

      {/* Source indicator */}
      <div className="mt-2 flex items-center gap-2">
        <span className={`
          text-xs px-2 py-0.5 rounded-full
          ${ticket.source === 'scheduled' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'}
        `}>
          {ticket.source === 'scheduled' ? 'Scheduled' : 'Walk-in'}
        </span>
        {ticket.deskNumber && (
          <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-700">
            {ticket.deskNumber}
          </span>
        )}
      </div>
    </div>
  );
}
