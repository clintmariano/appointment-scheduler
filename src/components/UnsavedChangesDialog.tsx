import React from 'react';
import { createPortal } from 'react-dom';
import { AlertTriangle, X, Save, Trash2 } from 'lucide-react';

interface UnsavedChangesDialogProps {
  onSave: () => void;
  onDiscard: () => void;
  onCancel: () => void;
}

export function UnsavedChangesDialog({
  onSave,
  onDiscard,
  onCancel
}: UnsavedChangesDialogProps) {
  return createPortal(
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-50"
        onClick={onCancel}
      />

      {/* Dialog */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full" onClick={(e) => e.stopPropagation()}>
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
                <AlertTriangle size={20} className="text-amber-600" />
              </div>
              <h2 className="text-lg font-semibold text-gray-800">
                Unsaved Changes
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
          <div className="p-4">
            <p className="text-gray-600">
              You have unsaved changes. Would you like to save them before leaving?
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
              onClick={onDiscard}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors"
            >
              <Trash2 size={18} />
              Discard
            </button>
            <button
              onClick={onSave}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-teal-500 text-white rounded-lg hover:bg-teal-600 font-medium transition-colors"
            >
              <Save size={18} />
              Save
            </button>
          </div>
        </div>
      </div>
    </>,
    document.body
  );
}
