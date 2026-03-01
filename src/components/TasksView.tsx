import React from 'react';
import { PatientDocument } from '../types';
import { formatDateObj } from '../utils/documentUtils';
import {
  ClipboardList,
  Clock,
  CheckCircle2,
  Circle,
  AlertTriangle
} from 'lucide-react';

interface TasksViewProps {
  patients: PatientDocument[];
}

export function TasksView({ patients }: TasksViewProps) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Generate tasks from patient follow-ups
  const getTasks = () => {
    const tasks: {
      id: string;
      title: string;
      patient: string;
      dueDate: Date;
      priority: 'high' | 'medium' | 'low';
      status: 'pending' | 'in-progress' | 'completed';
    }[] = [];

    patients.forEach((patient) => {
      if (patient.followUpDates && Array.isArray(patient.followUpDates)) {
        patient.followUpDates.forEach((followUp) => {
          if (followUp.date) {
            const dueDate = new Date(followUp.date);
            const isOverdue = dueDate < today && !followUp.completed;

            tasks.push({
              id: followUp.id,
              title: followUp.notes || `Follow-up appointment for ${patient.patientName}`,
              patient: patient.patientName,
              dueDate,
              priority: isOverdue ? 'high' : dueDate.getTime() - today.getTime() < 7 * 24 * 60 * 60 * 1000 ? 'medium' : 'low',
              status: followUp.completed ? 'completed' : 'pending'
            });
          }
        });
      }
    });

    return tasks.sort((a, b) => {
      if (a.status !== b.status) {
        return a.status === 'completed' ? 1 : -1;
      }
      return a.dueDate.getTime() - b.dueDate.getTime();
    });
  };

  const tasks = getTasks();
  const pendingTasks = tasks.filter(t => t.status !== 'completed');
  const completedTasks = tasks.filter(t => t.status === 'completed');
  const highPriorityTasks = pendingTasks.filter(t => t.priority === 'high');

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-700 border-red-200';
      case 'medium':
        return 'bg-amber-100 text-amber-700 border-amber-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  return (
    <div className="flex-1 overflow-auto bg-slate-50 p-6">
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Tasks</h1>
        <p className="text-gray-500 text-sm">Track and manage your clinical tasks</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-2xl border border-gray-200 p-5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-teal-100 rounded-xl flex items-center justify-center">
              <ClipboardList className="w-6 h-6 text-teal-600" />
            </div>
            <div>
              <p className="text-3xl font-bold text-gray-800">{tasks.length}</p>
              <p className="text-sm text-gray-500">Total Tasks</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center">
              <Clock className="w-6 h-6 text-amber-600" />
            </div>
            <div>
              <p className="text-3xl font-bold text-gray-800">{pendingTasks.length}</p>
              <p className="text-sm text-gray-500">Pending</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-red-500" />
            </div>
            <div>
              <p className="text-3xl font-bold text-gray-800">{highPriorityTasks.length}</p>
              <p className="text-sm text-gray-500">High Priority</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-3xl font-bold text-gray-800">{completedTasks.length}</p>
              <p className="text-sm text-gray-500">Completed</p>
            </div>
          </div>
        </div>
      </div>

      {/* Task List */}
      <div className="bg-white rounded-2xl border border-gray-200 p-5">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">All Tasks</h3>

        {tasks.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <ClipboardList size={48} className="mx-auto mb-3 text-gray-300" />
            <p>No tasks found</p>
          </div>
        ) : (
          <div className="space-y-3">
            {tasks.slice(0, 20).map((task) => (
              <div
                key={task.id}
                className={`flex items-center gap-4 p-4 rounded-xl border ${
                  task.status === 'completed'
                    ? 'bg-gray-50 border-gray-100'
                    : 'bg-white border-gray-200 hover:border-teal-200'
                } transition-colors`}
              >
                <button className="flex-shrink-0">
                  {task.status === 'completed' ? (
                    <CheckCircle2 className="w-6 h-6 text-green-500" />
                  ) : (
                    <Circle className="w-6 h-6 text-gray-300 hover:text-teal-500" />
                  )}
                </button>
                <div className="flex-1 min-w-0">
                  <p
                    className={`font-medium ${
                      task.status === 'completed'
                        ? 'text-gray-400 line-through'
                        : 'text-gray-800'
                    }`}
                  >
                    {task.title}
                  </p>
                  <p className="text-sm text-gray-500">{task.patient}</p>
                </div>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-medium border ${getPriorityColor(
                    task.priority
                  )}`}
                >
                  {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
                </span>
                <span className="text-sm text-gray-500">{formatDateObj(task.dueDate)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
