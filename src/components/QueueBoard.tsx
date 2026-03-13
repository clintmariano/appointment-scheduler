import React, { useState, useEffect, useCallback } from 'react';
import { PatientDocument } from '../types';
import {
  QueueState,
  QueueTicket,
  QueueStatus,
  TicketUrgency,
  PatientGroup
} from '../types/queue';
import * as queueApi from '../services/queueService';
import { QueueTicketCard } from './QueueTicketCard';
import { QueueActionModal } from './QueueActionModal';
import { AddWalkInModal } from './AddWalkInModal';
import {
  Users,
  UserPlus,
  RefreshCw,
  Clock,
  CheckCircle,
  Hourglass,
  Play,
  Pause,
  Power,
  Circle
} from 'lucide-react';
import { initSocket, onQueueUpdate, disconnectSocket } from '../services/socketService';

interface QueueBoardProps {
  patients: PatientDocument[];
  userRole: string;
}

export function QueueBoard({ patients, userRole }: QueueBoardProps) {
  const [queue, setQueue] = useState<QueueState | null>(null);
  const [queueStatus, setQueueStatus] = useState<QueueStatus>('not_started');
  const [simulationDate, setSimulationDate] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTicket, setSelectedTicket] = useState<QueueTicket | null>(null);
  const [showAddWalkIn, setShowAddWalkIn] = useState(false);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [processedAppointments, setProcessedAppointments] = useState<Set<string>>(new Set());

  // Fetch queue data - optionally pass a date to use instead of localStorage
  const fetchQueue = useCallback(async (dateOverride?: string) => {
    try {
      setError(null);
      // Use passed date, or read from localStorage
      const dateToUse = dateOverride !== undefined ? dateOverride : localStorage.getItem('queue_simulation_date');
      setSimulationDate(dateToUse);

      // Pass simulation date to API for filtering (convert null to undefined)
      const dateParam = dateToUse || undefined;
      console.log('fetchQueue - calling API with dateParam:', dateParam);
      const data = await queueApi.getTodayQueue('default', 'main', undefined, dateParam);
      console.log('fetchQueue - received data:', data);
      console.log('fetchQueue - waiting count:', data.waiting.length, 'called:', data.called.length);
      setQueue(data);

      // Get effective date for auto-reset check
      const effectiveDate = dateToUse || new Date().toISOString().split('T')[0];
      const savedQueueDate = localStorage.getItem('queue_date');
      const savedStatus = localStorage.getItem('queue_status') as QueueStatus | null;

      // Auto-reset queue if it's a new day
      if (savedQueueDate && savedQueueDate !== effectiveDate) {
        setQueueStatus('not_started');
        setProcessedAppointments(new Set());
        localStorage.setItem('queue_status', 'not_started');
        localStorage.setItem('queue_date', effectiveDate);
      } else {
        setQueueStatus(savedStatus || 'not_started');
        if (!savedQueueDate) {
          localStorage.setItem('queue_date', effectiveDate);
        }
      }
    } catch (err) {
      console.error('Failed to fetch queue:', err);
      setError(err instanceof Error ? err.message : 'Failed to load queue');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Get the effective date (simulation date if set, otherwise today)
  const getEffectiveDate = useCallback((): string => {
    if (simulationDate) {
      return simulationDate;
    }
    return new Date().toISOString().split('T')[0];
  }, [simulationDate]);

  // Handle simulation date change
  const handleSimulationDateChange = async (date: string) => {
    // Update localStorage first
    if (date) {
      localStorage.setItem('queue_simulation_date', date);
      localStorage.setItem('queue_date', date);
    } else {
      localStorage.removeItem('queue_simulation_date');
      const today = new Date().toISOString().split('T')[0];
      localStorage.setItem('queue_date', today);
    }

    setSimulationDate(date);
    setProcessedAppointments(new Set()); // Reset so appointments get re-processed for new date
    // Reset queue status to not_started for the new simulated date
    setQueueStatus('not_started');
    localStorage.setItem('queue_status', 'not_started');

    // Fetch queue with new simulation date (pass it directly to ensure it's used)
    await fetchQueue(date || undefined);
  };

  // Update queue status
  const updateQueueStatus = useCallback((status: QueueStatus) => {
    setQueueStatus(status);
    localStorage.setItem('queue_status', status);
    // Emit socket event for real-time update
    // In production, this would call an API endpoint
  }, []);

  // Handle start queue - adds scheduled appointments and sets status to active
  const handleStartQueue = async () => {
    const effectiveDate = getEffectiveDate();
    console.log('handleStartQueue - effectiveDate:', effectiveDate);
    console.log('handleStartQueue - patients:', patients);

    // Collect all scheduled appointments for the effective date
    const appointmentsToAdd: Array<{
      followUp: typeof patients[0]['followUpDates'][0];
      patient: typeof patients[0];
    }> = [];

    for (const patient of patients) {
      if (patient.followUpDates) {
        for (const followUp of patient.followUpDates) {
          console.log('Checking appointment:', followUp.id, 'date:', followUp.date, 'completed:', followUp.completed, 'priority:', followUp.priority);
          // Skip if already processed
          if (processedAppointments.has(followUp.id)) {
            console.log('Skipping already processed:', followUp.id);
            continue;
          }
          // Only process effective date's scheduled appointments that aren't completed
          if (followUp.date === effectiveDate && !followUp.completed && followUp.priority !== 'emergency' && followUp.priority !== 'urgent') {
            console.log('Adding to queue:', followUp.id, patient.patientName);
            appointmentsToAdd.push({ followUp, patient });
          }
        }
      }
    }

    console.log('appointmentsToAdd count:', appointmentsToAdd.length);

    // Sort all appointments by ID (first booked first)
    appointmentsToAdd.sort((a, b) => a.followUp.id.localeCompare(b.followUp.id));

    // Add to queue with incrementing scheduledAt to preserve order
    for (let i = 0; i < appointmentsToAdd.length; i++) {
      const { followUp, patient } = appointmentsToAdd[i];
      try {
        // Use incrementing seconds to ensure correct ordering in priority engine
        const orderTime = String(i).padStart(6, '0'); // 000000, 000001, etc.
        const payload = {
          appointmentId: followUp.id,
          patientId: patient.id,
          patientName: patient.patientName,
          patientBirthday: patient.birthday,
          urgency: 'normal' as const,
          attributes: {
            patientGroup: patient.lmp ? 'pregnant' : 'general'
          },
          scheduledAt: `${followUp.date}T00:${orderTime.slice(0, 2)}:${orderTime.slice(2, 4)}`,
          notes: followUp.notes,
          queueDate: effectiveDate // Pass the simulation date for queue filtering
        };
        console.log('Creating queue ticket:', payload);
        await queueApi.createFromAppointment(payload);
        setProcessedAppointments(prev => new Set(prev).add(followUp.id));
        console.log('Successfully created ticket for:', followUp.id);
      } catch (err) {
        console.error('Error creating ticket for', followUp.id, ':', err);
        // Ignore errors (likely duplicate)
      }
    }

    updateQueueStatus('active');
    localStorage.setItem('queue_date', effectiveDate);
    await fetchQueue();
  };

  // Handle pause queue (doctor leaves for emergency)
  const handlePauseQueue = () => {
    updateQueueStatus('paused');
  };

  // Handle resume queue (doctor returns)
  const handleResumeQueue = () => {
    updateQueueStatus('active');
  };

  // Handle conclude day
  const handleConcludeDay = () => {
    if (confirm('Are you sure you want to conclude the day? This will end the queue session.')) {
      updateQueueStatus('concluded');
    }
  };

  // Initial fetch and socket setup
  useEffect(() => {
    fetchQueue();

    // Setup socket for real-time updates
    initSocket(userRole as 'doctor' | 'assistant1' | 'assistant2');

    const unsubscribe = onQueueUpdate(() => {
      fetchQueue();
    });

    return () => {
      unsubscribe();
    };
  }, [fetchQueue, userRole]);

  // Update clock every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);


  // Handle add walk-in
  const handleAddWalkIn = async (data: {
    patientId?: string;
    patientName: string;
    patientBirthday?: string;
    urgency: TicketUrgency;
    patientGroup: PatientGroup;
    notes: string;
  }) => {
    setIsActionLoading(true);
    try {
      const effectiveDate = getEffectiveDate();
      await queueApi.addWalkIn({
        patientId: data.patientId,
        patientName: data.patientName,
        patientBirthday: data.patientBirthday,
        urgency: data.urgency,
        attributes: { patientGroup: data.patientGroup },
        notes: data.notes,
        queueDate: effectiveDate // Pass the simulation date for queue filtering
      });
      setShowAddWalkIn(false);
      await fetchQueue();
    } catch (err) {
      console.error('Failed to add walk-in:', err);
      alert(err instanceof Error ? err.message : 'Failed to add walk-in');
    } finally {
      setIsActionLoading(false);
    }
  };

  // Handle call next
  const handleCallNext = async () => {
    setIsActionLoading(true);
    try {
      const ticket = await queueApi.callNext({});
      if (!ticket) {
        alert('No patients waiting in queue');
      }
      await fetchQueue();
    } catch (err) {
      console.error('Failed to call next:', err);
      alert(err instanceof Error ? err.message : 'Failed to call next');
    } finally {
      setIsActionLoading(false);
    }
  };

  // Ticket action handlers
  const handleCall = async () => {
    if (!selectedTicket) return;
    setIsActionLoading(true);
    try {
      await queueApi.updateTicketStatus(selectedTicket.id, { status: 'called' });
      setSelectedTicket(null);
      await fetchQueue();
    } catch (err) {
      console.error('Failed to call patient:', err);
      alert(err instanceof Error ? err.message : 'Failed to call patient');
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleStartService = async () => {
    if (!selectedTicket) return;
    setIsActionLoading(true);
    try {
      await queueApi.updateTicketStatus(selectedTicket.id, { status: 'in_progress' });
      setSelectedTicket(null);
      await fetchQueue();
    } catch (err) {
      console.error('Failed to start service:', err);
      alert(err instanceof Error ? err.message : 'Failed to start service');
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleComplete = async () => {
    if (!selectedTicket) return;
    setIsActionLoading(true);
    try {
      await queueApi.updateTicketStatus(selectedTicket.id, { status: 'done' });
      setSelectedTicket(null);
      await fetchQueue();
    } catch (err) {
      console.error('Failed to complete:', err);
      alert(err instanceof Error ? err.message : 'Failed to complete');
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleSkip = async () => {
    if (!selectedTicket) return;
    setIsActionLoading(true);
    try {
      await queueApi.updateTicketStatus(selectedTicket.id, { status: 'skipped' });
      setSelectedTicket(null);
      await fetchQueue();
    } catch (err) {
      console.error('Failed to skip:', err);
      alert(err instanceof Error ? err.message : 'Failed to skip');
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleNoShow = async () => {
    if (!selectedTicket) return;
    setIsActionLoading(true);
    try {
      await queueApi.updateTicketStatus(selectedTicket.id, { status: 'no_show' });
      setSelectedTicket(null);
      await fetchQueue();
    } catch (err) {
      console.error('Failed to mark no show:', err);
      alert(err instanceof Error ? err.message : 'Failed to mark no show');
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleChangeUrgency = async (urgency: TicketUrgency) => {
    if (!selectedTicket) return;
    setIsActionLoading(true);
    try {
      const updated = await queueApi.changeTicketUrgency(selectedTicket.id, urgency);
      setSelectedTicket(updated);
      await fetchQueue();
    } catch (err) {
      console.error('Failed to change urgency:', err);
      alert(err instanceof Error ? err.message : 'Failed to change urgency');
    } finally {
      setIsActionLoading(false);
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <RefreshCw className="animate-spin text-teal-500" size={32} />
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500 mb-4">{error}</p>
          <button
            onClick={fetchQueue}
            className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="bg-white border-b px-6 py-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold text-gray-900">Queue</h1>

            {/* Doctor Status Indicator */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border">
              <Circle
                size={12}
                className={`${
                  queueStatus === 'active' ? 'fill-green-500 text-green-500' :
                  queueStatus === 'paused' ? 'fill-red-500 text-red-500' :
                  queueStatus === 'concluded' ? 'fill-gray-400 text-gray-400' :
                  'fill-gray-300 text-gray-300'
                }`}
              />
              <span className="text-sm font-medium">
                {queueStatus === 'active' ? 'Doctor In' :
                 queueStatus === 'paused' ? 'Doctor Out' :
                 queueStatus === 'concluded' ? 'Day Concluded' :
                 'Not Started'}
              </span>
            </div>

            {/* Simulation Date Picker (for testing) */}
            <div className="flex items-center gap-2">
              <label className="text-xs font-medium text-gray-500">Simulate Date:</label>
              <input
                type="date"
                value={simulationDate || ''}
                onChange={(e) => handleSimulationDateChange(e.target.value)}
                className="px-2 py-1 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              />
              {simulationDate && (
                <button
                  onClick={() => handleSimulationDateChange('')}
                  className="text-xs text-red-500 hover:text-red-700 font-medium"
                  title="Clear simulation"
                >
                  Clear
                </button>
              )}
            </div>

            {simulationDate && (
              <div className="px-2 py-1 bg-amber-100 text-amber-700 text-xs font-medium rounded-full">
                Testing Mode: {simulationDate}
              </div>
            )}
          </div>

          <div className="flex items-center gap-3">
            {/* Queue Controls */}
            {queueStatus === 'not_started' && (
              <button
                onClick={handleStartQueue}
                className="px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors flex items-center gap-2"
              >
                <Play size={18} />
                Start Queue
              </button>
            )}

            {queueStatus === 'active' && (
              <>
                <button
                  onClick={handlePauseQueue}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors flex items-center gap-2"
                >
                  <Pause size={18} />
                  Pause
                </button>
                <button
                  onClick={handleConcludeDay}
                  className="px-4 py-2 bg-gray-600 text-white rounded-lg font-medium hover:bg-gray-700 transition-colors flex items-center gap-2"
                >
                  <Power size={18} />
                  Conclude Day
                </button>
              </>
            )}

            {queueStatus === 'paused' && (
              <>
                <button
                  onClick={handleResumeQueue}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors flex items-center gap-2"
                >
                  <Play size={18} />
                  Resume
                </button>
                <button
                  onClick={handleConcludeDay}
                  className="px-4 py-2 bg-gray-600 text-white rounded-lg font-medium hover:bg-gray-700 transition-colors flex items-center gap-2"
                >
                  <Power size={18} />
                  Conclude Day
                </button>
              </>
            )}

            {queueStatus === 'concluded' && (
              <button
                onClick={() => updateQueueStatus('not_started')}
                className="px-4 py-2 bg-teal-600 text-white rounded-lg font-medium hover:bg-teal-700 transition-colors flex items-center gap-2"
              >
                <RefreshCw size={18} />
                New Day
              </button>
            )}

            {queueStatus === 'active' && (
              <>
                <button
                  onClick={handleCallNext}
                  disabled={isActionLoading || !queue?.waiting.length}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  <Users size={18} />
                  Next Patient
                </button>
                <button
                  onClick={() => setShowAddWalkIn(true)}
                  className="px-4 py-2 bg-teal-600 text-white rounded-lg font-medium hover:bg-teal-700 transition-colors flex items-center gap-2"
                >
                  <UserPlus size={18} />
                  Add Walk-In
                </button>
              </>
            )}

            <button
              onClick={fetchQueue}
              disabled={isLoading}
              className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
              title="Refresh"
            >
              <RefreshCw size={20} className={isLoading ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>

        {/* Stats */}
        {queue && (
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2 text-gray-600">
              <Hourglass size={18} className="text-amber-500" />
              <span className="font-medium">{queue.stats.totalWaiting}</span>
              <span className="text-sm">waiting</span>
            </div>
            <div className="flex items-center gap-2 text-gray-600">
              <Clock size={18} className="text-blue-500" />
              <span className="font-medium">{queue.stats.avgWaitTime} min</span>
              <span className="text-sm">avg wait</span>
            </div>
            <div className="flex items-center gap-2 text-gray-600">
              <CheckCircle size={18} className="text-green-500" />
              <span className="font-medium">{queue.stats.totalServed}</span>
              <span className="text-sm">served today</span>
            </div>
            <div className="ml-auto flex items-center gap-2 text-gray-600">
              <Clock size={18} className="text-gray-400" />
              <span className="font-medium font-mono">
                {currentTime.toLocaleTimeString('en-PH', {
                  timeZone: 'Asia/Manila',
                  hour: '2-digit',
                  minute: '2-digit',
                  second: '2-digit',
                  hour12: true
                })}
              </span>
              <span className="text-xs text-gray-400">Manila Time</span>
            </div>
          </div>
        )}
      </div>

      {/* Queue Columns */}
      <div className="flex-1 overflow-hidden p-6 relative">
        {/* Overlay for paused/not started/concluded queue */}
        {(queueStatus === 'not_started' || queueStatus === 'paused' || queueStatus === 'concluded') && (
          <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-10 flex items-center justify-center">
            <div className="text-center">
              {queueStatus === 'not_started' && (
                <>
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Play size={32} className="text-gray-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-700 mb-2">Queue Not Started</h3>
                  <p className="text-gray-500">Click "Start Queue" when the doctor arrives to begin accepting patients.</p>
                </>
              )}
              {queueStatus === 'paused' && (
                <>
                  <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Pause size={32} className="text-red-500" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-700 mb-2">Queue Paused</h3>
                  <p className="text-gray-500">Doctor is currently out. Click "Resume" when the doctor returns.</p>
                </>
              )}
              {queueStatus === 'concluded' && (
                <>
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle size={32} className="text-gray-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-700 mb-2">Day Concluded</h3>
                  <p className="text-gray-500">The queue has been concluded for today. Click "New Day" to start a new session.</p>
                </>
              )}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full">
          {/* Waiting Column */}
          <div className="flex flex-col bg-gray-50 rounded-xl p-4 overflow-hidden">
            <div className="flex items-center gap-2 mb-4">
              <Hourglass size={20} className="text-amber-500" />
              <h2 className="font-semibold text-gray-900">Waiting in Lobby</h2>
              <span className="ml-auto text-sm text-gray-500">
                {queue?.waiting.length || 0} patients
              </span>
            </div>
            <div className="flex-1 overflow-y-auto space-y-3">
              {queue?.waiting.map((ticket) => (
                <QueueTicketCard
                  key={ticket.id}
                  ticket={ticket}
                  onClick={() => setSelectedTicket(ticket)}
                />
              ))}
              {queue?.waiting.length === 0 && (
                <div className="text-center py-8 text-gray-400">
                  <Users size={48} className="mx-auto mb-2 opacity-50" />
                  <p>No patients waiting</p>
                </div>
              )}
            </div>
          </div>

          {/* Being Served Column */}
          <div className="flex flex-col bg-gray-50 rounded-xl p-4 overflow-hidden">
            <div className="flex items-center gap-2 mb-4">
              <Users size={20} className="text-teal-500" />
              <h2 className="font-semibold text-gray-900">Being Served</h2>
              <span className="ml-auto text-sm text-gray-500">
                {(queue?.called.length || 0) + (queue?.inProgress.length || 0)} patients
              </span>
            </div>
            <div className="flex-1 overflow-y-auto space-y-3">
              {/* Called patients */}
              {queue?.called.map((ticket) => (
                <div key={ticket.id}>
                  <p className="text-xs text-gray-500 uppercase mb-1">Called</p>
                  <QueueTicketCard
                    ticket={ticket}
                    onClick={() => setSelectedTicket(ticket)}
                    showWaitTime={false}
                  />
                </div>
              ))}
              {/* In Progress patients */}
              {queue?.inProgress.map((ticket) => (
                <div key={ticket.id}>
                  <p className="text-xs text-gray-500 uppercase mb-1">In Progress</p>
                  <QueueTicketCard
                    ticket={ticket}
                    onClick={() => setSelectedTicket(ticket)}
                    showWaitTime={false}
                  />
                </div>
              ))}
              {(queue?.called.length || 0) + (queue?.inProgress.length || 0) === 0 && (
                <div className="text-center py-8 text-gray-400">
                  <CheckCircle size={48} className="mx-auto mb-2 opacity-50" />
                  <p>No patients being served</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Action Modal */}
      {selectedTicket && (
        <QueueActionModal
          ticket={selectedTicket}
          onClose={() => setSelectedTicket(null)}
          onCall={handleCall}
          onStartService={handleStartService}
          onComplete={handleComplete}
          onSkip={handleSkip}
          onNoShow={handleNoShow}
          onChangeUrgency={handleChangeUrgency}
          isLoading={isActionLoading}
        />
      )}

      {/* Add Walk-In Modal */}
      <AddWalkInModal
        isOpen={showAddWalkIn}
        onClose={() => setShowAddWalkIn(false)}
        onSubmit={handleAddWalkIn}
        patients={patients}
        isLoading={isActionLoading}
      />
    </div>
  );
}
