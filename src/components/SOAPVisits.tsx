import React from 'react';
import { createPortal } from 'react-dom';
import { FormField } from './FormField';
import { formatDate } from '../utils/documentUtils';
import type { SOAPVisit } from '../types';
import {
  X,
  FileText,
  Search,
  ArrowLeft
} from 'lucide-react';

interface SOAPVisitsProps {
  visits: SOAPVisit[];
  onChange: (visits: SOAPVisit[]) => void;
  patientBirthday?: string;
}

type HistoryView = 'list' | 'search-results' | 'detail';

export function SOAPVisits({ visits, onChange, patientBirthday }: SOAPVisitsProps) {
  const [showHistory, setShowHistory] = React.useState(false);
  const [selectedVisitId, setSelectedVisitId] = React.useState<string | null>(null);

  // History popup state
  const [historyView, setHistoryView] = React.useState<HistoryView>('list');
  const [searchKeyword, setSearchKeyword] = React.useState('');
  const [searchResults, setSearchResults] = React.useState<SOAPVisit[]>([]);
  const [detailVisit, setDetailVisit] = React.useState<SOAPVisit | null>(null);

  // Form state for new/editing visit
  const [formData, setFormData] = React.useState<{
    visitDate: string;
    illnessName: string;
    illnessStartDate: string;
    age: string;
    weight: string;
    height: string;
    headCircumference: string;
    temperature: string;
    cardiacRate: string;
    respiratoryRate: string;
    bloodPressure: string;
    assessment: string;
    plan: string;
  }>({
    visitDate: new Date().toISOString().split('T')[0],
    illnessName: '',
    illnessStartDate: new Date().toISOString().split('T')[0],
    age: '',
    weight: '',
    height: '',
    headCircumference: '',
    temperature: '',
    cardiacRate: '',
    respiratoryRate: '',
    bloodPressure: '',
    assessment: '',
    plan: ''
  });

  const calculateAge = (birthday: string, visitDate: string) => {
    if (!birthday) return '';
    const birth = new Date(birthday);
    const visit = new Date(visitDate);
    const ageDiff = visit.getTime() - birth.getTime();
    const ageDate = new Date(ageDiff);
    const years = Math.abs(ageDate.getUTCFullYear() - 1970);
    if (years < 1) {
      const months = Math.floor(ageDiff / (1000 * 60 * 60 * 24 * 30));
      return `${months} months`;
    }
    return `${years} years`;
  };

  // Update age when visit date changes
  React.useEffect(() => {
    if (patientBirthday && formData.visitDate) {
      const calculatedAge = calculateAge(patientBirthday, formData.visitDate);
      if (calculatedAge !== formData.age) {
        setFormData(prev => ({ ...prev, age: calculatedAge }));
      }
    }
  }, [formData.visitDate, patientBirthday]);

  const clearFields = () => {
    const today = new Date().toISOString().split('T')[0];
    setFormData({
      visitDate: today,
      illnessName: '',
      illnessStartDate: today,
      age: patientBirthday ? calculateAge(patientBirthday, today) : '',
      weight: '',
      height: '',
      headCircumference: '',
      temperature: '',
      cardiacRate: '',
      respiratoryRate: '',
      bloodPressure: '',
      assessment: '',
      plan: ''
    });
    setSelectedVisitId(null);
  };

  const createOrUpdateRecord = () => {
    const now = new Date().toISOString();

    if (selectedVisitId) {
      // Update existing visit
      const updatedVisits = visits.map(visit => {
        if (visit.id === selectedVisitId) {
          return {
            ...visit,
            visitDate: formData.visitDate,
            subjective: {
              illnessName: formData.illnessName,
              illnessStartDate: formData.illnessStartDate,
              notes: ''
            },
            objective: {
              age: formData.age,
              weight: formData.weight,
              height: formData.height,
              headCircumference: formData.headCircumference,
              temperature: formData.temperature,
              cardiacRate: formData.cardiacRate,
              respiratoryRate: formData.respiratoryRate,
              bloodPressure: formData.bloodPressure,
              notes: ''
            },
            assessment: formData.assessment,
            plan: formData.plan,
            updatedAt: now
          };
        }
        return visit;
      });
      onChange(updatedVisits);
    } else {
      // Create new visit
      const newVisit: SOAPVisit = {
        id: `visit_${Date.now()}`,
        visitDate: formData.visitDate,
        subjective: {
          illnessName: formData.illnessName,
          illnessStartDate: formData.illnessStartDate,
          notes: ''
        },
        objective: {
          age: formData.age,
          weight: formData.weight,
          height: formData.height,
          headCircumference: formData.headCircumference,
          temperature: formData.temperature,
          cardiacRate: formData.cardiacRate,
          respiratoryRate: formData.respiratoryRate,
          bloodPressure: formData.bloodPressure,
          notes: ''
        },
        assessment: formData.assessment,
        plan: formData.plan,
        createdAt: now,
        updatedAt: now
      };
      onChange([...visits, newVisit]);
    }

    clearFields();
  };

  const loadVisitToForm = (visit: SOAPVisit) => {
    setFormData({
      visitDate: visit.visitDate,
      illnessName: visit.subjective.illnessName || '',
      illnessStartDate: visit.subjective.illnessStartDate || '',
      age: visit.objective.age || '',
      weight: visit.objective.weight || '',
      height: visit.objective.height || '',
      headCircumference: visit.objective.headCircumference || '',
      temperature: visit.objective.temperature || '',
      cardiacRate: visit.objective.cardiacRate || '',
      respiratoryRate: visit.objective.respiratoryRate || '',
      bloodPressure: visit.objective.bloodPressure || '',
      assessment: visit.assessment || '',
      plan: visit.plan || ''
    });
    setSelectedVisitId(visit.id);
    closeHistory();
  };

  const deleteVisit = (visitId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const filteredVisits = visits.filter(v => v.id !== visitId);
    onChange(filteredVisits);
    if (selectedVisitId === visitId) {
      clearFields();
    }
  };

  // Sort visits by date (newest first)
  const sortedVisits = [...visits].sort((a, b) => {
    const [ay, am, ad] = a.visitDate.split('-').map(Number);
    const [by, bm, bd] = b.visitDate.split('-').map(Number);
    return Date.UTC(by, bm - 1, bd) - Date.UTC(ay, am - 1, ad);
  });

  // Search functionality
  const performSearch = () => {
    if (!searchKeyword.trim()) {
      setSearchResults([]);
      setHistoryView('list');
      return;
    }

    const keyword = searchKeyword.toLowerCase();
    const results = visits.filter(visit => {
      const searchableText = [
        visit.visitDate,
        formatDate(visit.visitDate),
        visit.subjective.illnessName,
        visit.subjective.illnessStartDate,
        visit.subjective.notes,
        visit.objective.age,
        visit.objective.weight,
        visit.objective.height,
        visit.objective.temperature,
        visit.objective.cardiacRate,
        visit.objective.respiratoryRate,
        visit.objective.bloodPressure,
        visit.objective.headCircumference,
        visit.objective.notes,
        visit.assessment,
        visit.plan
      ].join(' ').toLowerCase();

      return searchableText.includes(keyword);
    });

    setSearchResults(results);
    setHistoryView('search-results');
  };

  const clearSearch = () => {
    setSearchKeyword('');
    setSearchResults([]);
    setHistoryView('list');
  };

  const openDetail = (visit: SOAPVisit) => {
    setDetailVisit(visit);
    setHistoryView('detail');
  };

  const backToResults = () => {
    setDetailVisit(null);
    setHistoryView(searchKeyword ? 'search-results' : 'list');
  };

  const openHistory = () => {
    setShowHistory(true);
    setHistoryView('list');
    setSearchKeyword('');
    setSearchResults([]);
    setDetailVisit(null);
  };

  const closeHistory = () => {
    setShowHistory(false);
    setHistoryView('list');
    setSearchKeyword('');
    setSearchResults([]);
    setDetailVisit(null);
  };

  // Get summary text for a visit
  const getVisitSummary = (visit: SOAPVisit) => {
    const objective = visit.objective;
    const objParts = [];
    if (objective.bloodPressure) objParts.push(`BP ${objective.bloodPressure}`);
    if (objective.cardiacRate) objParts.push(`HR ${objective.cardiacRate}`);
    return objParts.join(', ') || 'No vitals recorded';
  };

  // Highlight keyword in text
  const highlightKeyword = (text: string, keyword: string) => {
    if (!keyword || !text) return text;
    const regex = new RegExp(`(${keyword})`, 'gi');
    const parts = text.split(regex);
    return parts.map((part, i) =>
      regex.test(part) ? <strong key={i} className="font-bold">{part}</strong> : part
    );
  };

  // Get matching text context for search results
  const getMatchingContext = (visit: SOAPVisit, keyword: string): string => {
    const allText = [
      visit.subjective.illnessName,
      visit.subjective.notes,
      visit.objective.notes,
      visit.assessment,
      visit.plan
    ].filter(Boolean).join(' ');

    const lowerText = allText.toLowerCase();
    const lowerKeyword = keyword.toLowerCase();
    const index = lowerText.indexOf(lowerKeyword);

    if (index === -1) return allText.substring(0, 150) + (allText.length > 150 ? '...' : '');

    const start = Math.max(0, index - 50);
    const end = Math.min(allText.length, index + keyword.length + 100);
    let context = allText.substring(start, end);
    if (start > 0) context = '...' + context;
    if (end < allText.length) context = context + '...';
    return context;
  };

  return (
    <div className="relative">
      {/* Header with Visit Date and View Medical History button */}
      <div className="flex items-center justify-between mb-4">
        <div className="text-sm text-gray-600">
          Visit Date: <span className="font-medium">{formatDate(formData.visitDate)}</span>
        </div>
        <button
          onClick={openHistory}
          className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium text-gray-700"
        >
          View Medical History
        </button>
      </div>

      {/* Subjective Section */}
      <div className="mb-5">
        <h4 className="font-semibold text-gray-800 mb-3">Subjective</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField
            label="Name of Illness"
            value={formData.illnessName}
            onChange={(value) => setFormData(prev => ({ ...prev, illnessName: value }))}
          />
          <FormField
            label="Start Date"
            type="date"
            value={formData.illnessStartDate}
            onChange={(value) => setFormData(prev => ({ ...prev, illnessStartDate: value }))}
          />
        </div>
      </div>

      {/* Objective Section */}
      <div className="mb-5">
        <h4 className="font-semibold text-gray-800 mb-3">Objective</h4>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
          <FormField
            label="Age"
            value={formData.age}
            onChange={(value) => setFormData(prev => ({ ...prev, age: value }))}
          />
          <FormField
            label="Weight"
            value={formData.weight}
            onChange={(value) => setFormData(prev => ({ ...prev, weight: value }))}
          />
          <FormField
            label="Height"
            value={formData.height}
            onChange={(value) => setFormData(prev => ({ ...prev, height: value }))}
          />
          <FormField
            label="Head Circumference"
            value={formData.headCircumference}
            onChange={(value) => setFormData(prev => ({ ...prev, headCircumference: value }))}
          />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <FormField
            label="Temperature"
            value={formData.temperature}
            onChange={(value) => setFormData(prev => ({ ...prev, temperature: value }))}
          />
          <FormField
            label="Cardiac Rate"
            value={formData.cardiacRate}
            onChange={(value) => setFormData(prev => ({ ...prev, cardiacRate: value }))}
          />
          <FormField
            label="Respiratory Rate"
            value={formData.respiratoryRate}
            onChange={(value) => setFormData(prev => ({ ...prev, respiratoryRate: value }))}
          />
          <FormField
            label="Blood Pressure"
            value={formData.bloodPressure}
            onChange={(value) => setFormData(prev => ({ ...prev, bloodPressure: value }))}
          />
        </div>
      </div>

      {/* Assessment Section */}
      <div className="mb-5">
        <h4 className="font-semibold text-gray-800 mb-3">Assessment</h4>
        <textarea
          value={formData.assessment}
          onChange={(e) => setFormData(prev => ({ ...prev, assessment: e.target.value }))}
          className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent resize-none"
          rows={4}
        />
      </div>

      {/* Plan Section */}
      <div className="mb-5">
        <h4 className="font-semibold text-gray-800 mb-3">Plan</h4>
        <textarea
          value={formData.plan}
          onChange={(e) => setFormData(prev => ({ ...prev, plan: e.target.value }))}
          className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent resize-none"
          rows={4}
        />
      </div>

      {/* Footer Actions */}
      <div className="flex items-center justify-end gap-4 pt-4 border-t border-gray-100">
        <button
          onClick={clearFields}
          className="text-sm text-teal-600 hover:text-teal-700 font-medium"
        >
          Clear Fields
        </button>
        <button
          onClick={createOrUpdateRecord}
          className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium text-gray-700"
        >
          {selectedVisitId ? 'Update Record' : 'Create Record'}
          <FileText size={16} />
        </button>
      </div>

      {/* Medical History Popup */}
      {showHistory && createPortal(
        <>
          {/* Overlay */}
          <div
            className="fixed inset-0 bg-black bg-opacity-30 z-40"
            onClick={closeHistory}
          />

          {/* Popup */}
          <div className="fixed top-0 right-0 h-full w-full sm:w-[500px] bg-white shadow-xl z-50 flex flex-col max-h-screen overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 flex-shrink-0">
              <h3 className="text-lg font-semibold text-gray-800">View Medical History</h3>
              <button
                onClick={closeHistory}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Search Section */}
            <div className="p-4 border-b border-gray-100 flex-shrink-0">
              <label className="block text-sm font-medium text-gray-700 mb-2">Search Keyword</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={searchKeyword}
                  onChange={(e) => setSearchKeyword(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && performSearch()}
                  placeholder="Enter disease name, date, etc."
                  className="flex-1 px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm"
                />
                {historyView === 'search-results' ? (
                  <button
                    onClick={clearSearch}
                    className="px-4 py-2 text-teal-600 hover:text-teal-700 font-medium text-sm"
                  >
                    Clear
                  </button>
                ) : (
                  <button
                    onClick={performSearch}
                    className="px-4 py-2 text-teal-600 hover:text-teal-700 font-medium text-sm"
                  >
                    Search
                  </button>
                )}
              </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto p-4 overscroll-contain">
              {/* List View */}
              {historyView === 'list' && (
                <>
                  {sortedVisits.length === 0 ? (
                    <div className="text-center py-12">
                      <FileText size={40} className="mx-auto mb-3 text-gray-300" />
                      <p className="text-gray-500">No visit records yet</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-3">
                      {sortedVisits.map((visit) => (
                        <div
                          key={visit.id}
                          onClick={() => openDetail(visit)}
                          className="p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                        >
                          <p className="text-sm font-medium text-gray-700 mb-2">
                            Visit Date: {formatDate(visit.visitDate)}
                          </p>
                          <div className="text-xs text-gray-600 space-y-1">
                            <p><span className="font-medium">S:</span> {visit.subjective.illnessName || 'N/A'}</p>
                            <p><span className="font-medium">O:</span> {getVisitSummary(visit)}</p>
                            <p className="truncate"><span className="font-medium">A:</span> {visit.assessment ? visit.assessment.substring(0, 40) + '...' : 'N/A'}</p>
                            <p className="truncate"><span className="font-medium">P:</span> {visit.plan ? visit.plan.substring(0, 40) + '...' : 'N/A'}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}

              {/* Search Results View */}
              {historyView === 'search-results' && (
                <>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-sm font-medium text-gray-700">Search Results</span>
                    <span className="text-sm text-gray-500">{searchResults.length} results</span>
                  </div>
                  {searchResults.length === 0 ? (
                    <div className="text-center py-12">
                      <Search size={40} className="mx-auto mb-3 text-gray-300" />
                      <p className="text-gray-500">No results found for "{searchKeyword}"</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {searchResults.map((visit) => (
                        <div
                          key={visit.id}
                          onClick={() => openDetail(visit)}
                          className="cursor-pointer hover:bg-gray-50 p-3 rounded-lg transition-colors"
                        >
                          <p className="text-sm font-medium text-gray-700 mb-2">
                            Visit Date: {formatDate(visit.visitDate)}
                          </p>
                          <p className="text-sm text-gray-600 leading-relaxed">
                            {highlightKeyword(getMatchingContext(visit, searchKeyword), searchKeyword)}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}

              {/* Detail View */}
              {historyView === 'detail' && detailVisit && (
                <>
                  {/* Back Button */}
                  <button
                    onClick={backToResults}
                    className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-800 mb-4"
                  >
                    <ArrowLeft size={16} />
                    Back to {searchKeyword ? 'Search Results' : 'List'}
                  </button>

                  {/* Visit Date */}
                  <p className="text-sm text-gray-600 mb-4">
                    Visit Date: {formatDate(detailVisit.visitDate)}
                  </p>

                  {/* Subjective */}
                  <div className="mb-4">
                    <h4 className="font-semibold text-gray-800 mb-2">Subjective</h4>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">Name of Illness</label>
                        <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm">
                          {detailVisit.subjective.illnessName || '-'}
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">Start Date</label>
                        <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm">
                          {detailVisit.subjective.illnessStartDate ? formatDate(detailVisit.subjective.illnessStartDate) : '-'}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Objective */}
                  <div className="mb-4">
                    <h4 className="font-semibold text-gray-800 mb-2">Objective</h4>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">Age</label>
                        <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm">
                          {detailVisit.objective.age || '-'}
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">Weight</label>
                        <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm">
                          {detailVisit.objective.weight || '-'}
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">Height</label>
                        <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm">
                          {detailVisit.objective.height || '-'}
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">Head Circumference</label>
                        <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm">
                          {detailVisit.objective.headCircumference || '-'}
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">Temperature</label>
                        <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm">
                          {detailVisit.objective.temperature || '-'}
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">Cardiac Rate</label>
                        <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm">
                          {detailVisit.objective.cardiacRate || '-'}
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">Respiratory Rate</label>
                        <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm">
                          {detailVisit.objective.respiratoryRate || '-'}
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">Blood Pressure</label>
                        <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm">
                          {detailVisit.objective.bloodPressure || '-'}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Assessment */}
                  <div className="mb-4">
                    <h4 className="font-semibold text-gray-800 mb-2">Assessment</h4>
                    <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm min-h-[80px] whitespace-pre-wrap">
                      {detailVisit.assessment || '-'}
                    </div>
                  </div>

                  {/* Plan */}
                  <div className="mb-4">
                    <h4 className="font-semibold text-gray-800 mb-2">Plan</h4>
                    <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm min-h-[80px] whitespace-pre-wrap">
                      {detailVisit.plan || '-'}
                    </div>
                  </div>

                </>
              )}
            </div>
          </div>
        </>,
        document.body
      )}
    </div>
  );
}
