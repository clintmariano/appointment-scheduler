import React, { useState, useMemo } from 'react';
import { PatientDocument, FollowUpDate, AppointmentPriority, formatAOG, AOG } from '../types';
import { formatDate } from '../utils/documentUtils';
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  User,
  AlertCircle,
  X
} from 'lucide-react';

interface AppointmentsViewProps {
  patients: PatientDocument[];
  onSelectPatient: (id: string) => void;
  onScheduleAppointment: (date?: string) => void;
  onRefresh?: () => void;
}

const MAX_APPOINTMENTS_PER_DAY = 10;

export function AppointmentsView({ patients, onSelectPatient, onScheduleAppointment }: AppointmentsViewProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  // Get all appointments grouped by date
  const appointmentsByDate = useMemo(() => {
    const map: Record<string, (FollowUpDate & { patientName: string; patientId: string })[]> = {};

    for (const patient of patients) {
      if (patient.followUpDates) {
        for (const followUp of patient.followUpDates) {
          if (followUp.date && !followUp.completed) {
            if (!map[followUp.date]) {
              map[followUp.date] = [];
            }
            map[followUp.date].push({
              ...followUp,
              patientName: patient.patientName,
              patientId: patient.id
            });
          }
        }
      }
    }

    // Sort appointments by ID (first booked, first served)
    for (const date of Object.keys(map)) {
      map[date].sort((a, b) => a.id.localeCompare(b.id));
    }

    return map;
  }, [patients]);

  // Get count for a specific date
  const getAppointmentCount = (dateStr: string): number => {
    return appointmentsByDate[dateStr]?.length || 0;
  };

  // Check if date is full
  const isDateFull = (dateStr: string): boolean => {
    return getAppointmentCount(dateStr) >= MAX_APPOINTMENTS_PER_DAY;
  };

  // Generate calendar days
  const calendarDays = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    const days: (Date | null)[] = [];

    // Add empty cells for days before the first of the month
    for (let i = 0; i < firstDay.getDay(); i++) {
      days.push(null);
    }

    // Add all days of the month
    for (let i = 1; i <= lastDay.getDate(); i++) {
      days.push(new Date(year, month, i));
    }

    return days;
  }, [currentMonth]);

  const formatDateStr = (date: Date): string => {
    return date.toLocaleDateString('en-CA', { timeZone: 'Asia/Manila' });
  };

  const isToday = (date: Date): boolean => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const isPast = (date: Date): boolean => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date < today;
  };

  const selectedDateAppointments = selectedDate ? appointmentsByDate[selectedDate] || [] : [];

  const handleAppointmentClick = (appointment: FollowUpDate & { patientName: string; patientId: string }) => {
    onSelectPatient(appointment.patientId);
  };

  return (
    <div className="flex-1 flex flex-col lg:flex-row gap-4 p-4 overflow-hidden bg-slate-50">
      {/* Calendar */}
      <div className="lg:w-2/3 bg-white rounded-xl border border-gray-200 p-4 flex flex-col overflow-hidden">
        {/* Calendar Header */}
        <div className="flex items-center justify-between mb-4 flex-shrink-0">
          <h2 className="text-lg font-bold text-gray-900">
            {currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' })}
          </h2>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))}
              className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ChevronLeft size={18} />
            </button>
            <button
              onClick={() => setCurrentMonth(new Date())}
              className="px-2 py-1 text-sm font-medium text-teal-600 hover:bg-teal-50 rounded-lg transition-colors"
            >
              Today
            </button>
            <button
              onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))}
              className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>

        {/* Day Headers */}
        <div className="grid grid-cols-7 gap-1 mb-2 flex-shrink-0">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="text-center text-xs font-medium text-gray-500 py-1">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-1 flex-1" style={{ gridTemplateRows: 'repeat(6, 1fr)' }}>
          {calendarDays.map((date, index) => {
            if (!date) {
              return <div key={index} className="h-full" />;
            }

            const dateStr = formatDateStr(date);
            const count = getAppointmentCount(dateStr);
            const isFull = isDateFull(dateStr);
            const past = isPast(date);
            const today = isToday(date);
            const selected = selectedDate === dateStr;

            return (
              <button
                key={index}
                onClick={() => setSelectedDate(dateStr)}
                disabled={past}
                className={`
                  h-full px-2 pt-4 pb-2 rounded-lg border transition-all flex flex-col justify-between
                  ${past ? 'opacity-40 cursor-not-allowed bg-gray-50' : 'hover:border-teal-300 cursor-pointer'}
                  ${today ? 'border-teal-500 border-2' : 'border-gray-100'}
                  ${selected ? 'bg-teal-50 border-teal-500' : 'bg-white'}
                `}
              >
                <div className={`text-base font-medium ${today ? 'text-teal-600' : 'text-gray-700'}`}>
                  {date.getDate()}
                </div>
                {count > 0 ? (
                  <div className={`
                    text-xs font-medium rounded px-1.5 py-0.5
                    ${isFull ? 'bg-red-100 text-red-600' : 'bg-teal-100 text-teal-600'}
                  `}>
                    {count}/{MAX_APPOINTMENTS_PER_DAY}
                  </div>
                ) : <div />}
              </button>
            );
          })}
        </div>

        {/* Legend */}
        <div className="mt-3 flex items-center gap-3 text-xs text-gray-500 flex-shrink-0">
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded bg-teal-100" />
            <span>Available</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded bg-red-100" />
            <span>Full ({MAX_APPOINTMENTS_PER_DAY} max)</span>
          </div>
        </div>
      </div>

      {/* Selected Date Details */}
      <div className="lg:w-1/3 bg-white rounded-xl border border-gray-200 p-4 overflow-auto">
        {selectedDate ? (
          <>
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-base font-semibold text-gray-900">
                  {formatDate(selectedDate)}
                </h3>
                <p className="text-xs text-gray-500">
                  {selectedDateAppointments.length} / {MAX_APPOINTMENTS_PER_DAY} appointments
                </p>
              </div>
              {!isDateFull(selectedDate) && !isPast(new Date(selectedDate)) && (
                <button
                  onClick={() => onScheduleAppointment(selectedDate)}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors text-xs font-medium"
                >
                  <Calendar size={14} />
                  Schedule
                </button>
              )}
            </div>

            {isDateFull(selectedDate) && (
              <div className="mb-3 p-2 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700 text-xs">
                <AlertCircle size={14} />
                This date is fully booked
              </div>
            )}

            {selectedDateAppointments.length === 0 ? (
              <div className="text-center py-6 text-gray-400">
                <Calendar size={32} className="mx-auto mb-2 opacity-50" />
                <p className="text-sm">No appointments scheduled</p>
              </div>
            ) : (
              <div className="space-y-2">
                {selectedDateAppointments.map((apt, index) => (
                  <button
                    key={apt.id}
                    onClick={() => handleAppointmentClick(apt)}
                    className={`
                      w-full text-left p-2 rounded-lg border transition-all hover:shadow-md
                      ${apt.priority === 'emergency' ? 'border-red-200 bg-red-50' :
                        apt.priority === 'urgent' ? 'border-amber-200 bg-amber-50' :
                        'border-gray-200 bg-gray-50'}
                    `}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className={`
                          w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold
                          ${apt.priority === 'emergency' ? 'bg-red-200 text-red-700' :
                            apt.priority === 'urgent' ? 'bg-amber-200 text-amber-700' :
                            'bg-teal-200 text-teal-700'}
                        `}>
                          {index + 1}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">{apt.patientName}</p>
                        </div>
                      </div>
                      {apt.priority && apt.priority !== 'routine' && (
                        <span className={`
                          text-xs px-1.5 py-0.5 rounded-full font-medium
                          ${apt.priority === 'emergency' ? 'bg-red-100 text-red-700' :
                            'bg-amber-100 text-amber-700'}
                        `}>
                          {apt.priority}
                        </span>
                      )}
                    </div>
                    {apt.notes && (
                      <p className="mt-1 text-xs text-gray-600">{apt.notes}</p>
                    )}
                    {apt.aog && (
                      <p className="mt-1 text-xs text-gray-500">
                        AOG: {formatAOG(apt.aog)}
                      </p>
                    )}
                  </button>
                ))}
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-6 text-gray-400">
            <Calendar size={32} className="mx-auto mb-2 opacity-50" />
            <p className="text-sm">Select a date to view appointments</p>
          </div>
        )}
      </div>
    </div>
  );
}
