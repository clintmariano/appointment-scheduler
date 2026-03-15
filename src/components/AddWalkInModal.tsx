import React, { useState, useEffect } from 'react';
import { X, Search, User } from 'lucide-react';
import { PatientDocument } from '../types';
import { TicketUrgency, PatientGroup } from '../types/queue';

interface AddWalkInModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    patientId?: string;
    patientName: string;
    patientBirthday?: string;
    urgency: TicketUrgency;
    patientGroup: PatientGroup;
    notes: string;
  }) => void;
  patients: PatientDocument[];
  isLoading?: boolean;
}

export function AddWalkInModal({
  isOpen,
  onClose,
  onSubmit,
  patients,
  isLoading = false
}: AddWalkInModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPatient, setSelectedPatient] = useState<PatientDocument | null>(null);
  const [patientName, setPatientName] = useState('');
  const [urgency, setUrgency] = useState<TicketUrgency>('normal');
  const [patientGroup, setPatientGroup] = useState<PatientGroup>('general');
  const [notes, setNotes] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);

  // Auto-set patient group to pregnant when urgency is urgent or emergency
  useEffect(() => {
    if (urgency === 'urgent' || urgency === 'emergency') {
      setPatientGroup('pregnant');
    } else if (!selectedPatient) {
      // Only reset to general if no patient is selected (patient selection might override this)
      setPatientGroup('general');
    }
  }, [urgency]);

  // Filter patients based on search
  const filteredPatients = patients.filter(p =>
    p.patientName.toLowerCase().includes(searchQuery.toLowerCase())
  ).slice(0, 10);

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setSearchQuery('');
      setSelectedPatient(null);
      setPatientName('');
      setUrgency('normal');
      setPatientGroup('general');
      setNotes('');
    }
  }, [isOpen]);

  // Handle patient selection
  const handleSelectPatient = (patient: PatientDocument) => {
    setSelectedPatient(patient);
    setPatientName(patient.patientName);
    setSearchQuery(patient.patientName);
    setShowDropdown(false);

    // Auto-detect if pregnant (has LMP or current pregnancy records)
    if (patient.lmp || (patient.currentPregnancyRecords && patient.currentPregnancyRecords.length > 0)) {
      setPatientGroup('pregnant');
    }
  };

  // Handle submit
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const name = selectedPatient ? selectedPatient.patientName : (patientName || searchQuery);
    if (!name.trim()) return;

    onSubmit({
      patientId: selectedPatient?.id,
      patientName: name,
      patientBirthday: selectedPatient?.birthday,
      urgency,
      patientGroup,
      notes
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-lg mx-4">
        {/* Header */}
        <div className="p-4 border-b flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Add Walk-In Patient</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {/* Patient Search/Select */}
          <div className="relative">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Patient *
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setShowDropdown(true);
                  if (!e.target.value) setSelectedPatient(null);
                }}
                onFocus={() => setShowDropdown(true)}
                placeholder="Search existing patient or enter new name..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              />
            </div>

            {/* Dropdown */}
            {showDropdown && searchQuery && (
              <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                {filteredPatients.length > 0 ? (
                  filteredPatients.map((patient) => (
                    <button
                      key={patient.id}
                      type="button"
                      onClick={() => handleSelectPatient(patient)}
                      className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-3"
                    >
                      <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                        <User size={16} className="text-gray-500" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{patient.patientName}</p>
                        <p className="text-sm text-gray-500">{patient.birthday}</p>
                      </div>
                    </button>
                  ))
                ) : (
                  <div className="px-4 py-3 text-sm text-gray-500">
                    No patients found. The name will be used as-is.
                  </div>
                )}
              </div>
            )}
          </div>

          {/* If no patient selected, show manual name input */}
          {!selectedPatient && searchQuery && (
            <p className="text-sm text-gray-500">
              Using "{searchQuery}" as patient name
            </p>
          )}

          {/* Urgency */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Urgency
            </label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setUrgency('normal')}
                className={`
                  flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors border
                  ${urgency === 'normal'
                    ? 'bg-gray-200 border-gray-300 text-gray-700'
                    : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'}
                `}
              >
                Normal
              </button>
              <button
                type="button"
                onClick={() => setUrgency('urgent')}
                className={`
                  flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors border
                  ${urgency === 'urgent'
                    ? 'bg-amber-100 border-amber-300 text-amber-700'
                    : 'bg-white border-gray-200 text-gray-500 hover:bg-amber-50'}
                `}
              >
                Urgent
              </button>
              <button
                type="button"
                onClick={() => setUrgency('emergency')}
                className={`
                  flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors border
                  ${urgency === 'emergency'
                    ? 'bg-red-100 border-red-300 text-red-700'
                    : 'bg-white border-gray-200 text-gray-500 hover:bg-red-50'}
                `}
              >
                Emergency
              </button>
            </div>
          </div>

          {/* Patient Group */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Patient Type
              {(urgency === 'urgent' || urgency === 'emergency') && (
                <span className="ml-2 text-xs text-amber-600 font-normal">(Always OB for urgent/emergency)</span>
              )}
            </label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setPatientGroup('pregnant')}
                disabled={urgency === 'urgent' || urgency === 'emergency'}
                className={`
                  flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors border
                  ${patientGroup === 'pregnant'
                    ? 'bg-teal-100 border-teal-300 text-teal-700'
                    : 'bg-white border-gray-200 text-gray-500 hover:bg-teal-50'}
                  ${(urgency === 'urgent' || urgency === 'emergency') ? 'cursor-default opacity-100' : ''}
                `}
              >
                OB Patient
              </button>
              <button
                type="button"
                onClick={() => setPatientGroup('general')}
                disabled={urgency === 'urgent' || urgency === 'emergency'}
                className={`
                  flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors border
                  ${patientGroup === 'general'
                    ? 'bg-gray-200 border-gray-300 text-gray-700'
                    : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'}
                  ${(urgency === 'urgent' || urgency === 'emergency')
                    ? 'opacity-50 cursor-not-allowed'
                    : ''}
                `}
              >
                Non-OB
              </button>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notes
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Reason for visit, symptoms, etc."
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent resize-none"
            />
          </div>
        </form>

        {/* Footer */}
        <div className="p-4 border-t bg-gray-50 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isLoading || (!selectedPatient && !searchQuery.trim())}
            className="px-4 py-2 bg-teal-600 text-white rounded-lg font-medium hover:bg-teal-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Adding...' : 'Add to Queue'}
          </button>
        </div>
      </div>
    </div>
  );
}
