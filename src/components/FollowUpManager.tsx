import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { FollowUpDate, PatientDocument } from '../types';
import { generateId, formatDate } from '../utils/documentUtils';
import { DateInput } from './DateInput';
import { Calendar, X, Trash2, ChevronRight, Check } from 'lucide-react';

interface FollowUpManagerProps {
  followUpDates: FollowUpDate[];
  originalFollowUpDates?: FollowUpDate[];
  onChange: (followUpDates: FollowUpDate[]) => void;
  onSave: () => void;
  patient?: PatientDocument;
}

export function FollowUpManager({ followUpDates, originalFollowUpDates = [], onChange, onSave, patient }: FollowUpManagerProps) {
  const [showHistory, setShowHistory] = useState(false);
  const [selectedAppointmentId, setSelectedAppointmentId] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [pendingSave, setPendingSave] = useState(false);
  const followUpDatesRef = useRef(followUpDates);

  // Keep ref updated with latest followUpDates
  useEffect(() => {
    followUpDatesRef.current = followUpDates;
  }, [followUpDates]);

  // Trigger save after state has been updated
  useEffect(() => {
    if (pendingSave) {
      // Use a small delay to ensure parent state is also updated
      const timer = setTimeout(() => {
        onSave();
        setPendingSave(false);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [pendingSave, followUpDates, onSave]);

  // Form state
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    notes: ''
  });

  const resetFields = () => {
    setFormData({
      date: new Date().toISOString().split('T')[0],
      notes: ''
    });
    setSelectedAppointmentId(null);
  };

  const saveAppointment = () => {
    let updatedFollowUps: FollowUpDate[];

    if (selectedAppointmentId) {
      // Update existing appointment
      updatedFollowUps = followUpDates.map(followUp =>
        followUp.id === selectedAppointmentId
          ? { ...followUp, date: formData.date, notes: formData.notes }
          : followUp
      );
    } else {
      // Create new appointment
      const newFollowUp: FollowUpDate = {
        id: generateId(),
        date: formData.date,
        notes: formData.notes,
        completed: false,
        smsReminder: {
          enabled: false,
          status: 'pending'
        }
      };
      updatedFollowUps = [...followUpDates, newFollowUp];
    }

    // Update state
    onChange(updatedFollowUps);
    resetFields();

    // Show success feedback
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2000);

    // Trigger save after state update via useEffect
    setPendingSave(true);
  };

  const loadAppointment = (followUp: FollowUpDate) => {
    setFormData({
      date: followUp.date,
      notes: followUp.notes
    });
    setSelectedAppointmentId(followUp.id);
    setShowHistory(false);
  };

  const deleteAppointment = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(followUpDates.filter(f => f.id !== id));
    if (selectedAppointmentId === id) {
      resetFields();
    }
  };

  // Helper to normalize date for comparison
  const normalizeDate = (dateStr: string) => {
    const [year, month, day] = dateStr.split('-').map(Number);
    return new Date(year, month - 1, day);
  };

  const getTodayNormalized = () => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate());
  };

  const isDatePast = (dateStr: string) => {
    if (!dateStr) return false;
    return normalizeDate(dateStr) < getTodayNormalized();
  };

  // Sort appointments by date (newest first)
  const sortedAppointments = [...followUpDates].sort((a, b) => {
    if (!a.date && !b.date) return 0;
    if (!a.date) return 1;
    if (!b.date) return -1;
    return normalizeDate(b.date).getTime() - normalizeDate(a.date).getTime();
  });

  return (
    <div className="relative">
      {/* Success Message */}
      {saveSuccess && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2 text-green-700">
          <Check size={16} />
          <span className="text-sm">Appointment saved successfully!</span>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-end mb-4">
        <button
          onClick={() => setShowHistory(true)}
          className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium text-gray-700"
        >
          View Appointments {followUpDates.length > 0 && `(${followUpDates.length})`}
        </button>
      </div>

      {/* Form */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Date
          </label>
          <DateInput
            value={formData.date}
            onChange={(value) => setFormData(prev => ({ ...prev, date: value }))}
          />
        </div>
        <div className="sm:col-span-3">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Notes
          </label>
          <input
            type="text"
            value={formData.notes}
            onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
            placeholder="Add notes about this appointment..."
            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm"
          />
        </div>
      </div>

      {/* Footer Actions */}
      <div className="flex items-center justify-end gap-4 pt-4 border-t border-gray-100">
        <button
          onClick={resetFields}
          className="text-sm text-teal-600 hover:text-teal-700 font-medium"
        >
          Reset Fields
        </button>
        <button
          onClick={saveAppointment}
          className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium text-gray-700"
        >
          {selectedAppointmentId ? 'Update Appointment' : 'Save Appointment'}
          <Calendar size={16} />
        </button>
      </div>

      {/* Appointments History Sidebar */}
      {showHistory && createPortal(
        <>
          {/* Overlay */}
          <div
            className="fixed inset-0 bg-black bg-opacity-30 z-40"
            onClick={() => setShowHistory(false)}
          />

          {/* Sidebar */}
          <div className="fixed top-0 right-0 h-full w-full sm:w-96 bg-white shadow-xl z-50 flex flex-col max-h-screen overflow-hidden">
            {/* Sidebar Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 flex-shrink-0">
              <h3 className="text-lg font-semibold text-gray-800">Follow-Up Appointments</h3>
              <button
                onClick={() => setShowHistory(false)}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Appointments List */}
            <div className="flex-1 overflow-y-auto p-4 overscroll-contain">
              {sortedAppointments.length === 0 ? (
                <div className="text-center py-12">
                  <Calendar size={40} className="mx-auto mb-3 text-gray-300" />
                  <p className="text-gray-500">No appointments yet</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {sortedAppointments.map((appointment) => {
                    const isPast = isDatePast(appointment.date);
                    return (
                      <div
                        key={appointment.id}
                        onClick={() => loadAppointment(appointment)}
                        className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                          selectedAppointmentId === appointment.id
                            ? 'border-teal-300 bg-teal-50'
                            : appointment.completed
                            ? 'border-green-200 bg-green-50'
                            : isPast
                            ? 'border-red-200 bg-red-50'
                            : 'border-gray-200 hover:bg-gray-50'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <Calendar size={14} className="text-gray-400" />
                              <span className="text-sm font-medium text-gray-700">
                                {formatDate(appointment.date)}
                              </span>
                              {appointment.completed && (
                                <span className="text-xs text-green-600 font-medium">✓ Done</span>
                              )}
                              {!appointment.completed && isPast && (
                                <span className="text-xs text-red-600 font-medium">Overdue</span>
                              )}
                            </div>
                            {appointment.notes && (
                              <p className="text-sm text-gray-600 truncate">
                                {appointment.notes}
                              </p>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={(e) => deleteAppointment(appointment.id, e)}
                              className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                            >
                              <Trash2 size={14} />
                            </button>
                            <ChevronRight size={16} className="text-gray-400" />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </>,
        document.body
      )}
    </div>
  );
}
