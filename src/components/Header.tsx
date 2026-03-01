import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { LogOut, User, Stethoscope, Search, X, FileText, Calendar } from 'lucide-react';
import { SyncStatus } from './SyncStatus';
import { PatientDocument } from '../types';

interface HeaderProps {
  documents?: PatientDocument[];
  searchTerm?: string;
  onSearchChange?: (term: string) => void;
  onSelectDocument?: (id: string) => void;
}

export function Header({ documents = [], searchTerm = '', onSearchChange, onSelectDocument }: HeaderProps) {
  const { user, logout } = useAuth();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Filter documents based on search term
  const filteredDocuments = documents.filter(doc =>
    doc.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    doc.nickname.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Close search when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsSearchOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Focus input when search opens
  useEffect(() => {
    if (isSearchOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isSearchOpen]);

  const handleSelectPatient = (id: string) => {
    onSelectDocument?.(id);
    setIsSearchOpen(false);
    onSearchChange?.('');
  };

  const getRoleDisplayName = (role: string) => {
    switch (role) {
      case 'doctor':
        return 'Physician';
      case 'assistant1':
        return 'Staff 1';
      case 'assistant2':
        return 'Staff 2';
      default:
        return role;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'doctor':
        return 'bg-white/20 text-white';
      case 'assistant1':
        return 'bg-emerald-400/20 text-emerald-100';
      case 'assistant2':
        return 'bg-cyan-400/20 text-cyan-100';
      default:
        return 'bg-white/20 text-white';
    }
  };

  return (
    <div className="bg-gradient-to-r from-teal-600 to-cyan-600 px-3 py-2 shadow-md">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="bg-white/20 p-1.5 rounded-lg">
            <Stethoscope size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white leading-tight">MyOB</h1>
            <p className="text-[10px] text-teal-100 leading-tight">Appointment Scheduler</p>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          {/* Search Button - only for doctor role */}
          {user?.role === 'doctor' && documents.length > 0 && (
            <div className="relative" ref={searchRef}>
              <button
                onClick={() => setIsSearchOpen(!isSearchOpen)}
                className="p-1.5 text-teal-100 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                title="Search patients"
              >
                <Search size={18} />
              </button>

              {/* Search Dropdown */}
              {isSearchOpen && (
                <div className="absolute right-0 top-full mt-2 w-72 sm:w-80 bg-white rounded-lg shadow-xl border border-gray-200 z-50">
                  <div className="p-2 border-b border-gray-100">
                    <div className="relative">
                      <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 text-gray-400" size={14} />
                      <input
                        ref={inputRef}
                        type="text"
                        placeholder="Search patients..."
                        value={searchTerm}
                        onChange={(e) => onSearchChange?.(e.target.value)}
                        className="w-full pl-8 pr-8 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                      />
                      {searchTerm && (
                        <button
                          onClick={() => onSearchChange?.('')}
                          className="absolute right-2.5 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                          <X size={14} />
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="max-h-64 overflow-y-auto">
                    {filteredDocuments.length === 0 ? (
                      <div className="p-4 text-center text-gray-400">
                        <FileText size={24} className="mx-auto mb-2 text-gray-300" />
                        <p className="text-xs">No patients found</p>
                      </div>
                    ) : (
                      <div className="p-1">
                        {filteredDocuments.slice(0, 10).map((doc) => (
                          <button
                            key={doc.id}
                            onClick={() => handleSelectPatient(doc.id)}
                            className="w-full text-left p-2 rounded-lg hover:bg-teal-50 transition-colors"
                          >
                            <div className="flex items-center gap-2">
                              <div className="p-1 bg-gray-100 rounded">
                                <FileText size={12} className="text-gray-500" />
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="text-sm font-medium text-gray-800 truncate">{doc.patientName}</p>
                                <div className="flex items-center gap-2 text-[10px] text-gray-500">
                                  {doc.nickname && <span>"{doc.nickname}"</span>}
                                  <span className="flex items-center gap-0.5">
                                    <Calendar size={9} />
                                    {doc.birthday}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </button>
                        ))}
                        {filteredDocuments.length > 10 && (
                          <p className="text-[10px] text-gray-400 text-center py-2">
                            +{filteredDocuments.length - 10} more results
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Sync Status - only for doctor role */}
          {user?.role === 'doctor' && <SyncStatus />}

          <div className="hidden sm:flex items-center gap-2">
            <div className="flex items-center gap-1.5">
              <User size={14} className="text-teal-200" />
              <span className="text-xs font-medium text-white">{user?.username}</span>
            </div>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${getRoleColor(user?.role || '')}`}>
              {getRoleDisplayName(user?.role || '')}
            </span>
          </div>

          <button
            onClick={logout}
            className="flex items-center gap-1 text-teal-100 hover:text-white hover:bg-white/10 px-2 py-1.5 rounded-lg transition-colors text-xs"
          >
            <LogOut size={14} />
            <span className="hidden sm:inline">Sign Out</span>
          </button>
        </div>
      </div>
    </div>
  );
}
