import React, { useState, useMemo, useEffect } from 'react';
import { PatientDocument, formatAOG, AOG, AppointmentPriority } from '../types';
import {
  Clock,
  ChevronLeft,
  ChevronRight,
  X,
  Phone
} from 'lucide-react';
import { onAppointmentAlert } from '../services/socketService';

// Alert banner type
interface AlertBanner {
  id: string;
  message: string;
  type: 'emergency' | 'warning' | 'info';
  patientId?: string;
}

// Appointment item for display
interface AppointmentItem {
  id: string;
  patientId: string;
  patientName: string;
  date: Date;
  startTime: string;
  endTime: string;
  aog: AOG | null;
  priority: AppointmentPriority;
  notes: string;
  // Current visit intake (from check-in)
  intakeSubjective?: string;
  intakeObjective?: string;
  checkedIn?: boolean;
  // Previous visit summary (for reference in modal)
  subjective?: string;
  objective?: string;
  assessment?: string;
  plan?: string;
  lastVisitDate?: string;
  lastVisitType?: string;
}

// Workflow step persistence key
const WORKFLOW_STEPS_KEY = 'physician_workflow_steps';
const DISMISSED_ALERTS_KEY = 'dismissed_appointment_alerts';

// Helper to get persisted workflow steps
function getPersistedWorkflowSteps(): Record<string, string> {
  try {
    return JSON.parse(localStorage.getItem(WORKFLOW_STEPS_KEY) || '{}');
  } catch {
    return {};
  }
}

// Helper to save workflow step
function saveWorkflowStep(appointmentId: string, step: string): void {
  const steps = getPersistedWorkflowSteps();
  steps[appointmentId] = step;
  localStorage.setItem(WORKFLOW_STEPS_KEY, JSON.stringify(steps));
}

// Helper to get persisted dismissed alerts
function getPersistedDismissedAlerts(): string[] {
  try {
    return JSON.parse(localStorage.getItem(DISMISSED_ALERTS_KEY) || '[]');
  } catch {
    return [];
  }
}

// Helper to save dismissed alert
function saveDismissedAlert(alertId: string): void {
  const dismissed = getPersistedDismissedAlerts();
  if (!dismissed.includes(alertId)) {
    dismissed.push(alertId);
    localStorage.setItem(DISMISSED_ALERTS_KEY, JSON.stringify(dismissed));
  }
}


// Modal for patient details
interface PatientModalProps {
  appointment: AppointmentItem | null;
  onClose: () => void;
  onUpdateEHR: () => void;
  onCallAssistant: () => void;
}

function PatientModal({ appointment, onClose, onUpdateEHR, onCallAssistant }: PatientModalProps) {
  const [step, setStep] = useState<'pending' | 'ehr_updated' | 'assistant_called'>('pending');

  // Load persisted step when appointment changes
  useEffect(() => {
    if (appointment?.id) {
      const steps = getPersistedWorkflowSteps();
      const savedStep = steps[appointment.id];
      if (savedStep === 'ehr_updated' || savedStep === 'assistant_called') {
        setStep(savedStep);
      } else {
        setStep('pending');
      }
    }
  }, [appointment?.id]);

  if (!appointment) return null;

  const isEmergency = appointment.priority === 'emergency';
  const isUrgent = appointment.priority === 'urgent';

  const handleUpdateEHR = () => {
    onUpdateEHR();
    setStep('ehr_updated');
    saveWorkflowStep(appointment.id, 'ehr_updated');
  };

  const handleCallAssistant = () => {
    onCallAssistant();
    setStep('assistant_called');
    saveWorkflowStep(appointment.id, 'assistant_called');
  };

  const handleCallER = () => {
    // Placeholder for Call ER functionality
    console.log('Calling ER for patient:', appointment.patientName);
    alert('Initiating call to nearest hospital ER...');
  };

  const handleCallEmergencyContact = () => {
    // Placeholder for Call Emergency Contact functionality
    console.log('Calling emergency contact for patient:', appointment.patientName);
    alert('Initiating call to patient emergency contact...');
  };

  // Priority-based border color for modal
  const priorityBorderColor = isEmergency
    ? 'border-t-4 border-t-red-500'
    : isUrgent
    ? 'border-t-4 border-t-amber-400'
    : '';

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className={`bg-white rounded-2xl max-w-md w-full p-6 relative max-h-[90vh] overflow-y-auto ${priorityBorderColor}`}>
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
        >
          <X size={20} />
        </button>

        <h2 className="text-xl font-bold text-gray-900 mb-1">{appointment.patientName}</h2>
        <p className="text-gray-600 mb-4">
          {appointment.lastVisitType || 'Previous Routine Check-up'} (SOAP)
        </p>

        <div className="space-y-3 text-sm">
          <div>
            <span className="font-semibold text-gray-700">Date:</span>{' '}
            <span className="text-gray-600">
              {appointment.date.toLocaleDateString('en-US', {
                month: '2-digit',
                day: '2-digit',
                year: 'numeric'
              })}
            </span>
          </div>

          {appointment.aog && (
            <div>
              <span className="font-semibold text-gray-700">AOG:</span>{' '}
              <span className="text-gray-600">{formatAOG(appointment.aog)}</span>
            </div>
          )}

          {/* Current Visit Intake (from assistant check-in) */}
          {(appointment.intakeSubjective || appointment.intakeObjective) && (
            <>
              {appointment.intakeSubjective && (
                <div>
                  <span className="font-semibold text-teal-600">S:</span>{' '}
                  <span className="text-gray-600">{appointment.intakeSubjective}</span>
                </div>
              )}

              {appointment.intakeObjective && (
                <div>
                  <span className="font-semibold text-amber-600">O:</span>{' '}
                  <span className="text-gray-600">{appointment.intakeObjective}</span>
                </div>
              )}
            </>
          )}

          {/* Show message if no intake yet */}
          {!appointment.intakeSubjective && !appointment.intakeObjective && (
            <div className="text-gray-400 italic text-xs py-2">
              No intake recorded yet. Assistant can add S and O during check-in.
            </div>
          )}

          {/* Previous Visit Summary (collapsed/reference) */}
          {(appointment.assessment || appointment.plan) && (
            <div className="mt-3 pt-3 border-t border-gray-100">
              <p className="text-xs text-gray-400 mb-2">Previous Visit ({appointment.lastVisitDate || 'N/A'})</p>
              {appointment.assessment && (
                <div>
                  <span className="font-semibold text-blue-600">A:</span>{' '}
                  <span className="text-gray-600">{appointment.assessment}</span>
                </div>
              )}

              {appointment.plan && (
                <div>
                  <span className="font-semibold text-purple-600">P:</span>{' '}
                  <span className="text-gray-600">{appointment.plan}</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Primary action button */}
        <div className="mt-6 flex justify-center">
          {step === 'pending' ? (
            <button
              onClick={handleUpdateEHR}
              className="px-6 py-2.5 bg-teal-500 text-white rounded-full font-medium hover:bg-teal-600 transition-colors"
            >
              Update EHR
            </button>
          ) : (
            <button
              onClick={handleCallAssistant}
              className="px-6 py-2.5 bg-teal-500 text-white rounded-full font-medium hover:bg-teal-600 transition-colors flex items-center gap-2"
            >
              <Phone size={16} />
              Call Assistant
            </button>
          )}
        </div>

        {/* Quick actions for emergency/urgent appointments */}
        {(isEmergency || isUrgent) && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <p className="text-xs text-gray-500 text-center mb-3">Quick Actions</p>
            <div className="flex justify-center gap-2">
              {isEmergency && (
                <button
                  onClick={handleCallER}
                  className="px-4 py-2 bg-red-500 text-white rounded-full text-sm font-medium hover:bg-red-600 transition-colors flex items-center gap-1.5"
                >
                  <Phone size={14} />
                  Call ER
                </button>
              )}
              <button
                onClick={handleCallEmergencyContact}
                className="px-4 py-2 bg-amber-500 text-white rounded-full text-sm font-medium hover:bg-amber-600 transition-colors flex items-center gap-1.5"
              >
                <Phone size={14} />
                Emergency Contact
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Alert banner component
function AlertBannerComponent({
  alert,
  onDismiss
}: {
  alert: AlertBanner;
  onDismiss: (id: string) => void;
}) {
  const bgColor = alert.type === 'emergency'
    ? 'bg-red-500'
    : alert.type === 'warning'
    ? 'bg-amber-100 text-amber-800'
    : 'bg-gray-100 text-gray-800';

  const textColor = alert.type === 'emergency' ? 'text-white' : '';

  return (
    <div className={`${bgColor} ${textColor} px-4 py-2 rounded-full flex items-center gap-2 text-sm font-medium`}>
      <span>{alert.message}</span>
      <button
        onClick={() => onDismiss(alert.id)}
        className={`hover:opacity-70 ${alert.type === 'emergency' ? 'text-white' : 'text-gray-600'}`}
      >
        <X size={16} />
      </button>
    </div>
  );
}

// Appointment card component
function AppointmentCard({
  appointment,
  onClick
}: {
  appointment: AppointmentItem;
  onClick: () => void;
}) {
  const borderColor = appointment.priority === 'emergency'
    ? 'border-l-red-500'
    : appointment.priority === 'urgent'
    ? 'border-l-amber-400'
    : 'border-l-green-400';

  const bgColor = appointment.priority === 'emergency'
    ? 'bg-red-50'
    : appointment.priority === 'urgent'
    ? 'bg-amber-50'
    : 'bg-gray-50';

  // Use intake data (current visit) if available, otherwise show nothing
  const displaySubjective = appointment.intakeSubjective;
  const displayObjective = appointment.intakeObjective;

  return (
    <div
      onClick={onClick}
      className={`${bgColor} border-l-4 ${borderColor} rounded-lg p-4 cursor-pointer hover:shadow-md transition-shadow`}
    >
      <div className="text-xs text-gray-500 mb-1">
        {appointment.startTime} - {appointment.endTime}
      </div>
      <h4 className="font-semibold text-gray-900 mb-1">{appointment.patientName}</h4>
      {appointment.aog && (
        <div className="text-sm text-gray-600 mb-2">
          <span className="font-medium">AOG:</span> {formatAOG(appointment.aog)}
        </div>
      )}
      {displaySubjective && (
        <div className="text-sm text-gray-600 mb-1">
          <span className="font-semibold text-teal-600">S:</span> {displaySubjective}
        </div>
      )}
      {displayObjective && (
        <div className="text-sm text-gray-600">
          <span className="font-semibold text-amber-600">O:</span> {displayObjective}
        </div>
      )}
    </div>
  );
}

// Real-time notification popup
interface NotificationPopup {
  id: string;
  patientName: string;
  priority: 'emergency' | 'urgent' | 'routine';
  message: string;
}

interface AppointmentsViewProps {
  patients: PatientDocument[];
  onSelectPatient: (id: string) => void;
  onScheduleAppointment: () => void;
  onRefresh?: () => void; // For polling new data
}

export function AppointmentsView({ patients, onSelectPatient, onScheduleAppointment, onRefresh }: AppointmentsViewProps) {
  const [selectedDate, setSelectedDate] = useState<Date>(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate());
  });

  const [selectedAppointment, setSelectedAppointment] = useState<AppointmentItem | null>(null);
  const [alerts, setAlerts] = useState<AlertBanner[]>([]);
  // Initialize dismissed alerts from localStorage
  const [dismissedAlerts, setDismissedAlerts] = useState<Set<string>>(() => {
    return new Set(getPersistedDismissedAlerts());
  });
  // Real-time notification popup
  const [notification, setNotification] = useState<NotificationPopup | null>(null);
  // Track seen appointment IDs to detect new ones
  const [seenAppointmentIds, setSeenAppointmentIds] = useState<Set<string>>(() => {
    // Initialize with current appointments
    const ids = new Set<string>();
    const today = new Date().toISOString().split('T')[0];
    patients.forEach(patient => {
      patient.followUpDates?.forEach(followUp => {
        if (followUp.date === today && !followUp.completed) {
          ids.add(followUp.id);
        }
      });
    });
    return ids;
  });

  // Listen for real-time appointment alerts via WebSocket
  useEffect(() => {
    const unsubscribe = onAppointmentAlert((data) => {
      console.log('Received appointment alert via WebSocket:', data);

      // Show notification popup
      setNotification({
        id: data.appointmentId,
        patientName: data.patientName,
        priority: data.priority,
        message: data.priority === 'emergency'
          ? 'Emergency patient alert!'
          : data.priority === 'urgent'
          ? 'New patient with symptomatic concern.'
          : 'New walk-in patient added.'
      });

      // Mark as seen
      setSeenAppointmentIds(prev => new Set([...prev, data.appointmentId]));

      // Auto-dismiss after 10 seconds
      setTimeout(() => {
        setNotification(prev => prev?.id === data.appointmentId ? null : prev);
      }, 10000);

      // Refresh data to get the new appointment
      if (onRefresh) {
        onRefresh();
      }
    });

    return () => {
      unsubscribe();
    };
  }, [onRefresh]);

  // Initialize alerts from patient data (only show non-dismissed)
  useEffect(() => {
    const newAlerts: AlertBanner[] = [];
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];

    patients.forEach(patient => {
      patient.followUpDates?.forEach(followUp => {
        if (followUp.date === todayStr && !followUp.completed) {
          const alertId = `alert-${patient.id}-${followUp.id}`;
          // Check against persisted dismissed alerts
          if (!dismissedAlerts.has(alertId)) {
            if (followUp.priority === 'emergency') {
              newAlerts.push({
                id: alertId,
                message: 'Emergency patient alert!',
                type: 'emergency',
                patientId: patient.id
              });
            } else if (followUp.priority === 'urgent') {
              newAlerts.push({
                id: alertId,
                message: 'New patient with symptomatic concern.',
                type: 'warning',
                patientId: patient.id
              });
            }
          }
        }
      });
    });

    setAlerts(newAlerts);
  }, [patients, dismissedAlerts]);

  // Get the week containing the selected date
  const getWeekDates = (date: Date) => {
    const day = date.getDay();
    const diff = date.getDate() - day;
    const weekStart = new Date(date.getFullYear(), date.getMonth(), diff);

    const dates: Date[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(weekStart);
      d.setDate(weekStart.getDate() + i);
      dates.push(d);
    }
    return dates;
  };

  const weekDates = getWeekDates(selectedDate);
  const weekDays = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

  const prevWeek = () => {
    const newDate = new Date(selectedDate);
    newDate.setDate(selectedDate.getDate() - 7);
    setSelectedDate(newDate);
  };

  const nextWeek = () => {
    const newDate = new Date(selectedDate);
    newDate.setDate(selectedDate.getDate() + 7);
    setSelectedDate(newDate);
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  const isSelected = (date: Date) => {
    return (
      date.getDate() === selectedDate.getDate() &&
      date.getMonth() === selectedDate.getMonth() &&
      date.getFullYear() === selectedDate.getFullYear()
    );
  };

  // Generate mock appointments from patient data
  const appointments = useMemo((): AppointmentItem[] => {
    const items: AppointmentItem[] = [];
    const baseHour = 9;

    patients.forEach((patient, patientIndex) => {
      if (patient.followUpDates && Array.isArray(patient.followUpDates)) {
        patient.followUpDates.forEach((followUp, followUpIndex) => {
          if (followUp.date && !followUp.completed) {
            const [year, month, day] = followUp.date.split('-').map(Number);
            const appointmentDate = new Date(year, month - 1, day);

            // Calculate time slot
            const slotIndex = (patientIndex + followUpIndex) % 6;
            const hour = baseHour + Math.floor(slotIndex / 2);
            const minutes = (slotIndex % 2) * 30;
            const startTime = followUp.startTime || `${hour.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
            const endHour = minutes === 30 ? hour + 1 : hour;
            const endMinutes = minutes === 30 ? 0 : 30;
            const endTime = followUp.endTime || `${endHour.toString().padStart(2, '0')}:${endMinutes.toString().padStart(2, '0')}`;

            // Calculate AOG from patient LMP if available
            let aog: AOG | null = followUp.aog || null;
            if (!aog && patient.lmp) {
              const lmpDate = new Date(patient.lmp);
              const diffTime = appointmentDate.getTime() - lmpDate.getTime();
              const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
              const weeks = Math.floor(diffDays / 7);
              const days = diffDays % 7;
              aog = { weeks, days };
            }

            // Get last visit info
            const lastVisit = patient.obVisits?.[patient.obVisits.length - 1] ||
                             patient.soapVisits?.[patient.soapVisits.length - 1];

            items.push({
              id: followUp.id,
              patientId: patient.id,
              patientName: patient.patientName,
              date: appointmentDate,
              startTime: formatTimeDisplay(startTime),
              endTime: formatTimeDisplay(endTime),
              aog,
              priority: followUp.priority || 'routine',
              notes: followUp.notes || '',
              // Current visit intake (from assistant check-in)
              intakeSubjective: followUp.intake?.subjective,
              intakeObjective: followUp.intake?.objective,
              checkedIn: !!followUp.intake?.checkedInAt,
              // Previous visit summary (for reference)
              subjective: followUp.lastVisitSummary?.subjective ||
                         (lastVisit && 'subjective' in lastVisit ? lastVisit.subjective?.notes : undefined),
              objective: followUp.lastVisitSummary?.objective ||
                        (lastVisit && 'objective' in lastVisit ? formatObjective(lastVisit.objective) : undefined),
              assessment: followUp.lastVisitSummary?.assessment ||
                         (lastVisit ? lastVisit.assessment : undefined),
              plan: followUp.lastVisitSummary?.plan ||
                   (lastVisit ? lastVisit.plan : undefined),
              lastVisitDate: followUp.lastVisitSummary?.date ||
                            (lastVisit ? lastVisit.visitDate : undefined),
              lastVisitType: followUp.lastVisitSummary?.visitType || 'Routine Check-up'
            });
          }
        });
      }
    });

    return items.sort((a, b) => {
      // Sort by time
      return a.startTime.localeCompare(b.startTime);
    });
  }, [patients]);

  // Filter appointments for selected date
  const todaysAppointments = appointments.filter(apt => {
    return (
      apt.date.getDate() === selectedDate.getDate() &&
      apt.date.getMonth() === selectedDate.getMonth() &&
      apt.date.getFullYear() === selectedDate.getFullYear()
    );
  });

  // Group appointments by hour
  const appointmentsByHour = useMemo(() => {
    const grouped: { [hour: number]: AppointmentItem[] } = {};
    todaysAppointments.forEach(apt => {
      const hourMatch = apt.startTime.match(/^(\d+):/);
      if (hourMatch) {
        let hour = parseInt(hourMatch[1]);
        // Convert 12-hour to 24-hour for sorting
        if (apt.startTime.includes('PM') && hour !== 12) hour += 12;
        if (apt.startTime.includes('AM') && hour === 12) hour = 0;

        if (!grouped[hour]) grouped[hour] = [];
        grouped[hour].push(apt);
      }
    });
    return grouped;
  }, [todaysAppointments]);

  const hours = Object.keys(appointmentsByHour)
    .map(Number)
    .sort((a, b) => a - b);

  const dismissAlert = (id: string) => {
    setDismissedAlerts(prev => new Set([...prev, id]));
    // Persist to localStorage so it stays dismissed after refresh
    saveDismissedAlert(id);
  };

  const dismissNotification = () => {
    setNotification(null);
  };

  const handleAppointmentClick = (appointment: AppointmentItem) => {
    setSelectedAppointment(appointment);
  };

  const handleUpdateEHR = () => {
    if (selectedAppointment) {
      onSelectPatient(selectedAppointment.patientId);
    }
  };

  const handleCallAssistant = () => {
    // Placeholder for call assistant functionality
    console.log('Calling assistant for patient:', selectedAppointment?.patientName);
  };

  return (
    <div className="flex-1 overflow-auto bg-slate-50">
      {/* Real-time Notification Popup */}
      {notification && (
        <div className="fixed top-4 right-4 z-50 animate-pulse">
          <div className={`rounded-2xl shadow-2xl p-4 max-w-sm border-l-4 ${
            notification.priority === 'emergency'
              ? 'bg-red-50 border-red-500'
              : notification.priority === 'urgent'
              ? 'bg-amber-50 border-amber-500'
              : 'bg-teal-50 border-teal-500'
          }`}>
            <div className="flex items-start gap-3">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                notification.priority === 'emergency'
                  ? 'bg-red-500'
                  : notification.priority === 'urgent'
                  ? 'bg-amber-500'
                  : 'bg-teal-500'
              }`}>
                <span className="text-white text-lg">!</span>
              </div>
              <div className="flex-1">
                <p className={`font-semibold ${
                  notification.priority === 'emergency'
                    ? 'text-red-800'
                    : notification.priority === 'urgent'
                    ? 'text-amber-800'
                    : 'text-teal-800'
                }`}>
                  {notification.message}
                </p>
                <p className="text-gray-600 text-sm mt-1">
                  {notification.patientName}
                </p>
              </div>
              <button
                onClick={dismissNotification}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={18} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Top Header with Search */}
      <div className="sticky top-0 bg-slate-50 z-10 px-6 pt-6 pb-2">
        {/* Alert Banners */}
        {alerts.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {alerts.map(alert => (
              <AlertBannerComponent
                key={alert.id}
                alert={alert}
                onDismiss={dismissAlert}
              />
            ))}
          </div>
        )}

        {/* Page Header */}
        <div className="mb-4">
          <h1 className="text-2xl font-bold text-gray-800">Appointments</h1>
          <p className="text-gray-500 text-sm">Manage patient appointments and follow-ups</p>
        </div>
      </div>

      <div className="px-6 pb-6">
        {/* Week Calendar Card */}
        <div className="bg-white rounded-2xl border border-gray-200 p-5 mb-6">
          {/* Week Navigation */}
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={prevWeek}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ChevronLeft size={20} className="text-gray-400" />
            </button>
            <h3 className="text-lg font-semibold text-gray-800">
              {selectedDate.toLocaleDateString('en-US', {
                weekday: 'long',
                month: 'long',
                day: 'numeric',
                year: 'numeric'
              })}
            </h3>
            <button
              onClick={nextWeek}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ChevronRight size={20} className="text-gray-400" />
            </button>
          </div>

          {/* Week Days Grid */}
          <div className="grid grid-cols-7 gap-2">
            {weekDates.map((date, index) => (
              <div
                key={index}
                onClick={() => setSelectedDate(date)}
                className="flex flex-col items-center cursor-pointer"
              >
                <span className="text-xs text-gray-400 font-medium mb-2">
                  {weekDays[index]}
                </span>
                <div
                  className={`
                    w-10 h-10 flex items-center justify-center rounded-full text-sm font-medium transition-all
                    ${isSelected(date)
                      ? 'bg-teal-500 text-white'
                      : isToday(date)
                      ? 'border-2 border-teal-500 text-teal-600'
                      : 'text-gray-700 hover:bg-gray-100'
                    }
                  `}
                >
                  {date.getDate()}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Upcoming Section */}
        <div className="bg-white rounded-2xl border border-gray-200 p-5">
          <div className="flex items-center gap-2 mb-6">
            <Clock className="w-5 h-5 text-teal-500" />
            <h3 className="text-lg font-semibold text-gray-700">
              Upcoming ({todaysAppointments.length})
            </h3>
          </div>

          {todaysAppointments.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-gray-400">
              <Clock size={48} className="mb-4 text-gray-300" />
              <p className="text-gray-500 mb-1">No appointments for this day.</p>
              <button
                onClick={onScheduleAppointment}
                className="text-teal-600 hover:text-teal-700 font-medium"
              >
                Schedule an appointment.
              </button>
            </div>
          ) : (
            <div className="relative">
              {/* Timeline */}
              {hours.map(hour => (
                <div key={hour} className="flex mb-4">
                  {/* Hour marker */}
                  <div className="w-12 flex-shrink-0 text-sm text-gray-400 pt-1">
                    {hour <= 12 ? hour : hour - 12}
                    <span className="text-xs ml-0.5">{hour < 12 ? 'AM' : 'PM'}</span>
                  </div>

                  {/* Appointments for this hour */}
                  <div className="flex-1 space-y-3 border-l-2 border-gray-100 pl-4">
                    {appointmentsByHour[hour]?.map(appointment => (
                      <AppointmentCard
                        key={appointment.id}
                        appointment={appointment}
                        onClick={() => handleAppointmentClick(appointment)}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Patient Modal */}
      <PatientModal
        appointment={selectedAppointment}
        onClose={() => setSelectedAppointment(null)}
        onUpdateEHR={handleUpdateEHR}
        onCallAssistant={handleCallAssistant}
      />
    </div>
  );
}

// Helper function to format time for display
function formatTimeDisplay(time: string): string {
  const [hours, minutes] = time.split(':').map(Number);
  const period = hours >= 12 ? 'PM' : 'AM';
  const displayHour = hours > 12 ? hours - 12 : hours === 0 ? 12 : hours;
  return `${displayHour}:${minutes.toString().padStart(2, '0')} ${period}`;
}

// Helper function to format objective data
function formatObjective(objective: any): string {
  if (!objective) return '';
  const parts: string[] = [];

  if (objective.bloodPressure) parts.push(`BP ${objective.bloodPressure}`);
  if (objective.weight) parts.push(`Wt ${objective.weight}kg`);
  if (objective.fundalHeight) parts.push(`FH ${objective.fundalHeight}cm`);
  if (objective.fetalHeartTone) parts.push(`FHT ${objective.fetalHeartTone} bpm`);
  if (objective.nst) parts.push(`Non-Stress Test (NST): ${objective.nst}`);
  if (objective.urineProtein) parts.push(`Urine dipstick: ${objective.urineProtein} for protein`);

  return parts.join('. ') + (parts.length > 0 ? '.' : '');
}
