import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { ImmunizationRecord, BoosterShot, VACCINES, getRequiredShots } from '../types';
import { DateInput } from './DateInput';
import { Plus, List, X, Search } from 'lucide-react';

interface ImmunizationTableProps {
  immunizations: ImmunizationRecord[];
  onChange: (immunizations: ImmunizationRecord[]) => void;
}

export function ImmunizationTable({ immunizations, onChange }: ImmunizationTableProps) {
  // Modal state
  const [addBoosterModal, setAddBoosterModal] = useState<{ vaccine: string } | null>(null);
  const [viewBoosterModal, setViewBoosterModal] = useState<{ vaccine: string } | null>(null);
  const [boosterDate, setBoosterDate] = useState('');
  const [boosterReaction, setBoosterReaction] = useState('');
  const [searchKeyword, setSearchKeyword] = useState('');

  const updateImmunization = (vaccine: string, field: 'first' | 'second' | 'third', value: string) => {
    const existingIndex = immunizations.findIndex(r => r.vaccine === vaccine);
    if (existingIndex >= 0) {
      const updated = immunizations.map(record =>
        record.vaccine === vaccine
          ? { ...record, [field]: value }
          : record
      );
      onChange(updated);
    } else {
      // Create new record if it doesn't exist
      const newRecord: ImmunizationRecord = {
        vaccine,
        first: '',
        second: '',
        third: '',
        boosters: [],
        [field]: value
      };
      onChange([...immunizations, newRecord]);
    }
  };

  const getImmunization = (vaccine: string): ImmunizationRecord => {
    return immunizations.find(record => record.vaccine === vaccine) || {
      vaccine,
      first: '',
      second: '',
      third: '',
      boosters: []
    };
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    const [year, month, day] = dateStr.split('-');
    if (!year || !month || !day) return dateStr;
    return `${month}/${day}/${year}`;
  };

  const hasAllRequiredShots = (vaccine: string): boolean => {
    const record = getImmunization(vaccine);
    const required = getRequiredShots(vaccine);

    if (required >= 1 && !record.first) return false;
    if (required >= 2 && !record.second) return false;
    if (required >= 3 && !record.third) return false;
    return true;
  };

  const getMostRecentBooster = (vaccine: string): BoosterShot | null => {
    const record = getImmunization(vaccine);
    const boosters = record.boosters || [];
    if (boosters.length === 0) return null;

    // Sort by date descending and return the most recent
    const sorted = [...boosters].sort((a, b) => {
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    });
    return sorted[0];
  };

  const openAddBoosterModal = (vaccine: string) => {
    setAddBoosterModal({ vaccine });
    setBoosterDate('');
    setBoosterReaction('');
  };

  const closeAddBoosterModal = () => {
    setAddBoosterModal(null);
    setBoosterDate('');
    setBoosterReaction('');
  };

  const addBooster = () => {
    if (!addBoosterModal || !boosterDate) return;

    const vaccine = addBoosterModal.vaccine;
    const newBooster: BoosterShot = {
      id: `booster_${Date.now()}`,
      date: boosterDate,
      reaction: boosterReaction
    };

    const existingIndex = immunizations.findIndex(r => r.vaccine === vaccine);
    if (existingIndex >= 0) {
      const updated = immunizations.map(record => {
        if (record.vaccine === vaccine) {
          const existingBoosters = Array.isArray(record.boosters) ? record.boosters : [];
          return { ...record, boosters: [...existingBoosters, newBooster] };
        }
        return record;
      });
      onChange(updated);
    } else {
      const newRecord: ImmunizationRecord = {
        vaccine,
        first: '',
        second: '',
        third: '',
        boosters: [newBooster]
      };
      onChange([...immunizations, newRecord]);
    }

    closeAddBoosterModal();
  };

  const openViewBoosterModal = (vaccine: string) => {
    setViewBoosterModal({ vaccine });
    setSearchKeyword('');
  };

  const closeViewBoosterModal = () => {
    setViewBoosterModal(null);
    setSearchKeyword('');
  };

  const getFilteredBoosters = (vaccine: string): BoosterShot[] => {
    const record = getImmunization(vaccine);
    const boosters = Array.isArray(record.boosters) ? record.boosters : [];

    if (!searchKeyword.trim()) {
      return [...boosters].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }

    const keyword = searchKeyword.toLowerCase();
    return boosters
      .filter(b => {
        const dateStr = formatDate(b.date).toLowerCase();
        const reaction = (b.reaction || '').toLowerCase();
        return dateStr.includes(keyword) || reaction.includes(keyword);
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  };

  const renderDateCell = (vaccine: string, shotNumber: 1 | 2 | 3) => {
    const requiredShots = getRequiredShots(vaccine);
    const record = getImmunization(vaccine);

    // Check if this shot is N/A for this vaccine
    if (shotNumber > requiredShots) {
      return (
        <td className="border border-gray-200 px-3 py-2 text-center text-gray-400">
          N/A
        </td>
      );
    }

    const fieldMap: Record<1 | 2 | 3, 'first' | 'second' | 'third'> = {
      1: 'first',
      2: 'second',
      3: 'third'
    };
    const field = fieldMap[shotNumber];
    const value = record[field] || '';

    return (
      <td className="border border-gray-200 px-2 py-2">
        <DateInput
          value={value}
          onChange={(newValue) => updateImmunization(vaccine, field, newValue)}
          className="text-sm"
        />
      </td>
    );
  };

  const renderBoosterCell = (vaccine: string) => {
    const allShotsFilled = hasAllRequiredShots(vaccine);
    const mostRecentBooster = getMostRecentBooster(vaccine);
    const record = getImmunization(vaccine);
    const boosters = Array.isArray(record.boosters) ? record.boosters : [];

    if (!allShotsFilled) {
      return (
        <td className="border border-gray-200 px-3 py-2 text-gray-400">
          N/A
        </td>
      );
    }

    return (
      <td className="border border-gray-200 px-3 py-2">
        <div className="flex items-center justify-between gap-2">
          <div className="flex-1 truncate text-sm">
            {mostRecentBooster ? (
              <span>
                {formatDate(mostRecentBooster.date)}
                {mostRecentBooster.reaction && (
                  <span className="text-gray-500"> ({mostRecentBooster.reaction.substring(0, 30)}{mostRecentBooster.reaction.length > 30 ? '...' : ''})</span>
                )}
              </span>
            ) : (
              <span className="text-gray-400">N/A</span>
            )}
          </div>
          <div className="flex items-center gap-1 flex-shrink-0">
            <button
              onClick={() => openAddBoosterModal(vaccine)}
              className="p-1 text-gray-500 hover:text-teal-600 hover:bg-gray-100 rounded transition-colors"
              title="Add booster"
            >
              <Plus size={16} />
            </button>
            {boosters.length > 0 && (
              <button
                onClick={() => openViewBoosterModal(vaccine)}
                className="p-1 text-gray-500 hover:text-teal-600 hover:bg-gray-100 rounded transition-colors"
                title="View booster history"
              >
                <List size={16} />
              </button>
            )}
          </div>
        </div>
      </td>
    );
  };

  return (
    <div className="relative">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse border border-gray-200">
          <thead>
            <tr className="bg-gray-50">
              <th className="border border-gray-200 px-4 py-3 text-left font-semibold text-gray-700">
                Immunization & Skin Test
              </th>
              <th className="border border-gray-200 px-3 py-3 text-center font-semibold text-gray-700 w-32">1st</th>
              <th className="border border-gray-200 px-3 py-3 text-center font-semibold text-gray-700 w-32">2nd</th>
              <th className="border border-gray-200 px-3 py-3 text-center font-semibold text-gray-700 w-32">3rd</th>
              <th className="border border-gray-200 px-3 py-3 text-center font-semibold text-gray-700 min-w-[200px]">Boosters</th>
            </tr>
          </thead>
          <tbody>
            {VACCINES.map((vaccine) => (
              <tr key={vaccine} className="hover:bg-gray-50">
                <td className="border border-gray-200 px-4 py-2 font-medium text-gray-800">
                  {vaccine}
                </td>
                {renderDateCell(vaccine, 1)}
                {renderDateCell(vaccine, 2)}
                {renderDateCell(vaccine, 3)}
                {renderBoosterCell(vaccine)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add Booster Panel - Right Side */}
      {addBoosterModal && createPortal(
        <>
          <div
            className="fixed inset-0 bg-black bg-opacity-30 z-40"
            onClick={closeAddBoosterModal}
          />
          <div className="fixed top-0 right-0 h-full w-full sm:w-[500px] bg-white shadow-xl z-50 flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-800">
                Add {addBoosterModal.vaccine} Booster
              </h3>
              <button
                onClick={closeAddBoosterModal}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Booster Date
                </label>
                <DateInput
                  value={boosterDate}
                  onChange={setBoosterDate}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Reaction
                </label>
                <textarea
                  value={boosterReaction}
                  onChange={(e) => setBoosterReaction(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent resize-none"
                  rows={4}
                  placeholder="Enter any reactions or notes..."
                />
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button
                  onClick={closeAddBoosterModal}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={addBooster}
                  disabled={!boosterDate}
                  className="px-4 py-2 bg-teal-500 text-white rounded-lg hover:bg-teal-600 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Add Booster
                </button>
              </div>
            </div>
          </div>
        </>,
        document.body
      )}

      {/* View Booster History Panel - Right Side */}
      {viewBoosterModal && createPortal(
        <>
          <div
            className="fixed inset-0 bg-black bg-opacity-30 z-40"
            onClick={closeViewBoosterModal}
          />
          <div className="fixed top-0 right-0 h-full w-full sm:w-[500px] bg-white shadow-xl z-50 flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-800">
                View {viewBoosterModal.vaccine} Booster History
              </h3>
              <button
                onClick={closeViewBoosterModal}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Search Section */}
            <div className="p-4 border-b border-gray-100">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Search Date or Reaction
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={searchKeyword}
                  onChange={(e) => setSearchKeyword(e.target.value)}
                  placeholder="Enter date or reaction..."
                  className="flex-1 px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm"
                />
                <button
                  onClick={() => setSearchKeyword('')}
                  className="px-4 py-2 text-teal-600 hover:text-teal-700 font-medium text-sm"
                >
                  {searchKeyword ? 'Clear' : 'Search'}
                </button>
              </div>
            </div>

            {/* Booster List */}
            <div className="flex-1 overflow-y-auto p-4">
              {getFilteredBoosters(viewBoosterModal.vaccine).length === 0 ? (
                <div className="text-center py-8">
                  <Search size={32} className="mx-auto mb-2 text-gray-300" />
                  <p className="text-gray-500">
                    {searchKeyword ? `No results found for "${searchKeyword}"` : 'No boosters recorded'}
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {getFilteredBoosters(viewBoosterModal.vaccine).map((booster) => (
                    <div
                      key={booster.id}
                      className="p-3 border border-gray-200 rounded-lg"
                    >
                      <p className="text-sm font-medium text-gray-700 mb-1">
                        Booster Date: {formatDate(booster.date)}
                      </p>
                      <p className="text-sm text-gray-600">
                        Reaction: {booster.reaction || '-'}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>,
        document.body
      )}
    </div>
  );
}
