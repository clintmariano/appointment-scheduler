import React from 'react';
import { PatientDocument } from '../types';
import { DocumentForm } from './DocumentForm';
import { formatDate } from '../utils/documentUtils';
import {
  FileText,
  Plus,
  Search,
  Calendar,
  User,
  ArrowLeft,
  X
} from 'lucide-react';

interface PatientsViewProps {
  patients: PatientDocument[];
  selectedPatient: PatientDocument | null;
  onSelectPatient: (id: string) => void;
  onCreateNew: () => void;
  onSave: () => void;
  onChange: (doc: PatientDocument) => void;
  isNew: boolean;
}

export function PatientsView({
  patients,
  selectedPatient,
  onSelectPatient,
  onCreateNew,
  onSave,
  onChange,
  isNew
}: PatientsViewProps) {
  const [searchTerm, setSearchTerm] = React.useState('');
  const [showDetailsOnMobile, setShowDetailsOnMobile] = React.useState(false);

  const filteredPatients = patients.filter(patient =>
    patient.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (patient.nickname && patient.nickname.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const calculateAge = (birthday: string) => {
    if (!birthday) return '';
    const today = new Date();
    const birthDate = new Date(birthday);
    const ageDiff = today.getTime() - birthDate.getTime();
    const ageDate = new Date(ageDiff);
    const years = Math.abs(ageDate.getUTCFullYear() - 1970);
    if (years < 1) {
      const months = Math.floor(ageDiff / (1000 * 60 * 60 * 24 * 30));
      return `${months} months`;
    }
    return `${years} years old`;
  };

  // Handle patient selection
  const handleSelectPatient = (id: string) => {
    onSelectPatient(id);
    setShowDetailsOnMobile(true);
  };

  // Handle back to list on mobile
  const handleBackToList = () => {
    setShowDetailsOnMobile(false);
  };

  return (
    <div className="flex-1 flex overflow-hidden bg-slate-50 relative">
      {/* Patient List Sidebar */}
      <div className={`bg-white border-r border-gray-200 flex flex-col transition-transform duration-300 ease-in-out absolute inset-0 z-10 lg:static lg:z-0 ${
        showDetailsOnMobile ? '-translate-x-full' : 'translate-x-0'
      } lg:translate-x-0 w-full lg:w-80`}>
        {/* Header */}
        <div className="p-4 border-b border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-800">Patients</h2>
            <button
              onClick={onCreateNew}
              className="flex items-center gap-1.5 bg-gradient-to-r from-teal-500 to-cyan-500 text-white px-3 py-2 rounded-xl hover:from-teal-600 hover:to-cyan-600 transition-all text-sm font-medium shadow-sm"
            >
              <Plus size={16} />
              New
            </button>
          </div>
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
            <input
              type="text"
              placeholder="Search patients..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent bg-gray-50"
            />
          </div>
        </div>

        {/* Patient List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {filteredPatients.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <User size={40} className="mx-auto mb-3 text-gray-300" />
              <p className="text-sm">No patients found</p>
            </div>
          ) : (
            filteredPatients.map((patient) => (
              <button
                key={patient.id}
                onClick={() => handleSelectPatient(patient.id)}
                className={`w-full text-left p-3 rounded-xl transition-all ${
                  selectedPatient?.id === patient.id
                    ? 'bg-teal-50 border border-teal-200 shadow-sm'
                    : 'bg-gray-50 hover:bg-gray-100 border border-transparent'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      selectedPatient?.id === patient.id
                        ? 'bg-teal-100 text-teal-700'
                        : 'bg-gray-200 text-gray-600'
                    }`}
                  >
                    <span className="font-medium">
                      {patient.patientName.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3
                      className={`font-medium truncate ${
                        selectedPatient?.id === patient.id
                          ? 'text-teal-900'
                          : 'text-gray-800'
                      }`}
                    >
                      {patient.patientName}
                    </h3>
                    <div className="flex items-center gap-2 text-xs text-gray-500 mt-0.5">
                      <span className="flex items-center gap-1">
                        <Calendar size={10} />
                        {formatDate(patient.birthday)}
                      </span>
                      <span
                        className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
                          patient.gender === 'M'
                            ? 'bg-blue-100 text-blue-600'
                            : 'bg-pink-100 text-pink-600'
                        }`}
                      >
                        {patient.gender}
                      </span>
                    </div>
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Patient Form / Details */}
      <div className={`flex-1 overflow-y-auto transition-transform duration-300 ease-in-out absolute inset-0 z-20 lg:static lg:z-0 bg-white lg:bg-transparent ${
        showDetailsOnMobile ? 'translate-x-0' : 'translate-x-full'
      } lg:translate-x-0`}>
        {/* Mobile back button - only visible on mobile when showing details */}
        <div className="lg:hidden sticky top-0 z-30 bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-3">
          <button
            onClick={handleBackToList}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft size={20} />
            <span className="font-medium">Back to Patients</span>
          </button>
          <div className="flex-1" />
          <button
            onClick={handleBackToList}
            className="p-1 text-gray-400 hover:text-gray-600"
          >
            <X size={20} />
          </button>
        </div>

        {selectedPatient ? (
          <DocumentForm
            document={selectedPatient}
            onChange={onChange}
            onSave={onSave}
            isNew={isNew}
            onMenuClick={() => {}}
          />
        ) : (
          <div className="h-full flex items-center justify-center p-6">
            <div className="text-center max-w-md">
              <div className="mx-auto w-20 h-20 bg-gray-100 rounded-2xl flex items-center justify-center mb-5">
                <FileText size={40} className="text-gray-400" />
              </div>
              <h2 className="text-xl font-semibold text-gray-600 mb-3">
                Select a Patient
              </h2>
              <p className="text-gray-500 mb-6">
                Choose a patient from the list or create a new record.
              </p>
              <button
                onClick={onCreateNew}
                className="bg-gradient-to-r from-teal-500 to-cyan-500 text-white px-6 py-3 rounded-xl hover:from-teal-600 hover:to-cyan-600 transition-all font-medium shadow-md"
              >
                Create New Record
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
