import React from 'react';
import { PatientDocument } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { FileText, Calendar, Plus, X } from 'lucide-react';

interface DocumentListProps {
  documents: PatientDocument[];
  selectedDocument: string | null;
  onSelectDocument: (id: string) => void;
  onCreateNew: () => void;
  isOpen: boolean;
  onClose: () => void;
}

export function DocumentList({
  documents,
  selectedDocument,
  onSelectDocument,
  onCreateNew,
  isOpen,
  onClose
}: DocumentListProps) {
  const { user } = useAuth();

  const handleSelectDocument = (id: string) => {
    onSelectDocument(id);
    // Close sidebar on mobile after selection
    if (window.innerWidth < 1024) {
      onClose();
    }
  };

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}
      
      {/* Sidebar */}
      <div className={`
        fixed lg:relative inset-y-0 left-0 z-50 lg:z-0
        w-72 sm:w-80 lg:w-72 xl:w-80
        bg-slate-50 border-r border-gray-200
        transform transition-transform duration-300 ease-in-out lg:transform-none
        ${isOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0
        flex flex-col h-full
      `}>
        <div className="p-4 bg-white border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-base sm:text-sm font-semibold text-gray-700">Patient Records</h2>
            {user?.role === 'doctor' && (
              <button
                onClick={onCreateNew}
                className="flex items-center gap-1.5 bg-gradient-to-r from-teal-500 to-cyan-500 text-white px-3 py-2 rounded-lg hover:from-teal-600 hover:to-cyan-600 transition-all text-sm shadow-sm"
              >
                <Plus size={16} />
                <span className="hidden sm:inline">New</span>
              </button>
            )}
            {user?.role !== 'doctor' && (
              <button
                onClick={onClose}
                className="lg:hidden p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {documents.length === 0 ? (
            <div className="p-6 text-center text-gray-400">
              <FileText size={40} className="mx-auto mb-3 text-gray-300" />
              <p className="text-sm">No patients found</p>
            </div>
          ) : (
            <div className="p-3 space-y-2">
              {documents.map((doc) => (
                <button
                  key={doc.id}
                  onClick={() => handleSelectDocument(doc.id)}
                  className={`w-full text-left p-3 sm:p-2.5 rounded-xl transition-all ${
                    selectedDocument === doc.id
                      ? 'bg-teal-50 border border-teal-200 shadow-sm'
                      : 'bg-white hover:bg-gray-50 border border-gray-100 hover:border-gray-200'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${selectedDocument === doc.id ? 'bg-teal-100' : 'bg-gray-100'}`}>
                      <FileText size={16} className={selectedDocument === doc.id ? 'text-teal-600' : 'text-gray-400'} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className={`text-base sm:text-sm font-medium truncate ${selectedDocument === doc.id ? 'text-teal-900' : 'text-gray-800'}`}>
                        {doc.patientName}
                      </h3>
                      <div className="flex items-center gap-3 text-xs sm:text-[10px] text-gray-500 mt-1 sm:mt-0.5">
                        {doc.nickname && (
                          <span className="truncate">"{doc.nickname}"</span>
                        )}
                        <span className="flex items-center gap-1">
                          <Calendar size={12} />
                          {doc.birthday}
                        </span>
                        <span className={`px-1.5 py-0.5 rounded text-xs sm:text-[9px] font-medium ${
                          doc.gender === 'M' ? 'bg-blue-100 text-blue-600' : 'bg-pink-100 text-pink-600'
                        }`}>
                          {doc.gender}
                        </span>
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}