import React, { useState, useEffect, useRef, useCallback } from 'react';
import { PatientDocument } from './types';
import { LoginForm } from './components/LoginForm';
import { AssistantView } from './components/AssistantView';
import { Sidebar, ViewType } from './components/Sidebar';
import { TopHeader } from './components/TopHeader';
import { DoctorDashboard } from './components/DoctorDashboard';
import { PatientsView } from './components/PatientsView';
import { AppointmentsView } from './components/AppointmentsView';
import { TasksView } from './components/TasksView';
import { AnalyticsView } from './components/AnalyticsView';
import { SettingsView } from './components/SettingsView';
import { DuplicateWarningDialog } from './components/DuplicateWarningDialog';
import { ScheduleAppointmentPanel } from './components/ScheduleAppointmentPanel';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { apiService } from './services/api';
import { createEmptyDocument, validateDocument } from './utils/documentUtils';
import { FileText, Stethoscope } from 'lucide-react';
import { InstallPrompt } from './components/InstallPrompt';
import { initSocket, disconnectSocket } from './services/socketService';

function AppContent() {
  const { user, isLoading } = useAuth();
  const [documents, setDocuments] = useState<PatientDocument[]>([]);
  const [selectedDocumentId, setSelectedDocumentId] = useState<string | null>(null);
  const [currentDocument, setCurrentDocument] = useState<PatientDocument | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isNew, setIsNew] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  const [error, setError] = useState('');
  const [currentView, setCurrentView] = useState<ViewType>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [scheduleAppointmentOpen, setScheduleAppointmentOpen] = useState(false);
  const [duplicateWarning, setDuplicateWarning] = useState<{
    existingPatient: {
      id: string;
      patientName: string;
      birthday: string;
      gender: string;
      motherName?: string;
      fatherName?: string;
    };
    pendingPatient: PatientDocument;
  } | null>(null);

  // Ref to always have access to the latest currentDocument
  const currentDocumentRef = useRef<PatientDocument | null>(null);

  // Keep ref in sync with state
  useEffect(() => {
    currentDocumentRef.current = currentDocument;
  }, [currentDocument]);

  // Initialize WebSocket connection based on user role
  useEffect(() => {
    if (!user) return;

    // Determine role for socket room
    const role = user.role === 'doctor' ? 'doctor' : 'assistant';
    initSocket(role);

    return () => {
      disconnectSocket();
    };
  }, [user]);

  // Initialize local DB when user logs in (doctor only)
  useEffect(() => {
    async function initializeDB() {
      if (!user || user.role !== 'doctor') return;

      try {
        setIsInitializing(true);

        // Check if this is first time (no local data)
        const hasLocalData = await apiService.hasLocalData();

        if (!hasLocalData) {
          // First time - load from server
          console.log('No local data found - initializing from server...');
          await apiService.initializeFromServer();
        }
      } catch (error) {
        console.error('DB initialization error:', error);
        // Continue anyway - app will work with empty DB
      } finally {
        setIsInitializing(false);
      }
    }

    initializeDB();
  }, [user]);

  // Load documents when user is authenticated and initialization is done
  useEffect(() => {
    if (user && !isInitializing) {
      loadDocuments();
    }
  }, [user, isInitializing]);

  const loadDocuments = async () => {
    try {
      setIsLoadingData(true);
      const data = await apiService.getPatients();
      setDocuments(data);
    } catch (err) {
      setError('Failed to load patient data');
      console.error('Error loading documents:', err);
    } finally {
      setIsLoadingData(false);
    }
  };

  // Load selected document
  useEffect(() => {
    if (selectedDocumentId) {
      const doc = documents.find(d => d.id === selectedDocumentId);
      if (doc) {
        setCurrentDocument(doc);
        setIsNew(false);
      }
    }
  }, [selectedDocumentId, documents]);

  const handleCreateNew = () => {
    console.log('handleCreateNew called');
    try {
      const newDoc = createEmptyDocument();
      console.log('New document created:', newDoc.id);
      setCurrentDocument(newDoc);
      setSelectedDocumentId(newDoc.id);
      setIsNew(true);
      // Switch to patients view when creating new
      setCurrentView('patients');
    } catch (err) {
      console.error('Error creating new document:', err);
    }
  };

  const handleSaveDocument = useCallback(() => {
    // Use ref to get the latest document state
    const docToSave = currentDocumentRef.current;
    if (!docToSave) return;

    const errors = validateDocument(docToSave);
    if (errors.length > 0) {
      alert('Please fix the following errors:\n' + errors.join('\n'));
      return;
    }

    saveDocument(docToSave);
  }, [isNew]);

  const saveDocument = async (docToSave: PatientDocument, forceCreate = false) => {
    try {
      let savedDoc;
      if (isNew) {
        // Check for duplicates before creating (unless forceCreate is true)
        if (!forceCreate) {
          const duplicateCheck = await apiService.checkDuplicate(docToSave);
          if (duplicateCheck.duplicate && duplicateCheck.existingPatient) {
            // Show duplicate warning dialog
            setDuplicateWarning({
              existingPatient: duplicateCheck.existingPatient,
              pendingPatient: docToSave
            });
            return; // Don't save yet - wait for user decision
          }
        }

        savedDoc = await apiService.createPatient(docToSave);
        setIsNew(false);
      } else {
        savedDoc = await apiService.updatePatient(docToSave.id, docToSave);
      }

      await loadDocuments();
      alert('Document saved successfully!');
      // After saving and reloading, select the newly created/updated document.
      // This ensures the UI reflects the new record, even if the ID was assigned by the server.
      setSelectedDocumentId(savedDoc.id);
    } catch (err) {
      alert('Failed to save document. Please try again.');
      console.error('Error saving document:', err);
    }
  };

  // Handle duplicate warning dialog actions
  const handleDuplicateCancel = () => {
    setDuplicateWarning(null);
  };

  const handleDuplicateViewExisting = (existingId: string) => {
    setDuplicateWarning(null);
    handleSelectDocument(existingId);
  };

  const handleDuplicateCreateAnyway = () => {
    if (duplicateWarning) {
      const pendingPatient = duplicateWarning.pendingPatient;
      setDuplicateWarning(null);
      saveDocument(pendingPatient, true); // Force create
    }
  };

  const handleSelectDocument = (id: string) => {
    const doc = documents.find(d => d.id === id);
    if (doc) {
      setCurrentDocument(doc);
      setSelectedDocumentId(id);
      setIsNew(false);
      // Switch to patients view when selecting a patient
      setCurrentView('patients');
    }
  };

  const handleViewChange = (view: ViewType) => {
    setCurrentView(view);
  };

  const handleScheduleAppointment = async (patientId: string, date: string, notes: string, options?: {
    startTime?: string;
    endTime?: string;
    priority?: 'routine' | 'urgent' | 'emergency';
  }) => {
    try {
      const patient = documents.find(d => d.id === patientId);
      if (!patient) return;

      // Calculate AOG if patient has LMP
      let aog = undefined;
      if (patient.lmp) {
        const lmpDate = new Date(patient.lmp);
        const appointmentDate = new Date(date);
        const diffTime = appointmentDate.getTime() - lmpDate.getTime();
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
        const weeks = Math.floor(diffDays / 7);
        const days = diffDays % 7;
        aog = { weeks, days };
      }

      const updatedPatient = {
        ...patient,
        followUpDates: [
          ...(patient.followUpDates || []),
          {
            id: Math.random().toString(36).substring(2, 11),
            date,
            startTime: options?.startTime || '09:00',
            endTime: options?.endTime || '09:30',
            notes: notes || 'Scheduled appointment',
            completed: false,
            reminded: false,
            confirmed: false,
            priority: options?.priority || 'routine',
            aog
          }
        ]
      };

      await apiService.updatePatient(patientId, updatedPatient);
      await loadDocuments();
      alert('Appointment scheduled successfully!');
    } catch (err) {
      alert('Failed to schedule appointment. Please try again.');
      console.error('Error scheduling appointment:', err);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-teal-500 to-cyan-500 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white/80">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <LoginForm />;
  }

  // Assistants see a different view
  if (user.role === 'assistant1' || user.role === 'assistant2') {
    return <AssistantView />;
  }

  // Doctor view (full access) - Loading state
  if (isLoadingData || isInitializing) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-teal-500 to-cyan-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Stethoscope size={32} className="text-white" />
          </div>
          <div className="w-8 h-8 border-2 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 text-base">
            {isInitializing ? 'Initializing local database...' : 'Loading patient data...'}
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4 text-base">{error}</p>
          <button
            onClick={loadDocuments}
            className="bg-gradient-to-r from-teal-500 to-cyan-500 text-white px-5 py-3 rounded-lg hover:from-teal-600 hover:to-cyan-600 text-base"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // If doctor has no patient data, show a welcome screen to create one.
  if (documents.length === 0 && !currentDocument) {
    return (
      <div className="h-screen flex bg-slate-50">
        <Sidebar
          currentView={currentView}
          onViewChange={handleViewChange}
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />
        <div className="flex-1 flex flex-col">
          <TopHeader
            documents={documents}
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            onSelectDocument={handleSelectDocument}
            onAddPatient={handleCreateNew}
            onScheduleAppointment={() => setScheduleAppointmentOpen(true)}
            onMenuClick={() => setSidebarOpen(true)}
          />
          <div className="flex-1 flex items-center justify-center p-6">
            <div className="text-center max-w-md">
              <div className="mx-auto w-20 h-20 bg-teal-100 rounded-2xl flex items-center justify-center mb-5">
                <FileText size={40} className="text-teal-600" />
              </div>
              <h2 className="text-xl sm:text-2xl font-semibold text-gray-700 mb-3">
                No Patient Records
              </h2>
              <p className="text-gray-500 mb-6 text-base sm:text-lg">
                Get started by creating your first patient record.
              </p>
              <button
                onClick={handleCreateNew}
                className="bg-gradient-to-r from-teal-500 to-cyan-500 text-white px-8 py-3.5 rounded-xl hover:from-teal-600 hover:to-cyan-600 transition-all font-medium text-base sm:text-lg shadow-md"
              >
                Create New Record
              </button>
            </div>
          </div>
        </div>
        <ScheduleAppointmentPanel
          isOpen={scheduleAppointmentOpen}
          onClose={() => setScheduleAppointmentOpen(false)}
          patients={documents}
          selectedPatient={null}
          onSaveAppointment={handleScheduleAppointment}
        />
      </div>
    );
  }

  // Render the current view
  const renderCurrentView = () => {
    switch (currentView) {
      case 'dashboard':
        return (
          <DoctorDashboard
            patients={documents}
            onSelectPatient={handleSelectDocument}
            onViewAllAppointments={() => setCurrentView('appointments')}
            onViewCalendar={() => setCurrentView('appointments')}
          />
        );
      case 'patients':
        return (
          <PatientsView
            patients={documents}
            selectedPatient={currentDocument}
            onSelectPatient={handleSelectDocument}
            onCreateNew={handleCreateNew}
            onSave={handleSaveDocument}
            onChange={setCurrentDocument}
            isNew={isNew}
          />
        );
      case 'appointments':
        return (
          <AppointmentsView
            patients={documents}
            onSelectPatient={handleSelectDocument}
            onScheduleAppointment={() => setScheduleAppointmentOpen(true)}
            onRefresh={loadDocuments}
          />
        );
      case 'tasks':
        return <TasksView patients={documents} />;
      case 'analytics':
        return <AnalyticsView patients={documents} />;
      case 'settings':
        return <SettingsView />;
      default:
        return (
          <DoctorDashboard
            patients={documents}
            onSelectPatient={handleSelectDocument}
            onViewAllAppointments={() => setCurrentView('appointments')}
            onViewCalendar={() => setCurrentView('appointments')}
          />
        );
    }
  };

  return (
    <div className="h-screen flex bg-slate-50">
      <Sidebar
        currentView={currentView}
        onViewChange={handleViewChange}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopHeader
          documents={documents}
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          onSelectDocument={handleSelectDocument}
          onAddPatient={handleCreateNew}
          onScheduleAppointment={() => setScheduleAppointmentOpen(true)}
          onAddTask={() => setCurrentView('tasks')}
          onMenuClick={() => setSidebarOpen(true)}
        />
        {renderCurrentView()}
      </div>

      {/* Print Styles */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .print-content,
          .print-content * {
            visibility: visible;
          }
          .print-content {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      {/* Duplicate Warning Dialog */}
      {duplicateWarning && (
        <DuplicateWarningDialog
          existingPatient={duplicateWarning.existingPatient}
          onCancel={handleDuplicateCancel}
          onViewExisting={handleDuplicateViewExisting}
          onCreateAnyway={handleDuplicateCreateAnyway}
        />
      )}

      {/* Schedule Appointment Panel */}
      <ScheduleAppointmentPanel
        isOpen={scheduleAppointmentOpen}
        onClose={() => setScheduleAppointmentOpen(false)}
        patients={documents}
        selectedPatient={currentView === 'patients' ? currentDocument : null}
        onSaveAppointment={handleScheduleAppointment}
      />
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
      <InstallPrompt />
    </AuthProvider>
  );
}

export default App;
