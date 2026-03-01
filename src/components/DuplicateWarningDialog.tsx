import React from 'react';
import { createPortal } from 'react-dom';
import { AlertTriangle, X, Eye, UserPlus } from 'lucide-react';
import { formatDate } from '../utils/documentUtils';

interface ExistingPatient {
  id: string;
  patientName: string;
  birthday: string;
  gender: string;
  motherName?: string;
  fatherName?: string;
}

interface DuplicateWarningDialogProps {
  existingPatient: ExistingPatient;
  onCancel: () => void;
  onViewExisting: (id: string) => void;
  onCreateAnyway: () => void;
}

export function DuplicateWarningDialog({
  existingPatient,
  onCancel,
  onViewExisting,
  onCreateAnyway
}: DuplicateWarningDialogProps) {
  return createPortal(
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-50"
        onClick={onCancel}
      />

      {/* Dialog */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl max-w-md w-full" onClick={(e) => e.stopPropagation()}>
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
                <AlertTriangle size={20} className="text-amber-600" />
              </div>
              <h2 className="text-lg font-semibold text-gray-800">
                Potential Duplicate Found
              </h2>
            </div>
            <button
              onClick={onCancel}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {/* Content */}
          <div className="p-4 space-y-4">
            <p className="text-gray-600">
              A patient with similar information already exists in the system:
            </p>

            {/* Existing patient details */}
            <div className="bg-gray-50 rounded-xl p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Name</span>
                <span className="font-medium text-gray-800">{existingPatient.patientName}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Birthday</span>
                <span className="text-gray-800">{formatDate(existingPatient.birthday)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Gender</span>
                <span className={`px-2 py-0.5 rounded text-sm ${
                  existingPatient.gender === 'M'
                    ? 'bg-blue-100 text-blue-600'
                    : 'bg-pink-100 text-pink-600'
                }`}>
                  {existingPatient.gender === 'M' ? 'Male' : 'Female'}
                </span>
              </div>
              {existingPatient.motherName && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Mother</span>
                  <span className="text-gray-800">{existingPatient.motherName}</span>
                </div>
              )}
              {existingPatient.fatherName && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Father</span>
                  <span className="text-gray-800">{existingPatient.fatherName}</span>
                </div>
              )}
            </div>

            <p className="text-sm text-gray-500">
              Would you like to view the existing record, or create a new one anyway?
            </p>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-2 p-4 border-t border-gray-200">
            <button
              onClick={onCancel}
              className="flex-1 px-4 py-2.5 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => onViewExisting(existingPatient.id)}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-teal-500 text-white rounded-lg hover:bg-teal-600 font-medium transition-colors"
            >
              <Eye size={18} />
              View Existing
            </button>
            <button
              onClick={onCreateAnyway}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors"
            >
              <UserPlus size={18} />
              Create Anyway
            </button>
          </div>
        </div>
      </div>
    </>,
    document.body
  );
}
