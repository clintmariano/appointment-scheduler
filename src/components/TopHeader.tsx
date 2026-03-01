import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import {
  Search,
  Calendar,
  UserPlus,
  X,
  FileText,
  Menu
} from 'lucide-react';
import { PatientDocument } from '../types';

interface TopHeaderProps {
  documents?: PatientDocument[];
  searchTerm?: string;
  onSearchChange?: (term: string) => void;
  onSelectDocument?: (id: string) => void;
  onAddPatient?: () => void;
  onScheduleAppointment?: () => void;
  onMenuClick?: () => void;
}

export function TopHeader({
  documents = [],
  searchTerm = '',
  onSearchChange,
  onSelectDocument,
  onAddPatient,
  onScheduleAppointment,
  onMenuClick
}: TopHeaderProps) {
  const { user } = useAuth();
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  // Filter documents based on search term
  const filteredDocuments = documents.filter(doc =>
    doc.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    doc.nickname.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Close search dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsSearchFocused(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectPatient = (id: string) => {
    onSelectDocument?.(id);
    setIsSearchFocused(false);
    onSearchChange?.('');
  };

  return (
    <div className="bg-white border-b border-gray-200 px-4 lg:px-6 py-3 lg:py-4">
      <div className="flex items-center justify-between gap-2 lg:gap-4">
        {/* Mobile Menu Button */}
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 text-gray-500 hover:bg-gray-100 rounded-xl transition-colors"
        >
          <Menu size={24} />
        </button>

        {/* Search Bar */}
        <div className="flex-1 max-w-lg relative" ref={searchRef}>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Search patients..."
              value={searchTerm}
              onChange={(e) => onSearchChange?.(e.target.value)}
              onFocus={() => setIsSearchFocused(true)}
              className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent bg-gray-50"
            />
            {searchTerm && (
              <button
                onClick={() => onSearchChange?.('')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X size={16} />
              </button>
            )}
          </div>

          {/* Search Results Dropdown */}
          {isSearchFocused && searchTerm && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-xl border border-gray-200 z-50 max-h-80 overflow-y-auto">
              {filteredDocuments.length === 0 ? (
                <div className="p-4 text-center text-gray-400">
                  <FileText size={24} className="mx-auto mb-2 text-gray-300" />
                  <p className="text-sm">No patients found</p>
                </div>
              ) : (
                <div className="p-2">
                  {filteredDocuments.slice(0, 8).map((doc) => (
                    <button
                      key={doc.id}
                      onClick={() => handleSelectPatient(doc.id)}
                      className="w-full text-left p-3 rounded-lg hover:bg-teal-50 transition-colors flex items-center gap-3"
                    >
                      <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                        <span className="text-sm font-medium text-gray-600">
                          {doc.patientName.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-800">{doc.patientName}</p>
                        <p className="text-xs text-gray-500">
                          {doc.birthday} • {doc.gender === 'M' ? 'Male' : 'Female'}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Action Buttons - Hidden on small screens */}
        <div className="hidden md:flex items-center gap-2 lg:gap-3">
          <button
            onClick={onScheduleAppointment}
            className="flex items-center gap-2 px-3 lg:px-4 py-2 lg:py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <Calendar size={16} />
            <span className="hidden lg:inline">Schedule Appointment</span>
          </button>
          <button
            onClick={onAddPatient}
            className="flex items-center gap-2 px-3 lg:px-4 py-2 lg:py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <UserPlus size={16} />
            <span className="hidden lg:inline">Add Patient</span>
          </button>
        </div>

        {/* Right Side - Profile */}
        <div className="flex items-center">
          <div className="w-9 h-9 lg:w-10 lg:h-10 bg-gradient-to-br from-teal-500 to-cyan-500 rounded-full flex items-center justify-center">
            <span className="text-white font-medium text-sm">
              {user?.username?.charAt(0).toUpperCase() || 'D'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
