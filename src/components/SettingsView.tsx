import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { SyncStatus } from './SyncStatus';
import { PatientImport } from './PatientImport';
import {
  User,
  Bell,
  Shield,
  Database,
  Palette,
  Globe,
  HelpCircle,
  RefreshCw,
  Upload
} from 'lucide-react';

export function SettingsView() {
  const { user } = useAuth();
  const [showImportModal, setShowImportModal] = useState(false);

  const handleImportSuccess = () => {
    // Refresh data or trigger any needed updates
    window.location.reload();
  };

  return (
    <div className="flex-1 overflow-auto bg-slate-50 p-6">
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Settings</h1>
        <p className="text-gray-500 text-sm">Manage your account and application preferences</p>
      </div>

      <div className="max-w-3xl space-y-6">
        {/* Profile Section */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-teal-100 rounded-xl flex items-center justify-center">
              <User className="w-5 h-5 text-teal-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-800">Profile</h3>
              <p className="text-sm text-gray-500">Your account information</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between py-3 border-b border-gray-100">
              <span className="text-gray-600">Username</span>
              <span className="text-gray-800 font-medium">{user?.username}</span>
            </div>
            <div className="flex items-center justify-between py-3 border-b border-gray-100">
              <span className="text-gray-600">Role</span>
              <span className="px-3 py-1 bg-teal-50 text-teal-700 rounded-full text-sm font-medium">
                {user?.role === 'doctor' ? 'Physician' : 'Staff'}
              </span>
            </div>
            <div className="flex items-center justify-between py-3">
              <span className="text-gray-600">Clinic</span>
              <span className="text-gray-800 font-medium">Well & Sick Children's Clinic</span>
            </div>
          </div>
        </div>

        {/* CSV Import */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
              <Upload className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-800">CSV Import</h3>
              <p className="text-sm text-gray-500">Bulk import patient records from CSV file</p>
            </div>
          </div>

          <div className="flex items-center justify-between py-3 border-b border-gray-100">
            <div>
              <span className="text-gray-800 font-medium">Import Patients</span>
              <p className="text-sm text-gray-500">Upload a CSV file to import multiple patients at once</p>
            </div>
            <button
              onClick={() => setShowImportModal(true)}
              className="px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-lg hover:from-green-600 hover:to-emerald-600 transition-all text-sm font-medium shadow-sm"
            >
              Import CSV
            </button>
          </div>

          <div className="pt-4">
            <p className="text-xs text-gray-500">
              Download the CSV template from the import modal to see the required format.
              Required fields: patientName, birthday, gender.
            </p>
          </div>
        </div>

        {/* Sync Status */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-cyan-100 rounded-xl flex items-center justify-center">
              <RefreshCw className="w-5 h-5 text-cyan-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-800">Data Sync</h3>
              <p className="text-sm text-gray-500">Synchronization status with server</p>
            </div>
          </div>

          <div className="flex items-center justify-between py-3 border-b border-gray-100">
            <span className="text-gray-600">Sync Status</span>
            <SyncStatus />
          </div>
          <div className="pt-4">
            <button className="w-full py-3 border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50 transition-colors font-medium">
              Force Sync Now
            </button>
          </div>
        </div>

        {/* Notifications */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
              <Bell className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-800">Notifications</h3>
              <p className="text-sm text-gray-500">Configure alerts and reminders</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between py-3 border-b border-gray-100">
              <div>
                <span className="text-gray-800 font-medium">Appointment Reminders</span>
                <p className="text-sm text-gray-500">Get notified about upcoming appointments</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" defaultChecked className="sr-only peer" />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-teal-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-teal-500"></div>
              </label>
            </div>
            <div className="flex items-center justify-between py-3 border-b border-gray-100">
              <div>
                <span className="text-gray-800 font-medium">Overdue Alerts</span>
                <p className="text-sm text-gray-500">Alert when follow-ups are overdue</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" defaultChecked className="sr-only peer" />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-teal-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-teal-500"></div>
              </label>
            </div>
            <div className="flex items-center justify-between py-3">
              <div>
                <span className="text-gray-800 font-medium">SMS Notifications</span>
                <p className="text-sm text-gray-500">Send SMS reminders to patients</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" defaultChecked className="sr-only peer" />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-teal-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-teal-500"></div>
              </label>
            </div>
          </div>
        </div>

        {/* Security */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center">
              <Shield className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-800">Security</h3>
              <p className="text-sm text-gray-500">Password and authentication settings</p>
            </div>
          </div>

          <button className="w-full py-3 border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50 transition-colors font-medium">
            Change Password
          </button>
        </div>

        {/* About */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
              <HelpCircle className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-800">About</h3>
              <p className="text-sm text-gray-500">Application information</p>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between py-2">
              <span className="text-gray-600">App Name</span>
              <span className="text-gray-800 font-medium">MyPedia</span>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-gray-600">Version</span>
              <span className="text-gray-800 font-medium">1.0.0</span>
            </div>
          </div>
        </div>
      </div>

      {/* Import Modal */}
      {showImportModal && (
        <PatientImport
          onClose={() => setShowImportModal(false)}
          onSuccess={handleImportSuccess}
        />
      )}
    </div>
  );
}
