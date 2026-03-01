import React from 'react';
import { PatientDocument } from '../types';
import {
  Users,
  Calendar,
  TrendingUp,
  PieChart,
  BarChart3
} from 'lucide-react';

interface AnalyticsViewProps {
  patients: PatientDocument[];
}

export function AnalyticsView({ patients }: AnalyticsViewProps) {
  const today = new Date();

  // Calculate statistics
  const maleCount = patients.filter(p => p.gender === 'M').length;
  const femaleCount = patients.filter(p => p.gender === 'F').length;

  const totalFollowUps = patients.reduce((count, patient) => {
    return count + (patient.followUpDates?.length || 0);
  }, 0);

  const completedFollowUps = patients.reduce((count, patient) => {
    return count + (patient.followUpDates?.filter(f => f.completed).length || 0);
  }, 0);

  // Get patients by age group
  const getAgeGroups = () => {
    const groups = {
      'Infants (0-1)': 0,
      'Toddlers (1-3)': 0,
      'Preschool (3-5)': 0,
      'School Age (5-12)': 0,
      'Teens (12+)': 0
    };

    patients.forEach(patient => {
      if (!patient.birthday) return;
      const birthDate = new Date(patient.birthday);
      const age = (today.getTime() - birthDate.getTime()) / (1000 * 60 * 60 * 24 * 365);

      if (age < 1) groups['Infants (0-1)']++;
      else if (age < 3) groups['Toddlers (1-3)']++;
      else if (age < 5) groups['Preschool (3-5)']++;
      else if (age < 12) groups['School Age (5-12)']++;
      else groups['Teens (12+)']++;
    });

    return groups;
  };

  const ageGroups = getAgeGroups();

  // Recent patients (created in last 30 days)
  const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
  const recentPatients = patients.filter(p => {
    const createdAt = new Date(p.createdAt);
    return createdAt >= thirtyDaysAgo;
  }).length;

  return (
    <div className="flex-1 overflow-auto bg-slate-50 p-6">
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Analytics</h1>
        <p className="text-gray-500 text-sm">Overview of clinic statistics and patient data</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-2xl border border-gray-200 p-5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-teal-100 rounded-xl flex items-center justify-center">
              <Users className="w-6 h-6 text-teal-600" />
            </div>
            <div>
              <p className="text-3xl font-bold text-gray-800">{patients.length}</p>
              <p className="text-sm text-gray-500">Total Patients</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-emerald-600" />
            </div>
            <div>
              <p className="text-3xl font-bold text-gray-800">{recentPatients}</p>
              <p className="text-sm text-gray-500">New This Month</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-cyan-100 rounded-xl flex items-center justify-center">
              <Calendar className="w-6 h-6 text-cyan-600" />
            </div>
            <div>
              <p className="text-3xl font-bold text-gray-800">{totalFollowUps}</p>
              <p className="text-sm text-gray-500">Total Follow-ups</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
              <PieChart className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-3xl font-bold text-gray-800">
                {totalFollowUps > 0 ? Math.round((completedFollowUps / totalFollowUps) * 100) : 0}%
              </p>
              <p className="text-sm text-gray-500">Completion Rate</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* Gender Distribution */}
        <div className="bg-white rounded-2xl border border-gray-200 p-5">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <PieChart size={20} className="text-teal-500" />
            Gender Distribution
          </h3>
          <div className="flex items-center justify-center gap-8 py-4">
            <div className="text-center">
              <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center mb-3">
                <span className="text-3xl font-bold text-blue-600">{maleCount}</span>
              </div>
              <p className="text-sm font-medium text-gray-600">Male</p>
              <p className="text-xs text-gray-400">
                {patients.length > 0 ? Math.round((maleCount / patients.length) * 100) : 0}%
              </p>
            </div>
            <div className="text-center">
              <div className="w-24 h-24 bg-pink-100 rounded-full flex items-center justify-center mb-3">
                <span className="text-3xl font-bold text-pink-600">{femaleCount}</span>
              </div>
              <p className="text-sm font-medium text-gray-600">Female</p>
              <p className="text-xs text-gray-400">
                {patients.length > 0 ? Math.round((femaleCount / patients.length) * 100) : 0}%
              </p>
            </div>
          </div>
        </div>

        {/* Age Distribution */}
        <div className="bg-white rounded-2xl border border-gray-200 p-5">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <BarChart3 size={20} className="text-teal-500" />
            Age Distribution
          </h3>
          <div className="space-y-3">
            {Object.entries(ageGroups).map(([group, count]) => (
              <div key={group} className="flex items-center gap-3">
                <span className="text-sm text-gray-600 w-32">{group}</span>
                <div className="flex-1 h-6 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-teal-500 to-cyan-500 rounded-full transition-all"
                    style={{
                      width: `${patients.length > 0 ? (count / patients.length) * 100 : 0}%`
                    }}
                  />
                </div>
                <span className="text-sm font-medium text-gray-800 w-8 text-right">{count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Immunization Coverage */}
        <div className="bg-white rounded-2xl border border-gray-200 p-5 col-span-2">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <TrendingUp size={20} className="text-teal-500" />
            Quick Stats
          </h3>
          <div className="grid grid-cols-4 gap-6">
            <div className="text-center p-4 bg-slate-50 rounded-xl">
              <p className="text-3xl font-bold text-teal-600 mb-1">
                {patients.filter(p => p.immunizations?.some(i => i.first)).length}
              </p>
              <p className="text-sm text-gray-500">Vaccinated Patients</p>
            </div>
            <div className="text-center p-4 bg-slate-50 rounded-xl">
              <p className="text-3xl font-bold text-cyan-600 mb-1">
                {patients.filter(p => p.smsConsent).length}
              </p>
              <p className="text-sm text-gray-500">SMS Reminders Active</p>
            </div>
            <div className="text-center p-4 bg-slate-50 rounded-xl">
              <p className="text-3xl font-bold text-emerald-600 mb-1">
                {patients.filter(p => p.newbornScreening).length}
              </p>
              <p className="text-sm text-gray-500">Newborn Screenings</p>
            </div>
            <div className="text-center p-4 bg-slate-50 rounded-xl">
              <p className="text-3xl font-bold text-amber-600 mb-1">
                {patients.filter(p => p.followUpDates?.some(f => !f.completed)).length}
              </p>
              <p className="text-sm text-gray-500">Pending Follow-ups</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
