import React, { useState, useEffect, useRef } from 'react';
import { X, Calendar, Clock } from 'lucide-react';
import { PatientDocument, AppointmentPriority, formatAOG, calculateAOG } from '../types';
import { formatDate } from '../utils/documentUtils';

interface ScheduleAppointmentPanelProps {
  isOpen: boolean;
  onClose: () => void;
  patients: PatientDocument[];
  selectedPatient: PatientDocument | null;
  preselectedDate?: string;
  onSaveAppointment: (patientId: string, date: string, notes: string, options?: {
    startTime?: string;
    endTime?: string;
    priority?: AppointmentPriority;
  }) => void;
  appointmentCountForDate?: (date: string) => number;
}

// Time options for appointment scheduling
const TIME_OPTIONS = [
  '08:00', '08:30', '09:00', '09:30', '10:00', '10:30',
  '11:00', '11:30', '12:00', '12:30', '13:00', '13:30',
  '14:00', '14:30', '15:00', '15:30', '16:00', '16:30',
  '17:00', '17:30'
];

const MAX_APPOINTMENTS_PER_DAY = 10;

const formatTimeForDisplay = (time: string): string => {
  const [hours, minutes] = time.split(':').map(Number);
  const period = hours >= 12 ? 'PM' : 'AM';
  const displayHour = hours > 12 ? hours - 12 : hours === 0 ? 12 : hours;
  return `${displayHour}:${minutes.toString().padStart(2, '0')} ${period}`;
};

export function ScheduleAppointmentPanel({
  isOpen,
  onClose,
  patients,
  selectedPatient,
  preselectedDate,
  onSaveAppointment,
  appointmentCountForDate
}: ScheduleAppointmentPanelProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPatientForAppointment, setSelectedPatientForAppointment] = useState<PatientDocument | null>(null);
  const [appointmentDate, setAppointmentDate] = useState('');
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('09:30');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');
  const dateInputRef = useRef<HTMLInputElement>(null);

  // Get today's date in YYYY-MM-DD format for min date validation
  const today = new Date().toISOString().split('T')[0];

  // Calculate current appointment count for selected date
  const currentCount = appointmentDate && appointmentCountForDate ? appointmentCountForDate(appointmentDate) : 0;
  const isFull = currentCount >= MAX_APPOINTMENTS_PER_DAY;

  // Error message for validation
  useEffect(() => {
    if (isFull) {
      setError(`Maximum ${MAX_APPOINTMENTS_PER_DAY} appointments allowed per day`);
    } else {
      setError('');
    }
  }, [isFull]);

  // When panel opens, if there's a selected patient, use it
  useEffect(() => {
    if (isOpen) {
      if (selectedPatient) {
        setSelectedPatientForAppointment(selectedPatient);
        setSearchTerm('');
      } else {
        setSelectedPatientForAppointment(null);
        setSearchTerm('');
      }
      setAppointmentDate(preselectedDate || '');
      setStartTime('09:00');
      setEndTime('09:30');
      setNotes('');
    }
  }, [isOpen, selectedPatient, preselectedDate]);

  // Calculate AOG preview if patient has LMP
  const aogPreview = selectedPatientForAppointment?.lmp && appointmentDate
    ? calculateAOG(selectedPatientForAppointment.lmp, appointmentDate)
    : null;

  // Filter patients based on search term
  const filteredPatients = searchTerm
    ? patients.filter(
        (p) =>
          p.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (p.nickname && p.nickname.toLowerCase().includes(searchTerm.toLowerCase()))
      )
    : [];

  const handleSelectPatient = (patient: PatientDocument) => {
    setSelectedPatientForAppointment(patient);
  };

  const handleClearSearch = () => {
    setSearchTerm('');
    setSelectedPatientForAppointment(null);
  };

  const handleSave = () => {
    // Validate before saving
    if (!selectedPatientForAppointment || !appointmentDate) {
      setError('Please select a patient and date');
      return;
    }

    // Check if date is full
    if (isFull) {
      setError(`Maximum ${MAX_APPOINTMENTS_PER_DAY} appointments allowed per day`);
      return;
    }

    onSaveAppointment(selectedPatientForAppointment.id, appointmentDate, notes, {
      startTime,
      endTime,
      priority: 'routine'
    });
    onClose();
  };

  const handleCancel = () => {
    setSearchTerm('');
    setSelectedPatientForAppointment(null);
    setAppointmentDate('');
    setStartTime('09:00');
    setEndTime('09:30');
    setNotes('');
    onClose();
  };

  if (!isOpen) return null;

  const hasSelectedPatientContext = !!selectedPatient;

  // Common form fields for appointments
  const renderAppointmentFields = () => (
    <div className="space-y-4">
      {/* Error Message */}
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}

      {/* Date and Time Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Date
          </label>
          <div className="relative">
            <input
              ref={dateInputRef}
              type="date"
              value={appointmentDate}
              min={today}
              onChange={(e) => setAppointmentDate(e.target.value)}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            <div
              onClick={() => dateInputRef.current?.showPicker()}
              className={`w-full px-3 py-2.5 border rounded-lg text-sm flex items-center justify-between cursor-pointer hover:border-gray-300 ${
                isFull ? 'border-red-300 bg-red-50' : 'border-gray-200'
              }`}
            >
              <span className={appointmentDate ? 'text-gray-700' : 'text-gray-400'}>
                {appointmentDate ? formatDate(appointmentDate) : 'Select date'}
              </span>
              <Calendar size={16} className={`flex-shrink-0 ${isFull ? 'text-red-500' : 'text-gray-400'}`} />
            </div>
            {appointmentDate && appointmentCountForDate && (
              <p className={`mt-1 text-xs ${isFull ? 'text-red-500 font-medium' : 'text-gray-500'}`}>
                {currentCount}/{MAX_APPOINTMENTS_PER_DAY} appointments
                {isFull && ' - Fully booked'}
              </p>
            )}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Time
          </label>
          <div className="flex items-center gap-1">
            <select
              value={startTime}
              onChange={(e) => {
                setStartTime(e.target.value);
                // Auto-set end time to 30 min after start
                const startIndex = TIME_OPTIONS.indexOf(e.target.value);
                if (startIndex !== -1 && startIndex < TIME_OPTIONS.length - 1) {
                  setEndTime(TIME_OPTIONS[startIndex + 1]);
                }
              }}
              className="flex-1 min-w-0 px-2 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            >
              {TIME_OPTIONS.map(time => (
                <option key={time} value={time}>{formatTimeForDisplay(time)}</option>
              ))}
            </select>
            <span className="text-gray-400 flex-shrink-0">-</span>
            <select
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              className="flex-1 min-w-0 px-2 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            >
              {TIME_OPTIONS.map(time => (
                <option key={time} value={time}>{formatTimeForDisplay(time)}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* AOG Preview (for OB patients) */}
      {aogPreview && (
        <div className="bg-teal-50 border border-teal-200 rounded-lg p-3">
          <div className="flex items-center gap-2 text-sm">
            <span className="font-medium text-teal-700">AOG at appointment:</span>
            <span className="text-teal-600">{formatAOG(aogPreview)}</span>
          </div>
        </div>
      )}

      {/* Notes */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Notes
        </label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Add notes about this appointment..."
          rows={3}
          className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm resize-none"
        />
      </div>
    </div>
  );

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/20 z-40"
        onClick={handleCancel}
      />

      {/* Panel */}
      <div className="fixed top-0 right-0 h-full w-full max-w-md bg-white shadow-2xl z-50 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-800">Schedule Appointment</h2>
          <button
            onClick={handleCancel}
            className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden p-5">
          {/* If no patient context, show search */}
          {!hasSelectedPatientContext && (
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Search Patient
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder=""
                  className="flex-1 px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm"
                />
                {searchTerm ? (
                  <button
                    onClick={handleClearSearch}
                    className="px-4 py-2.5 text-teal-600 hover:text-teal-700 text-sm font-medium"
                  >
                    Clear
                  </button>
                ) : (
                  <button className="px-4 py-2.5 text-gray-400 text-sm font-medium">
                    Search
                  </button>
                )}
              </div>

              {/* Search Results */}
              {searchTerm && filteredPatients.length > 0 && !selectedPatientForAppointment && (
                <div className="mt-3 space-y-2">
                  {filteredPatients.slice(0, 5).map((patient) => (
                    <button
                      key={patient.id}
                      onClick={() => handleSelectPatient(patient)}
                      className="w-full flex items-center gap-3 p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors text-left"
                    >
                      <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-sm font-medium text-gray-600">
                          {patient.patientName.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-800 text-sm">{patient.patientName}</p>
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          {patient.lmp ? (
                            <>
                              <Clock size={12} />
                              <span>AOG: {formatAOG(calculateAOG(patient.lmp))}</span>
                            </>
                          ) : (
                            <>
                              <Calendar size={12} />
                              <span>{formatDate(patient.birthday)}</span>
                            </>
                          )}
                          <span
                            className={`px-1.5 py-0.5 rounded text-xs font-medium ${
                              patient.gender === 'M'
                                ? 'bg-blue-100 text-blue-600'
                                : 'bg-pink-100 text-pink-600'
                            }`}
                          >
                            {patient.gender}
                          </span>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* When patient context exists (viewing patient file) */}
          {hasSelectedPatientContext && (
            <>
              {/* Patient Info Card */}
              <div className="mb-6 p-4 bg-gray-50 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-teal-100 rounded-full flex items-center justify-center">
                    <span className="text-lg font-semibold text-teal-600">
                      {selectedPatient.patientName.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-800">{selectedPatient.patientName}</p>
                    {selectedPatient.lmp && (
                      <p className="text-sm text-gray-500">
                        Current AOG: {formatAOG(calculateAOG(selectedPatient.lmp))}
                      </p>
                    )}
                  </div>
                </div>
              </div>
              {renderAppointmentFields()}
            </>
          )}

          {/* When searching - show Patient Name, then Date and Notes */}
          {!hasSelectedPatientContext && selectedPatientForAppointment && (
            <>
              {/* Patient Info Card */}
              <div className="mb-6 p-4 bg-gray-50 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-teal-100 rounded-full flex items-center justify-center">
                    <span className="text-lg font-semibold text-teal-600">
                      {selectedPatientForAppointment.patientName.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-800">{selectedPatientForAppointment.patientName}</p>
                    {selectedPatientForAppointment.lmp && (
                      <p className="text-sm text-gray-500">
                        Current AOG: {formatAOG(calculateAOG(selectedPatientForAppointment.lmp))}
                      </p>
                    )}
                  </div>
                </div>
              </div>
              {renderAppointmentFields()}
            </>
          )}

          {/* Empty state placeholder when searching but no patient selected yet */}
          {!hasSelectedPatientContext && !selectedPatientForAppointment && (
            <div className="text-center py-8 text-gray-400">
              <Clock size={48} className="mx-auto mb-4 text-gray-300" />
              <p className="text-sm">Search and select a patient to schedule an appointment</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-5 border-t border-gray-100">
          <button
            onClick={handleCancel}
            className="px-4 py-2.5 text-gray-700 hover:text-gray-900 text-sm font-medium"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!selectedPatientForAppointment || !appointmentDate || !!error || isFull}
            className="px-5 py-2.5 bg-teal-500 text-white rounded-lg hover:bg-teal-600 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Save Appointment
          </button>
        </div>
      </div>
    </>
  );
}
