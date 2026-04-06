/**
 * Queue Module Types
 */

// Queue operating status
export type QueueStatus = 'not_started' | 'active' | 'paused' | 'concluded';

// Ticket source
export type TicketSource = 'scheduled' | 'walk_in';

// Urgency levels
export type TicketUrgency = 'emergency' | 'urgent' | 'normal';

// Ticket status
export type TicketStatus = 'waiting' | 'called' | 'in_progress' | 'done' | 'skipped' | 'no_show';

// Patient group (for clinic prioritization)
export type PatientGroup = 'pregnant' | 'pediatric' | 'general' | '';

// Ticket attributes (extensible for different business types)
export interface TicketAttributes {
  patientGroup?: PatientGroup;
  serviceType?: string;
  [key: string]: string | undefined;
}

// Queue Ticket
export interface QueueTicket {
  id: string;
  tenantId: string;
  locationId: string;

  // References
  appointmentId?: string | null;
  patientId?: string | null;

  // Patient info snapshot
  patientName: string;
  patientBirthday?: string;

  // Classification
  source: TicketSource;
  urgency: TicketUrgency;
  attributes: TicketAttributes;

  // Status & Priority
  status: TicketStatus;
  priorityRank: number;

  // Timestamps
  scheduledAt?: string | null;
  queueEnteredAt: string;
  calledAt?: string | null;
  servedAt?: string | null;
  completedAt?: string | null;

  // Assignment
  servedBy?: string | null;
  deskNumber?: string | null;

  // Manual order override
  manualOrder?: number | null;

  // Notes
  notes?: string;

  // Metadata
  createdAt: string;
  updatedAt: string;
  createdBy?: string;

  // Computed fields (added by API)
  waitTime?: number;
  priorityLabel?: string;
  priorityColor?: string;
}

// Queue state grouped by status
export interface QueueState {
  waiting: QueueTicket[];
  called: QueueTicket[];
  inProgress: QueueTicket[];
  done: QueueTicket[];
  stats: QueueStats;
}

// Queue statistics
export interface QueueStats {
  totalWaiting: number;
  totalCalled: number;
  totalInProgress: number;
  totalServed: number;
  avgWaitTime: number;
}

// Request types
export interface AddWalkInRequest {
  patientId?: string;
  patientName: string;
  patientBirthday?: string;
  urgency?: TicketUrgency;
  attributes?: TicketAttributes;
  notes?: string;
  queueDate?: string;
}

export interface CreateFromAppointmentRequest {
  appointmentId: string;
  patientId: string;
  patientName: string;
  patientBirthday?: string;
  urgency?: TicketUrgency;
  attributes?: TicketAttributes;
  scheduledAt?: string;
  notes?: string;
  queueDate?: string;
}

export interface CallNextRequest {
  tenantId?: string;
  locationId?: string;
  deskNumber?: string;
  date?: string;
}

export interface UpdateStatusRequest {
  status: TicketStatus;
  servedBy?: string;
  deskNumber?: string;
}

export interface ChangeUrgencyRequest {
  urgency: TicketUrgency;
}

// Helper to get urgency color
export const getUrgencyColor = (urgency: TicketUrgency): string => {
  switch (urgency) {
    case 'emergency':
      return 'red';
    case 'urgent':
      return 'amber';
    default:
      return 'gray';
  }
};

// Helper to get status display text
export const getStatusDisplay = (status: TicketStatus): string => {
  switch (status) {
    case 'waiting':
      return 'Waiting';
    case 'called':
      return 'Called';
    case 'in_progress':
      return 'Consulting Physician';
    case 'done':
      return 'Completed';
    case 'skipped':
      return 'Skipped';
    case 'no_show':
      return 'No Show';
    default:
      return status;
  }
};

// Helper to format wait time
export const formatWaitTime = (minutes: number): string => {
  if (minutes < 1) return '<1 min';
  if (minutes === 1) return '1 min';
  return `${minutes} min`;
};
