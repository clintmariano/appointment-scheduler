import { io, Socket } from 'socket.io-client';

// Socket instance
let socket: Socket | null = null;

// Event listeners
type AppointmentAlertListener = (data: {
  type: 'new' | 'updated';
  appointmentId: string;
  patientId: string;
  patientName: string;
  priority: 'emergency' | 'urgent' | 'routine';
  subjective?: string;
  objective?: string;
}) => void;

const listeners: Set<AppointmentAlertListener> = new Set();

// Queue update listeners
type QueueUpdateListener = (data: {
  action: string;
  ticket?: unknown;
}) => void;

const queueListeners: Set<QueueUpdateListener> = new Set();

// Get socket server URL
function getSocketUrl(): string {
  // In development, connect to the dev server port
  if (import.meta.env.DEV) {
    return 'http://localhost:3001';
  }
  // In production, connect to same origin
  return window.location.origin;
}

// Initialize socket connection
export function initSocket(role: 'doctor' | 'assistant' | 'assistant1' | 'assistant2'): void {
  if (socket?.connected) {
    console.log('Socket already connected');
    return;
  }

  const url = getSocketUrl();
  console.log('Connecting to socket server:', url);

  socket = io(url, {
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
  });

  socket.on('connect', () => {
    console.log('Socket connected:', socket?.id);
    // Join room based on role
    socket?.emit('join', role);
  });

  socket.on('disconnect', () => {
    console.log('Socket disconnected');
  });

  socket.on('connect_error', (error) => {
    console.error('Socket connection error:', error.message);
  });

  // Listen for appointment alerts (doctor only)
  socket.on('appointment_alert', (data) => {
    console.log('Received appointment alert:', data);
    listeners.forEach(listener => listener(data));
  });

  // Listen for queue updates
  socket.on('queue_updated', (data) => {
    console.log('Received queue update:', data);
    queueListeners.forEach(listener => listener(data));
  });
}

// Disconnect socket
export function disconnectSocket(): void {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}

// Emit new appointment event (assistant)
export function emitNewAppointment(data: {
  appointmentId: string;
  patientId: string;
  patientName: string;
  priority: 'emergency' | 'urgent' | 'routine';
  subjective?: string;
  objective?: string;
}): void {
  if (!socket?.connected) {
    console.warn('Socket not connected, cannot emit event');
    return;
  }

  socket.emit('new_appointment', {
    type: 'new',
    ...data
  });
}

// Emit appointment updated event (assistant)
export function emitAppointmentUpdated(data: {
  appointmentId: string;
  patientId: string;
  patientName: string;
  priority: 'emergency' | 'urgent' | 'routine';
  subjective?: string;
  objective?: string;
}): void {
  if (!socket?.connected) {
    console.warn('Socket not connected, cannot emit event');
    return;
  }

  socket.emit('appointment_updated', {
    type: 'updated',
    ...data
  });
}

// Subscribe to appointment alerts
export function onAppointmentAlert(listener: AppointmentAlertListener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

// Check if socket is connected
export function isSocketConnected(): boolean {
  return socket?.connected ?? false;
}

// Subscribe to queue updates
export function onQueueUpdate(listener: QueueUpdateListener): () => void {
  queueListeners.add(listener);
  return () => {
    queueListeners.delete(listener);
  };
}
