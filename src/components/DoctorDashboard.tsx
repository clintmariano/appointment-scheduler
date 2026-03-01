import React, { useState } from 'react';
import { PatientDocument, formatAOG, calculateAOG } from '../types';
import { formatDate } from '../utils/documentUtils';
import {
  Calendar,
  Grid3X3,
  List,
  Baby
} from 'lucide-react';

interface DoctorDashboardProps {
  patients: PatientDocument[];
  onSelectPatient: (id: string) => void;
  onViewAllAppointments: () => void;
  onViewCalendar: () => void;
}

export function DoctorDashboard({
  patients,
  onSelectPatient,
  onViewAllAppointments,
  onViewCalendar
}: DoctorDashboardProps) {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Calculate today's appointments (patients with follow-ups today)
  const getTodaysAppointments = () => {
    const appointments: {
      time: string;
      patient: PatientDocument;
      activity: string;
      status: 'attending' | 'pending';
    }[] = [];

    patients.forEach((patient) => {
      if (patient.followUpDates && Array.isArray(patient.followUpDates)) {
        patient.followUpDates.forEach((followUp) => {
          if (followUp.date) {
            const followUpDate = new Date(followUp.date);
            followUpDate.setHours(0, 0, 0, 0);
            if (followUpDate.getTime() === today.getTime() && !followUp.completed) {
              appointments.push({
                time: formatTime(followUpDate),
                patient,
                activity: followUp.notes || 'Check-up',
                status: followUp.confirmed ? 'attending' : 'pending'
              });
            }
          }
        });
      }
    });

    return appointments;
  };

  // Get today's patients
  const getTodaysPatients = () => {
    const todayPatients: { patient: PatientDocument; status: 'attending' | 'pending' }[] = [];
    const seenIds = new Set<string>();

    patients.forEach((patient) => {
      if (patient.followUpDates && Array.isArray(patient.followUpDates)) {
        patient.followUpDates.forEach((followUp) => {
          if (followUp.date && !seenIds.has(patient.id)) {
            const followUpDate = new Date(followUp.date);
            followUpDate.setHours(0, 0, 0, 0);
            if (followUpDate.getTime() === today.getTime() && !followUp.completed) {
              seenIds.add(patient.id);
              todayPatients.push({
                patient,
                status: followUp.confirmed ? 'attending' : 'pending'
              });
            }
          }
        });
      }
    });

    // If no appointments today, show some recent patients
    if (todayPatients.length === 0) {
      patients.slice(0, 15).forEach((patient) => {
        // Check if patient has any confirmed follow-up
        const hasConfirmedFollowUp = patient.followUpDates?.some(f => f.confirmed) || false;
        todayPatients.push({
          patient,
          status: hasConfirmedFollowUp ? 'attending' : 'pending'
        });
      });
    }

    return todayPatients;
  };

  const formatTime = (date: Date) => {
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const formattedHours = hours % 12 || 12;
    const formattedMinutes = minutes.toString().padStart(2, '0');
    return `${formattedHours.toString().padStart(2, '0')}:${formattedMinutes} ${ampm}`;
  };

  const calculateAge = (birthday: string) => {
    if (!birthday) return '';
    const birthDate = new Date(birthday);
    const ageDiff = today.getTime() - birthDate.getTime();
    const ageDate = new Date(ageDiff);
    const years = Math.abs(ageDate.getUTCFullYear() - 1970);
    if (years < 1) {
      const months = Math.floor(ageDiff / (1000 * 60 * 60 * 24 * 30));
      return `${months} mo`;
    }
    return `${years} yo`;
  };

  // Get AOG display for OB patients
  const getAOGDisplay = (patient: PatientDocument) => {
    if (patient.lmp) {
      const aog = calculateAOG(patient.lmp);
      return formatAOG(aog);
    }
    return null;
  };

  const todaysAppointments = getTodaysAppointments();
  const todaysPatients = getTodaysPatients();

  // Generate today's appointments for display
  const upcomingAppointments = (() => {
    const appointments: {
      date: string;
      time: string;
      patient: PatientDocument;
      activity: string;
      status: 'attending' | 'pending';
    }[] = [];

    patients.forEach((patient) => {
      if (patient.followUpDates && Array.isArray(patient.followUpDates)) {
        patient.followUpDates.forEach((followUp) => {
          if (followUp.date && !followUp.completed) {
            const followUpDate = new Date(followUp.date);
            followUpDate.setHours(0, 0, 0, 0);
            // Only show appointments for today
            if (followUpDate.getTime() === today.getTime()) {
              appointments.push({
                date: followUp.date,
                time: '9:00 AM',
                patient,
                activity: followUp.notes || 'Check-up',
                status: followUp.confirmed ? 'attending' : 'pending'
              });
            }
          }
        });
      }
    });

    return appointments.slice(0, 8);
  })();

  return (
    <div className="flex-1 overflow-auto bg-slate-50 p-4 lg:p-6">
      {/* Page Header */}
      <div className="mb-4 lg:mb-6">
        <h1 className="text-xl lg:text-2xl font-bold text-gray-800">Dashboard</h1>
        <p className="text-gray-500 text-sm">Welcome back! Here's what happening today.</p>
      </div>

      <div className="flex flex-col xl:flex-row gap-4 lg:gap-6">
        {/* Left Column - Stats & Appointments */}
        <div className="w-full xl:w-96 flex-shrink-0 space-y-4 lg:space-y-6">
          {/* Stats Card */}
          <div className="bg-white rounded-2xl border border-gray-200 p-4 lg:p-5">
            <div className="flex items-start justify-between mb-2">
              <span className="text-xs lg:text-sm text-gray-500">Today's Appointments</span>
              <div className="p-1.5 lg:p-2 bg-teal-50 rounded-lg">
                <Calendar size={14} className="lg:w-4 lg:h-4 text-teal-600" />
              </div>
            </div>
            <p className="text-2xl lg:text-4xl font-bold text-gray-800">{todaysAppointments.length || patients.length}</p>
            <p className="text-[10px] lg:text-xs text-teal-600 mt-1">
              {upcomingAppointments.length} upcoming this week
            </p>
          </div>

          {/* Upcoming Appointments */}
          <div className="bg-white rounded-2xl border border-gray-200 p-4 lg:p-5">
            <h3 className="text-sm lg:text-base font-semibold text-gray-800 mb-3 lg:mb-4">Upcoming Appointments</h3>

            {/* Appointments Table */}
            {upcomingAppointments.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-100">
                      <th className="text-left text-xs text-gray-400 font-medium pb-2 pr-4">Date</th>
                      <th className="text-left text-xs text-gray-400 font-medium pb-2 pr-4">Time</th>
                      <th className="text-left text-xs text-gray-400 font-medium pb-2">Patient</th>
                    </tr>
                  </thead>
                  <tbody>
                    {upcomingAppointments.map((apt, index) => (
                      <tr key={index} className="border-b border-gray-50 last:border-b-0">
                        <td className="py-2 pr-4 text-sm text-gray-600">{formatDate(apt.date)}</td>
                        <td className="py-2 pr-4 text-sm text-gray-600">{apt.time}</td>
                        <td className="py-2 text-sm text-gray-800">{apt.patient.patientName}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="py-6 lg:py-8 text-center text-gray-400">
                <Calendar size={28} className="lg:w-8 lg:h-8 mx-auto mb-2 text-gray-300" />
                <p className="text-xs lg:text-sm">No upcoming appointments</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Column - Today's Patients */}
        <div className="flex-1 min-w-0">
          <div className="bg-white rounded-2xl border border-gray-200 p-4 lg:p-5 h-full">
            <div className="flex items-center justify-between mb-4 lg:mb-5">
              <h3 className="text-sm lg:text-base font-semibold text-gray-800">Today's Patients</h3>
              <div className="flex items-center gap-2 lg:gap-3">
                <span className="text-xs lg:text-sm text-gray-500">{todaysPatients.length} Patients</span>
                <div className="hidden sm:flex border border-gray-200 rounded-lg overflow-hidden">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-1.5 lg:p-2 transition-colors ${
                      viewMode === 'grid'
                        ? 'bg-teal-50 text-teal-600'
                        : 'hover:bg-gray-50 text-gray-400'
                    }`}
                  >
                    <Grid3X3 size={14} className="lg:w-4 lg:h-4" />
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`p-1.5 lg:p-2 transition-colors ${
                      viewMode === 'list'
                        ? 'bg-teal-50 text-teal-600'
                        : 'hover:bg-gray-50 text-gray-400'
                    }`}
                  >
                    <List size={14} className="lg:w-4 lg:h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Patient Cards - Grid View */}
            {viewMode === 'grid' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 lg:gap-4">
                {todaysPatients.map(({ patient, status }) => (
                  <button
                    key={patient.id}
                    onClick={() => onSelectPatient(patient.id)}
                    className="bg-white border border-gray-100 rounded-2xl p-3 lg:p-4 hover:border-teal-200 hover:shadow-md transition-all text-left"
                  >
                    <div className="flex items-start justify-between mb-2 lg:mb-3">
                      <div className="w-10 h-10 lg:w-12 lg:h-12 bg-gray-100 rounded-full flex items-center justify-center">
                        <span className="text-base lg:text-lg font-medium text-gray-500">
                          {patient.patientName.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <span
                        className={`inline-flex items-center px-2 lg:px-2.5 py-0.5 lg:py-1 rounded-full text-[10px] lg:text-xs font-medium ${
                          status === 'attending'
                            ? 'bg-teal-50 text-teal-700 border border-teal-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}
                      >
                        {status === 'attending' ? 'Attending' : 'Pending'}
                      </span>
                    </div>
                    <h4 className="font-medium text-gray-800 truncate mb-1.5 lg:mb-2 text-sm lg:text-base">{patient.patientName}</h4>
                    <div className="flex flex-wrap gap-1.5 lg:gap-2 text-[10px] lg:text-xs text-gray-500">
                      {getAOGDisplay(patient) ? (
                        <span className="bg-teal-50 text-teal-700 px-1.5 lg:px-2 py-0.5 lg:py-1 rounded flex items-center gap-1">
                          <Baby size={10} className="lg:w-3 lg:h-3" />
                          AOG: {getAOGDisplay(patient)}
                        </span>
                      ) : (
                        <span className="bg-gray-50 px-1.5 lg:px-2 py-0.5 lg:py-1 rounded">{calculateAge(patient.birthday)}</span>
                      )}
                      <span className="bg-gray-50 px-1.5 lg:px-2 py-0.5 lg:py-1 rounded">{patient.gender === 'M' ? 'Male' : 'Female'}</span>
                      {patient.gravida && patient.para !== undefined && (
                        <span className="bg-purple-50 text-purple-700 px-1.5 lg:px-2 py-0.5 lg:py-1 rounded hidden lg:inline">
                          G{patient.gravida}P{patient.para}
                        </span>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/* Patient Cards - List View */}
            {viewMode === 'list' && (
              <div className="space-y-2">
                {/* List Header */}
                <div className="hidden lg:grid grid-cols-12 gap-4 px-4 py-2 text-xs text-gray-400 font-medium border-b border-gray-100">
                  <span className="col-span-4">Patient</span>
                  <span className="col-span-2">AOG / Age</span>
                  <span className="col-span-2">G/P</span>
                  <span className="col-span-2">LMP / Birthday</span>
                  <span className="col-span-2">Status</span>
                </div>
                {todaysPatients.map(({ patient, status }) => (
                  <button
                    key={patient.id}
                    onClick={() => onSelectPatient(patient.id)}
                    className="w-full bg-white border border-gray-100 rounded-xl p-3 lg:p-4 hover:border-teal-200 hover:shadow-md transition-all text-left"
                  >
                    <div className="lg:grid lg:grid-cols-12 lg:gap-4 lg:items-center">
                      {/* Patient Info */}
                      <div className="col-span-4 flex items-center gap-3 mb-2 lg:mb-0">
                        <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
                          <span className="text-base font-medium text-gray-500">
                            {patient.patientName.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div className="min-w-0">
                          <h4 className="font-medium text-gray-800 truncate text-sm lg:text-base">{patient.patientName}</h4>
                          {patient.nickname && (
                            <p className="text-xs text-gray-400 truncate">"{patient.nickname}"</p>
                          )}
                        </div>
                      </div>

                      {/* AOG / Age */}
                      <div className="col-span-2 hidden lg:block">
                        {getAOGDisplay(patient) ? (
                          <span className="text-sm text-teal-600 font-medium">{getAOGDisplay(patient)}</span>
                        ) : (
                          <span className="text-sm text-gray-600">{calculateAge(patient.birthday)}</span>
                        )}
                      </div>

                      {/* G/P */}
                      <div className="col-span-2 hidden lg:block">
                        {patient.gravida && patient.para !== undefined ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-50 text-purple-600">
                            G{patient.gravida}P{patient.para}
                          </span>
                        ) : (
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                            patient.gender === 'M' ? 'bg-blue-50 text-blue-600' : 'bg-pink-50 text-pink-600'
                          }`}>
                            {patient.gender === 'M' ? 'Male' : 'Female'}
                          </span>
                        )}
                      </div>

                      {/* LMP / Birthday */}
                      <div className="col-span-2 hidden lg:block">
                        <span className="text-sm text-gray-600">{patient.lmp || patient.birthday}</span>
                      </div>

                      {/* Status */}
                      <div className="col-span-2 flex justify-between items-center lg:justify-start">
                        <div className="flex items-center gap-2 lg:hidden text-xs text-gray-500">
                          {getAOGDisplay(patient) ? (
                            <span className="text-teal-600">AOG: {getAOGDisplay(patient)}</span>
                          ) : (
                            <>
                              <span>{calculateAge(patient.birthday)}</span>
                              <span>•</span>
                              <span>{patient.gender === 'M' ? 'Male' : 'Female'}</span>
                            </>
                          )}
                        </div>
                        <span
                          className={`inline-flex items-center px-2 lg:px-2.5 py-0.5 lg:py-1 rounded-full text-[10px] lg:text-xs font-medium ${
                            status === 'attending'
                              ? 'bg-teal-50 text-teal-700 border border-teal-200'
                              : 'bg-amber-50 text-amber-700 border border-amber-200'
                          }`}
                        >
                          {status === 'attending' ? 'Attending' : 'Pending'}
                        </span>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {todaysPatients.length === 0 && (
              <div className="py-8 lg:py-12 text-center text-gray-400">
                <Calendar size={40} className="lg:w-12 lg:h-12 mx-auto mb-3 text-gray-300" />
                <p className="text-sm lg:text-base">No patients scheduled for today</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
