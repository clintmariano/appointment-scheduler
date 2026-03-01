import React, { useState, useEffect, useCallback } from 'react';
import { PatientDocument, FollowUpDate } from '../types';
import { apiService } from '../services/api';
import { formatDate } from '../utils/documentUtils';
import { Calendar, User, Search, FileText, Clock, RefreshCw, X, UserCheck, AlertTriangle, Plus } from 'lucide-react';
import { Header } from './Header';
import { useAuth } from '../contexts/AuthContext';
import { emitNewAppointment, emitAppointmentUpdated } from '../services/socketService';

// Walk-in appointment modal
interface WalkInModalProps {
  patients: PatientDocument[];
  onClose: () => void;
  onSave: (patientId: string, priority: 'routine' | 'urgent' | 'emergency', subjective: string, objective: string) => void;
}

function WalkInModal({ patients, onClose, onSave }: WalkInModalProps) {
  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [priority, setPriority] = useState<'routine' | 'urgent' | 'emergency'>('urgent');
  const [subjective, setSubjective] = useState('');
  const [objective, setObjective] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const filteredPatients = patients.filter(p =>
    p.patientName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedPatient = patients.find(p => p.id === selectedPatientId);

  const handleSave = async () => {
    if (!selectedPatientId) {
      alert('Please select a patient');
      return;
    }
    setIsSaving(true);
    await onSave(selectedPatientId, priority, subjective, objective);
    setIsSaving(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 relative max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
        >
          <X size={20} />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
            <AlertTriangle size={20} className="text-red-600" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">Walk-In / Emergency</h2>
            <p className="text-sm text-gray-500">Add a patient without appointment</p>
          </div>
        </div>

        <div className="space-y-4">
          {/* Patient Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Patient
            </label>
            {!selectedPatient ? (
              <>
                <div className="relative mb-2">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                  <input
                    type="text"
                    placeholder="Search patients..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm"
                  />
                </div>
                <div className="max-h-32 overflow-y-auto border border-gray-200 rounded-lg">
                  {filteredPatients.slice(0, 5).map(patient => (
                    <button
                      key={patient.id}
                      onClick={() => setSelectedPatientId(patient.id)}
                      className="w-full text-left px-3 py-2 hover:bg-gray-50 text-sm border-b border-gray-100 last:border-b-0"
                    >
                      <span className="font-medium text-gray-900">{patient.patientName}</span>
                      {patient.lmp && (
                        <span className="text-gray-500 ml-2">AOG: {Math.floor((Date.now() - new Date(patient.lmp).getTime()) / (7 * 24 * 60 * 60 * 1000))} weeks</span>
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
                  onClick={() => setSelectedPatientId('')}
                  className="text-teal-600 hover:text-teal-800 text-sm"
                >
                  Change
                </button>
              </div>
            )}
          </div>

          {/* Priority Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Priority
            </label>
            <div className="flex gap-2">
              <button
                onClick={() => setPriority('emergency')}
                className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                  priority === 'emergency'
                    ? 'bg-red-500 text-white'
                    : 'bg-red-50 text-red-700 hover:bg-red-100'
                }`}
              >
                Emergency
              </button>
              <button
                onClick={() => setPriority('urgent')}
                className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                  priority === 'urgent'
                    ? 'bg-amber-500 text-white'
                    : 'bg-amber-50 text-amber-700 hover:bg-amber-100'
                }`}
              >
                Urgent
              </button>
              <button
                onClick={() => setPriority('routine')}
                className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                  priority === 'routine'
                    ? 'bg-green-500 text-white'
                    : 'bg-green-50 text-green-700 hover:bg-green-100'
                }`}
              >
                Routine
              </button>
            </div>
          </div>

          {/* S - Subjective */}
          <div>
            <label className="block text-sm font-semibold text-teal-600 mb-2">
              S: Subjective (Chief Complaint)
            </label>
            <textarea
              value={subjective}
              onChange={(e) => setSubjective(e.target.value)}
              placeholder="e.g., Patient presents for urgent walk-in. Reports decreased fetal movement since this morning."
              rows={3}
              className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent resize-none text-sm"
            />
          </div>

          {/* O - Objective */}
          <div>
            <label className="block text-sm font-semibold text-amber-600 mb-2">
              O: Objective (Vitals)
            </label>
            <textarea
              value={objective}
              onChange={(e) => setObjective(e.target.value)}
              placeholder="e.g., BP 118/74. Wt 71kg. FH 32cm. FHT 142 bpm."
              rows={3}
              className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent resize-none text-sm"
            />
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-5 py-2.5 text-gray-600 hover:bg-gray-100 rounded-lg font-medium transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving || !selectedPatientId}
            className={`px-5 py-2.5 text-white rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center gap-2 ${
              priority === 'emergency' ? 'bg-red-500 hover:bg-red-600' :
              priority === 'urgent' ? 'bg-amber-500 hover:bg-amber-600' :
              'bg-teal-500 hover:bg-teal-600'
            }`}
          >
            {isSaving ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Saving...
              </>
            ) : (
              'Add to Queue'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// Check-in modal for entering S and O
interface CheckInModalProps {
  followUp: (FollowUpDate & { patientName: string; patientId: string }) | null;
  onClose: () => void;
  onSave: (patientId: string, followUpId: string, subjective: string, objective: string) => void;
}

function CheckInModal({ followUp, onClose, onSave }: CheckInModalProps) {
  const [subjective, setSubjective] = useState('');
  const [objective, setObjective] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Load existing intake data if available
  useEffect(() => {
    if (followUp?.intake) {
      setSubjective(followUp.intake.subjective || '');
      setObjective(followUp.intake.objective || '');
    } else {
      setSubjective('');
      setObjective('');
    }
  }, [followUp]);

  if (!followUp) return null;

  const handleSave = async () => {
    setIsSaving(true);
    await onSave(followUp.patientId, followUp.id, subjective, objective);
    setIsSaving(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 relative max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
        >
          <X size={20} />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-teal-100 rounded-full flex items-center justify-center">
            <UserCheck size={20} className="text-teal-600" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">Patient Check-In</h2>
            <p className="text-sm text-gray-500">{followUp.patientName}</p>
          </div>
        </div>

        <div className="mb-4 p-3 bg-gray-50 rounded-lg text-sm">
          <span className="font-medium text-gray-700">Appointment:</span>{' '}
          <span className="text-gray-600">{formatDate(followUp.date)}</span>
          {followUp.startTime && (
            <span className="text-gray-600"> at {followUp.startTime}</span>
          )}
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-teal-600 mb-2">
              S: Subjective (Chief Complaint / Patient's Symptoms)
            </label>
            <textarea
              value={subjective}
              onChange={(e) => setSubjective(e.target.value)}
              placeholder="e.g., Patient presents for urgent walk-in. Reports decreased fetal movement since this morning. No vaginal bleeding or leaking of fluid."
              rows={4}
              className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent resize-none text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-amber-600 mb-2">
              O: Objective (Vitals / Measurements)
            </label>
            <textarea
              value={objective}
              onChange={(e) => setObjective(e.target.value)}
              placeholder="e.g., BP 118/74. Wt 71kg. FH 32cm. FHT 142 bpm. Non-Stress Test (NST): Reactive (2 accelerations in 20 mins)."
              rows={4}
              className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent resize-none text-sm"
            />
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-5 py-2.5 text-gray-600 hover:bg-gray-100 rounded-lg font-medium transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="px-5 py-2.5 bg-teal-500 text-white rounded-lg font-medium hover:bg-teal-600 transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {isSaving ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Saving...
              </>
            ) : (
              'Save Check-In'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export function AssistantView() {
  const { user } = useAuth();
  const [patients, setPatients] = useState<PatientDocument[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [checkInFollowUp, setCheckInFollowUp] = useState<(FollowUpDate & { patientName: string; patientId: string }) | null>(null);
  const [showWalkInModal, setShowWalkInModal] = useState(false);

  const loadPatients = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }
      setError('');
      const data = await apiService.getPatients();
      setPatients(data);
      console.log('Loaded patients for assistant:', data.length);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load patient data';
      setError(errorMessage);
      console.error('Error loading patients:', err);
      setPatients([]);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadPatients();
  }, [loadPatients]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      loadPatients(true);
    }, 30000);
    return () => clearInterval(interval);
  }, [loadPatients]);

  const handleRefresh = () => {
    loadPatients(true);
  };

  const filteredPatients = patients.filter(patient =>
    patient.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (patient.nickname && patient.nickname.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Helper to normalize date to local midnight for comparison
  const normalizeDate = (dateStr: string) => {
    const [year, month, day] = dateStr.split('-').map(Number);
    return new Date(year, month - 1, day);
  };

  const getTodayNormalized = () => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate());
  };

  const getUpcomingFollowUps = () => {
    const today = getTodayNormalized();
    const upcoming = [];

    for (const patient of filteredPatients) {
      if (patient.followUpDates && Array.isArray(patient.followUpDates)) {
        for (const followUp of patient.followUpDates) {
          if (followUp.date && !followUp.completed) {
            const followUpDate = normalizeDate(followUp.date);
            if (followUpDate >= today) {
              upcoming.push({
                ...followUp,
                patientName: patient.patientName,
                patientId: patient.id,
                patientBirthday: patient.birthday,
                patientGender: patient.gender
              });
            }
          }
        }
      }
    }

    return upcoming.sort((a, b) => normalizeDate(a.date).getTime() - normalizeDate(b.date).getTime());
  };

  const upcomingFollowUps = getUpcomingFollowUps();

  const handleCheckboxChange = async (
    patientId: string,
    followUpId: string,
    field: 'reminded' | 'confirmed',
    value: boolean
  ) => {
    // Update local state immediately for responsive UI
    setPatients(prev => prev.map(patient => {
      if (patient.id === patientId && patient.followUpDates) {
        return {
          ...patient,
          followUpDates: patient.followUpDates.map(f =>
            f.id === followUpId ? { ...f, [field]: value } : f
          )
        };
      }
      return patient;
    }));

    // Update server/local DB
    try {
      await apiService.updateFollowUpStatus(patientId, followUpId, { [field]: value });
    } catch (error) {
      console.error('Failed to update follow-up status:', error);
      // Revert on error
      loadPatients(true);
    }
  };

  // Handle check-in with S and O data
  const handleCheckInSave = async (
    patientId: string,
    followUpId: string,
    subjective: string,
    objective: string
  ) => {
    // Get patient info for notification
    const patient = patients.find(p => p.id === patientId);
    const followUp = patient?.followUpDates?.find(f => f.id === followUpId);

    // Update local state immediately
    setPatients(prev => prev.map(p => {
      if (p.id === patientId && p.followUpDates) {
        return {
          ...p,
          followUpDates: p.followUpDates.map(f =>
            f.id === followUpId
              ? {
                  ...f,
                  intake: {
                    subjective,
                    objective,
                    checkedInAt: new Date().toISOString(),
                    checkedInBy: user?.username || 'assistant'
                  },
                  checkInStatus: 'checked_in' as const
                }
              : f
          )
        };
      }
      return p;
    }));

    // Save to DB
    try {
      await apiService.updateFollowUpIntake(patientId, followUpId, {
        subjective,
        objective,
        checkedInBy: user?.username || 'assistant'
      });

      // Emit socket event if it's an urgent/emergency appointment
      if (patient && followUp && (followUp.priority === 'urgent' || followUp.priority === 'emergency')) {
        emitAppointmentUpdated({
          appointmentId: followUpId,
          patientId,
          patientName: patient.patientName,
          priority: followUp.priority,
          subjective,
          objective
        });
      }
    } catch (error) {
      console.error('Failed to save check-in:', error);
      loadPatients(true);
    }
  };

  // Handle creating a new walk-in appointment
  const handleWalkInSave = async (
    patientId: string,
    priority: 'routine' | 'urgent' | 'emergency',
    subjective: string,
    objective: string
  ) => {
    const patient = patients.find(p => p.id === patientId);
    if (!patient) return;

    const today = new Date().toISOString().split('T')[0];
    const now = new Date();
    const startTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

    // Calculate AOG if patient has LMP
    let aog = undefined;
    if (patient.lmp) {
      const lmpDate = new Date(patient.lmp);
      const diffTime = now.getTime() - lmpDate.getTime();
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      const weeks = Math.floor(diffDays / 7);
      const days = diffDays % 7;
      aog = { weeks, days };
    }

    const newFollowUp: FollowUpDate = {
      id: Math.random().toString(36).substring(2, 11),
      date: today,
      startTime,
      notes: 'Walk-in appointment',
      completed: false,
      reminded: true,
      confirmed: true,
      priority,
      aog,
      checkInStatus: 'checked_in',
      intake: {
        subjective,
        objective,
        checkedInAt: now.toISOString(),
        checkedInBy: user?.username || 'assistant'
      }
    };

    // Update local state
    setPatients(prev => prev.map(p => {
      if (p.id === patientId) {
        return {
          ...p,
          followUpDates: [...(p.followUpDates || []), newFollowUp]
        };
      }
      return p;
    }));

    // Save to DB
    try {
      const updatedPatient = {
        ...patient,
        followUpDates: [...(patient.followUpDates || []), newFollowUp]
      };
      await apiService.updatePatient(patientId, updatedPatient);

      // Emit socket event for real-time notification to doctor
      emitNewAppointment({
        appointmentId: newFollowUp.id,
        patientId,
        patientName: patient.patientName,
        priority,
        subjective,
        objective
      });
    } catch (error) {
      console.error('Failed to create walk-in appointment:', error);
      loadPatients(true);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-100">
        <Header />
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="w-8 h-8 border-2 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-500 text-base">Loading patient data...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-100">
        <Header />
        <div className="w-full px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <FileText className="w-12 h-12 text-red-400 mx-auto mb-4" />
              <p className="text-red-600 mb-4 text-base">{error}</p>
              <button
                onClick={loadPatients}
                className="bg-gradient-to-r from-teal-500 to-cyan-500 text-white px-5 py-3 rounded-lg hover:from-teal-600 hover:to-cyan-600 text-base"
              >
                Retry
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100">
      <Header />

      <div className="w-full px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
        <div className="flex items-center justify-between mb-5 sm:mb-6">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-800">Follow-Up Dashboard</h2>
            <p className="text-sm sm:text-base text-gray-500">Track patient appointments</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowWalkInModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors text-sm font-medium"
            >
              <Plus size={16} />
              <span className="hidden sm:inline">Walk-In</span>
            </button>
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium text-gray-700 disabled:opacity-50"
            >
              <RefreshCw size={16} className={isRefreshing ? 'animate-spin' : ''} />
              <span className="hidden sm:inline">{isRefreshing ? 'Refreshing...' : 'Refresh'}</span>
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="mb-5 sm:mb-6">
          <div className="relative w-full sm:max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Search patients..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 text-base border border-gray-200 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent bg-white"
            />
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-2 gap-3 sm:gap-4 mb-5 sm:mb-6">
          <div className="bg-white rounded-xl border-2 border-teal-500 p-4 sm:p-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-teal-100 rounded-xl flex items-center justify-center">
                <Calendar className="w-5 h-5 sm:w-6 sm:h-6 text-teal-600" />
              </div>
              <div>
                <p className="text-2xl sm:text-3xl font-bold text-gray-800">{upcomingFollowUps.length}</p>
                <p className="text-xs sm:text-sm text-gray-500">Upcoming</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gray-100 rounded-xl flex items-center justify-center">
                <User className="w-5 h-5 sm:w-6 sm:h-6 text-gray-600" />
              </div>
              <div>
                <p className="text-2xl sm:text-3xl font-bold text-gray-800">{filteredPatients.length}</p>
                <p className="text-xs sm:text-sm text-gray-500">Patients</p>
              </div>
            </div>
          </div>
        </div>

        {/* Upcoming Appointments */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Clock className="w-5 h-5 text-teal-500" />
            <h3 className="text-base sm:text-lg font-semibold text-gray-700">Upcoming Appointments</h3>
          </div>

          {upcomingFollowUps.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <FileText size={48} className="mx-auto mb-3 text-gray-300" />
              <p className="text-sm sm:text-base">No upcoming appointments</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-sm text-gray-500">
                    <th className="pb-3 font-medium">Date</th>
                    <th className="pb-3 font-medium">Time</th>
                    <th className="pb-3 font-medium">Patient</th>
                    <th className="pb-3 font-medium text-center">Reminded</th>
                    <th className="pb-3 font-medium text-center">Confirmed</th>
                    <th className="pb-3 font-medium text-center">Check-In</th>
                  </tr>
                </thead>
                <tbody>
                  {upcomingFollowUps.slice(0, 10).map((followUp, index) => (
                    <tr key={index} className="border-t border-gray-100">
                      <td className="py-3 text-sm text-gray-700">
                        {formatDate(followUp.date)}
                      </td>
                      <td className="py-3 text-sm text-gray-700">9:00 AM</td>
                      <td className="py-3 text-sm text-gray-800">
                        <div className="font-medium">{followUp.patientName}</div>
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <span>{formatDate(followUp.patientBirthday)}</span>
                          <span className={`px-1.5 py-0.5 rounded ${followUp.patientGender === 'M' ? 'bg-blue-100 text-blue-600' : 'bg-pink-100 text-pink-600'}`}>
                            {followUp.patientGender}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 text-center">
                        <input
                          type="checkbox"
                          checked={followUp.reminded || false}
                          onChange={(e) => handleCheckboxChange(followUp.patientId, followUp.id, 'reminded', e.target.checked)}
                          className="w-4 h-4 text-teal-500 border-gray-300 rounded focus:ring-teal-500 cursor-pointer"
                        />
                      </td>
                      <td className="py-3 text-center">
                        <input
                          type="checkbox"
                          checked={followUp.confirmed || false}
                          onChange={(e) => handleCheckboxChange(followUp.patientId, followUp.id, 'confirmed', e.target.checked)}
                          className="w-4 h-4 text-teal-500 border-gray-300 rounded focus:ring-teal-500 cursor-pointer"
                        />
                      </td>
                      <td className="py-3 text-center">
                        <button
                          onClick={() => setCheckInFollowUp(followUp)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                            followUp.intake?.checkedInAt
                              ? 'bg-green-100 text-green-700 hover:bg-green-200'
                              : 'bg-teal-100 text-teal-700 hover:bg-teal-200'
                          }`}
                        >
                          {followUp.intake?.checkedInAt ? 'Edit S/O' : 'Check In'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* All Patients List */}
        <div className="mt-5 sm:mt-6 bg-white rounded-xl border border-gray-200 p-4 sm:p-5 shadow-sm">
          <h3 className="text-base sm:text-lg font-semibold text-gray-700 mb-4">All Patients</h3>

          {filteredPatients.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <User size={40} className="mx-auto mb-3 text-gray-300" />
              <p className="text-sm sm:text-base">No patients found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-3 sm:px-4 text-sm sm:text-base font-medium text-gray-500">Patient</th>
                    <th className="text-left py-3 px-3 sm:px-4 text-sm sm:text-base font-medium text-gray-500">Birthday</th>
                    <th className="text-left py-3 px-3 sm:px-4 text-sm sm:text-base font-medium text-gray-500">Gender</th>
                    <th className="text-left py-3 px-3 sm:px-4 text-sm sm:text-base font-medium text-gray-500">Follow-Ups</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPatients.map((patient) => (
                    <tr key={patient.id} className="border-b border-gray-50 hover:bg-gray-50">
                      <td className="py-3 sm:py-4 px-3 sm:px-4">
                        <div>
                          <p className="font-medium text-gray-800 text-base sm:text-lg">{patient.patientName}</p>
                          {patient.nickname && (
                            <p className="text-sm text-gray-500">"{patient.nickname}"</p>
                          )}
                        </div>
                      </td>
                      <td className="py-3 sm:py-4 px-3 sm:px-4 text-gray-600 text-sm sm:text-base">{formatDate(patient.birthday)}</td>
                      <td className="py-3 sm:py-4 px-3 sm:px-4">
                        <span className={`px-2 py-1 rounded-lg text-xs sm:text-sm font-medium ${
                          patient.gender === 'M' ? 'bg-blue-100 text-blue-600' : 'bg-pink-100 text-pink-600'
                        }`}>
                          {patient.gender}
                        </span>
                      </td>
                      <td className="py-3 sm:py-4 px-3 sm:px-4">
                        {patient.followUpDates && Array.isArray(patient.followUpDates) && patient.followUpDates.length > 0 ? (
                          <div className="flex items-center gap-2 flex-wrap">
                            {patient.followUpDates
                              .filter(f => f.date)
                              .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                              .slice(0, 2)
                              .map((followUp, index) => (
                                <span key={index} className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs sm:text-sm ${
                                  followUp.completed
                                    ? 'bg-green-100 text-green-600'
                                    : new Date(followUp.date) < new Date()
                                    ? 'bg-red-100 text-red-600'
                                    : 'bg-teal-100 text-teal-600'
                                }`}>
                                  {formatDate(followUp.date)}
                                </span>
                              ))}
                            {patient.followUpDates.filter(f => f.date).length > 2 && (
                              <span className="text-xs sm:text-sm text-gray-400">
                                +{patient.followUpDates.filter(f => f.date).length - 2}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-sm sm:text-base text-gray-400">None</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Check-In Modal */}
      <CheckInModal
        followUp={checkInFollowUp}
        onClose={() => setCheckInFollowUp(null)}
        onSave={handleCheckInSave}
      />

      {/* Walk-In Modal */}
      {showWalkInModal && (
        <WalkInModal
          patients={patients}
          onClose={() => setShowWalkInModal(false)}
          onSave={handleWalkInSave}
        />
      )}
    </div>
  );
}