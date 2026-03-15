import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import {
  ListOrdered,
  Calendar,
  Users,
  LogOut,
  Stethoscope,
  X
} from 'lucide-react';

export type AssistantViewType = 'queue' | 'patients' | 'appointments';

interface AssistantSidebarProps {
  currentView: AssistantViewType;
  onViewChange: (view: AssistantViewType) => void;
  isOpen?: boolean;
  onClose?: () => void;
}

export function AssistantSidebar({ currentView, onViewChange, isOpen = true, onClose }: AssistantSidebarProps) {
  const { logout } = useAuth();

  const navItems: { id: AssistantViewType; label: string; icon: React.ReactNode }[] = [
    { id: 'queue', label: 'Queue', icon: <ListOrdered size={20} /> },
    { id: 'patients', label: 'Patients', icon: <Users size={20} /> },
    { id: 'appointments', label: 'Appointments', icon: <Calendar size={20} /> },
  ];

  const handleNavClick = (view: AssistantViewType) => {
    onViewChange(view);
    if (onClose && window.innerWidth < 1024) {
      onClose();
    }
  };

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div
        className={`
          fixed lg:relative inset-y-0 left-0 z-50 lg:z-0
          w-56 bg-white border-r border-gray-200 flex flex-col h-full
          transform transition-transform duration-300 ease-in-out lg:transform-none
          ${isOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0
        `}
      >
        {/* Logo */}
        <div className="p-5 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="bg-gradient-to-br from-teal-500 to-cyan-500 p-2 rounded-xl">
                <Stethoscope size={24} className="text-white" />
              </div>
              <div>
                <span className="text-xl font-bold bg-gradient-to-r from-teal-600 to-cyan-600 bg-clip-text text-transparent">
                  MyOB
                </span>
                <p className="text-xs text-gray-500">Assistant</p>
              </div>
            </div>
            {onClose && (
              <button
                onClick={onClose}
                className="lg:hidden p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg"
              >
                <X size={20} />
              </button>
            )}
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-3 space-y-1">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => handleNavClick(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                currentView === item.id
                  ? 'bg-teal-50 text-teal-700 border border-teal-200'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <span className={currentView === item.id ? 'text-teal-600' : 'text-gray-400'}>
                {item.icon}
              </span>
              {item.label}
            </button>
          ))}
        </nav>

        {/* Logout */}
        <div className="p-3 border-t border-gray-100">
          <button
            onClick={logout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-gray-600 hover:bg-red-50 hover:text-red-600 transition-all"
          >
            <span className="text-gray-400">
              <LogOut size={20} />
            </span>
            Logout
          </button>
        </div>
      </div>
    </>
  );
}
