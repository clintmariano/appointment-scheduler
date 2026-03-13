import React, { useState, useEffect, useCallback } from 'react';
import { PatientDocument, FollowUpDate, calculateAOG } from '../types';
import { apiService } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { QueueBoard } from './QueueBoard';
import { AssistantSidebar, AssistantViewType } from './AssistantSidebar';
import { AssistantAppointmentsView } from './AssistantAppointmentsView';
import { RefreshCw, Menu, X, Search, Calendar } from 'lucide-react';
import * as queueApi from '../services/queueService';

// Schedule Appointment Modal for Assistants
interface ScheduleModalProps {
  patients: PatientDocument[];
  selectedDate?: string;
  onClose: () => void;
  onSave: (patientId: string, date: string, startTime: string, notes: string) => Promise<void>;
  appointmentCountForDate: (date: string) => number;
}

const MAX_APPOINTMENTS_PER_DAY = 10;

function ScheduleModal({ patients, selectedDate, onClose, onSave, appointmentCountForDate }: ScheduleModalProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [date, setDate] = useState(selectedDate || '');
  const [notes, setNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  const filteredPatients = patients.filter(p =>
    p.patientName.toLowerCase().includes(searchTerm.toLowerCase())
  ).slice(0, 10);

  const selectedPatient = patients.find(p => p.id === selectedPatientId);

  const currentCount = date ? appointmentCountForDate(date) : 0;
  const isFull = currentCount >= MAX_APPOINTMENTS_PER_DAY;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!selectedPatientId) {
      setError('Please select a patient');
      return;
    }
    if (!date) {
      setError('Please select a date');
      return;
    }
    if (isFull) {
      setError(`Maximum ${MAX_APPOINTMENTS_PER_DAY} appointments allowed per day`);
      return;
    }

    // Check if date is in the past
    const selectedDateObj = new Date(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (selectedDateObj < today) {
      setError('Cannot schedule appointments in the past');
      return;
    }

    setIsSaving(true);
    try {
      // Use default time of 09:00 for assistant scheduling
      await onSave(selectedPatientId, date, '09:00', notes);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to schedule appointment');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-4 border-b flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Schedule Appointment</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          {/* Patient Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Patient *</label>
            {!selectedPatient ? (
              <>
                <div className="relative mb-2">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search patients..."
                    className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  />
                </div>
                <div className="max-h-40 overflow-y-auto border border-gray-200 rounded-lg">
                  {filteredPatients.map(patient => (
                    <button
                      key={patient.id}
                      type="button"
                      onClick={() => {
                        setSelectedPatientId(patient.id);
                        setSearchTerm('');
                      }}
                      className="w-full text-left px-3 py-2 hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                    >
                      <span className="font-medium">{patient.patientName}</span>
                      {patient.lmp && (
                        <span className="text-sm text-gray-500 ml-2">
                          (OB Patient)
                        </span>
                      )}
                    </button>
                  ))}
                  {filteredPatients.length === 0 && (
                    <p className="px-3 py-2 text-sm text-gray-400">No patients found</p>
                  )}
                </div>
              </>
            ) : (
              <div className="flex items-center justify-between p-3 bg-teal-50 rounded-lg">
                <span className="font-medium text-teal-800">{selectedPatient.patientName}</span>
                <button
                  type="button"
                  onClick={() => setSelectedPatientId('')}
                  className="text-teal-600 hover:text-teal-800 text-sm"
                >
                  Change
                </button>
              </div>
            )}
          </div>

          {/* Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date *</label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              />
            </div>
            {date && (
              <p className={`mt-1 text-sm ${isFull ? 'text-red-500' : 'text-gray-500'}`}>
                {currentCount}/{MAX_APPOINTMENTS_PER_DAY} appointments scheduled
                {isFull && ' - Date is full'}
              </p>
            )}
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Reason for visit..."
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent resize-none"
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving || isFull}
              className="px-4 py-2 bg-teal-600 text-white rounded-lg font-medium hover:bg-teal-700 transition-colors disabled:opacity-50"
            >
              {isSaving ? 'Scheduling...' : 'Schedule'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function AssistantView() {
  const { user } = useAuth();
  const [patients, setPatients] = useState<PatientDocument[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentView, setCurrentView] = useState<AssistantViewType>('queue');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [scheduleSelectedDate, setScheduleSelectedDate] = useState<string | undefined>(undefined);

  const loadPatients = useCallback(async () => {
    try {
      setIsLoading(true);
      setError('');
      const data = await apiService.getPatients();
      setPatients(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load patient data';
      setError(errorMessage);
      setPatients([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPatients();
  }, [loadPatients]);

  // Auto-refresh every 30 seconds (only when viewing Queue)
  useEffect(() => {
    if (currentView !== 'queue') return; // Only refresh when on Queue view

    const interval = setInterval(() => {
      loadPatients();
    }, 30000);
    return () => clearInterval(interval);
  }, [loadPatients, currentView]);

  // Get appointment count for a date
  const getAppointmentCountForDate = (date: string): number => {
    let count = 0;
    for (const patient of patients) {
      if (patient.followUpDates) {
        for (const followUp of patient.followUpDates) {
          if (followUp.date === date && !followUp.completed) {
            count++;
          }
        }
      }
    }
    return count;
  };

  // Handle scheduling appointment
  const handleScheduleAppointment = async (patientId: string, date: string, startTime: string, notes: string) => {
    const patient = patients.find(p => p.id === patientId);
    if (!patient) throw new Error('Patient not found');

    // Calculate end time (30 min after start)
    const [hours, minutes] = startTime.split(':').map(Number);
    const endDate = new Date(2000, 0, 1, hours, minutes + 30);
    const endTime = `${endDate.getHours().toString().padStart(2, '0')}:${endDate.getMinutes().toString().padStart(2, '0')}`;

    // Calculate AOG if patient has LMP
    let aog = undefined;
    if (patient.lmp) {
      const appointmentDate = new Date(date);
      aog = calculateAOG(patient.lmp, appointmentDate);
    }

    const newFollowUp: FollowUpDate = {
      id: Math.random().toString(36).substring(2, 11),
      date,
      startTime,
      endTime,
      notes,
      completed: false,
      priority: 'routine',
      aog
    };

    // Update patient with new appointment
    const updatedPatient = {
      ...patient,
      followUpDates: [...(patient.followUpDates || []), newFollowUp]
    };

    await apiService.updatePatient(patientId, updatedPatient);

    // Refresh patients list
    await loadPatients();
  };

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-slate-100">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 text-teal-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-500">Loading...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-screen flex items-center justify-center bg-slate-100">
        <div className="text-center">
          <p className="text-red-500 mb-4">{error}</p>
          <button
            onClick={loadPatients}
            className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex bg-slate-50">
      {/* Sidebar */}
      <AssistantSidebar
        currentView={currentView}
        onViewChange={setCurrentView}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile Header */}
        <div className="lg:hidden bg-white border-b px-4 py-3 flex items-center gap-3">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <Menu size={20} />
          </button>
          <h1 className="font-semibold text-gray-900">
            {currentView === 'queue' ? 'Queue' : 'Appointments'}
          </h1>
        </div>

        {/* View Content */}
        {currentView === 'queue' ? (
          <QueueBoard
            patients={patients}
            userRole={user?.role || 'assistant1'}
          />
        ) : (
          <AssistantAppointmentsView
            patients={patients}
            onScheduleAppointment={(date) => {
              setScheduleSelectedDate(date);
              setShowScheduleModal(true);
            }}
          />
        )}
      </div>

      {/* Schedule Modal */}
      {showScheduleModal && (
        <ScheduleModal
          patients={patients}
          selectedDate={scheduleSelectedDate}
          onClose={() => {
            setShowScheduleModal(false);
            setScheduleSelectedDate(undefined);
          }}
          onSave={handleScheduleAppointment}
          appointmentCountForDate={getAppointmentCountForDate}
        />
      )}
    </div>
  );
}
