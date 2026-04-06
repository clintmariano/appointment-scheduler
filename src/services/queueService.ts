/**
 * Queue Service
 *
 * Frontend API client for queue operations.
 */

import {
  QueueState,
  QueueTicket,
  AddWalkInRequest,
  CreateFromAppointmentRequest,
  CallNextRequest,
  UpdateStatusRequest,
  ChangeUrgencyRequest,
  TicketStatus,
  TicketUrgency
} from '../types/queue';

const API_BASE = '/api/queue';

// Get auth token
const getAuthToken = (): string | null => {
  return localStorage.getItem('auth_token');
};

// Common headers
const getHeaders = (): HeadersInit => {
  const token = getAuthToken();
  return {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
  };
};

// Handle response
const handleResponse = async <T>(response: Response): Promise<T> => {
  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Request failed' }));
    throw new Error(error.message || 'Request failed');
  }
  return response.json();
};

/**
 * Get today's queue
 */
export const getTodayQueue = async (
  tenantId = 'default',
  locationId = 'main',
  statusFilter?: TicketStatus[],
  date?: string
): Promise<QueueState> => {
  const params = new URLSearchParams({ tenantId, locationId });
  if (statusFilter) {
    params.append('status', statusFilter.join(','));
  }
  if (date) {
    params.append('date', date);
  }

  const response = await fetch(`${API_BASE}/today?${params}`, {
    headers: getHeaders()
  });

  return handleResponse<QueueState>(response);
};

/**
 * Get a single ticket
 */
export const getTicket = async (ticketId: string): Promise<QueueTicket> => {
  const response = await fetch(`${API_BASE}/${ticketId}`, {
    headers: getHeaders()
  });

  return handleResponse<QueueTicket>(response);
};

/**
 * Add walk-in patient to queue
 */
export const addWalkIn = async (data: AddWalkInRequest): Promise<QueueTicket> => {
  const response = await fetch(`${API_BASE}/walk-in`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(data)
  });

  return handleResponse<QueueTicket>(response);
};

/**
 * Create ticket from scheduled appointment
 */
export const createFromAppointment = async (
  data: CreateFromAppointmentRequest
): Promise<QueueTicket> => {
  const response = await fetch(`${API_BASE}/from-appointment`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(data)
  });

  return handleResponse<QueueTicket>(response);
};

/**
 * Call next patient in queue
 */
export const callNext = async (data: CallNextRequest = {}): Promise<QueueTicket | null> => {
  const response = await fetch(`${API_BASE}/call-next`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(data)
  });

  const result = await handleResponse<{ ticket: QueueTicket | null; message?: string }>(response);
  return result.ticket ?? result as unknown as QueueTicket;
};

/**
 * Update ticket status
 */
export const updateTicketStatus = async (
  ticketId: string,
  data: UpdateStatusRequest
): Promise<QueueTicket> => {
  const response = await fetch(`${API_BASE}/${ticketId}/status`, {
    method: 'PATCH',
    headers: getHeaders(),
    body: JSON.stringify(data)
  });

  return handleResponse<QueueTicket>(response);
};

/**
 * Change ticket urgency
 */
export const changeTicketUrgency = async (
  ticketId: string,
  urgency: TicketUrgency
): Promise<QueueTicket> => {
  const response = await fetch(`${API_BASE}/${ticketId}/urgency`, {
    method: 'PATCH',
    headers: getHeaders(),
    body: JSON.stringify({ urgency })
  });

  return handleResponse<QueueTicket>(response);
};

/**
 * Reorder a ticket in the waiting queue (move up or down)
 */
export const reorderTicket = async (
  ticketId: string,
  direction: 'up' | 'down',
  date?: string
): Promise<{ message: string; tickets: QueueTicket[] }> => {
  const response = await fetch(`${API_BASE}/${ticketId}/reorder`, {
    method: 'PATCH',
    headers: getHeaders(),
    body: JSON.stringify({ direction, date })
  });

  return handleResponse<{ message: string; tickets: QueueTicket[] }>(response);
};

/**
 * Remove/skip ticket
 */
export const removeTicket = async (ticketId: string): Promise<QueueTicket> => {
  const response = await fetch(`${API_BASE}/${ticketId}`, {
    method: 'DELETE',
    headers: getHeaders()
  });

  const result = await handleResponse<{ ticket: QueueTicket }>(response);
  return result.ticket;
};

/**
 * Get patient's ticket history
 */
export const getPatientTickets = async (patientId: string): Promise<QueueTicket[]> => {
  const response = await fetch(`${API_BASE}/patient/${patientId}`, {
    headers: getHeaders()
  });

  return handleResponse<QueueTicket[]>(response);
};

// Export all functions as default object for convenience
export default {
  getTodayQueue,
  getTicket,
  addWalkIn,
  createFromAppointment,
  callNext,
  updateTicketStatus,
  changeTicketUrgency,
  reorderTicket,
  removeTicket,
  getPatientTickets
};
