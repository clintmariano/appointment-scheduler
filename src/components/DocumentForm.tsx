import React, { useState, useEffect } from 'react';
import {
  PatientDocument,
  EmergencyContact,
  PreviousPregnancy,
  CurrentPregnancyRecord,
  ScreeningLab,
  SurgicalHistory,
  ClinicalDocumentation,
  createEmptyEmergencyContact,
  createEmptyPreviousPregnancy,
  createEmptyCurrentPregnancyRecord,
  createEmptyScreeningLab,
  createEmptySurgicalHistory,
  createEmptyClinicalDocumentation,
  createEmptyLaborDeliveryPostpartum,
  createEmptyObstetricOutcomes,
  calculateAOG,
  formatAOG
} from '../types';
import { FormSection } from './FormSection';
import { FormField } from './FormField';
import { ImmunizationTable } from './ImmunizationTable';
import { FollowUpManager } from './FollowUpManager';
import { formatDateObj } from '../utils/documentUtils';
import { Save, Printer, Menu, Plus, Trash2, Eye } from 'lucide-react';

interface DocumentFormProps {
  document: PatientDocument;
  originalDocument?: PatientDocument;
  onChange: (document: PatientDocument) => void;
  onSave: () => void;
  isNew: boolean;
  onMenuClick: () => void;
}

export function DocumentForm({ document, originalDocument, onChange, onSave, isNew, onMenuClick }: DocumentFormProps) {
  const [surname, setSurname] = useState('');
  const [givenName, setGivenName] = useState('');

  useEffect(() => {
    // Split patientName into surname and given name for editing
    const parts = (document.patientName || '').split(', ');
    const currentSurname = parts[0] || '';
    const currentGivenName = parts.slice(1).join(', ');
    setSurname(currentSurname);
    setGivenName(currentGivenName);
  }, [document.patientName]);

  const updatePatientName = (newSurname: string, newGivenName: string) => {
    const formattedName = `${newSurname}, ${newGivenName}`;
    updateField('patientName', formattedName);
  };

  const updateField = (field: keyof PatientDocument, value: any) => {
    onChange({
      ...document,
      [field]: value,
      updatedAt: new Date().toISOString()
    });
  };

  const handlePrint = () => {
    window.print();
  };

  // Calculate EDD when LMP changes (add 280 days / 40 weeks)
  const calculateEDD = (lmpDate: string): string => {
    if (!lmpDate) return '';
    const lmp = new Date(lmpDate);
    lmp.setDate(lmp.getDate() + 280);
    return lmp.toISOString().split('T')[0];
  };

  // Emergency Contacts handlers
  const addEmergencyContact = () => {
    const newContacts = [...(document.emergencyContacts || []), createEmptyEmergencyContact()];
    updateField('emergencyContacts', newContacts);
  };

  const updateEmergencyContact = (index: number, field: keyof EmergencyContact, value: string) => {
    const newContacts = [...(document.emergencyContacts || [])];
    newContacts[index] = { ...newContacts[index], [field]: value };
    updateField('emergencyContacts', newContacts);
  };

  const removeEmergencyContact = (index: number) => {
    const newContacts = (document.emergencyContacts || []).filter((_, i) => i !== index);
    updateField('emergencyContacts', newContacts);
  };

  // Previous Pregnancies handlers
  const addPreviousPregnancy = () => {
    const newPregnancies = [...(document.previousPregnancies || []), createEmptyPreviousPregnancy()];
    updateField('previousPregnancies', newPregnancies);
  };

  const updatePreviousPregnancy = (index: number, field: keyof PreviousPregnancy, value: string) => {
    const newPregnancies = [...(document.previousPregnancies || [])];
    newPregnancies[index] = { ...newPregnancies[index], [field]: value };
    updateField('previousPregnancies', newPregnancies);
  };

  const removePreviousPregnancy = (index: number) => {
    const newPregnancies = (document.previousPregnancies || []).filter((_, i) => i !== index);
    updateField('previousPregnancies', newPregnancies);
  };

  // Surgical History handlers
  const addSurgicalHistory = () => {
    const newHistory = [...(document.surgicalHistory || []), createEmptySurgicalHistory()];
    updateField('surgicalHistory', newHistory);
  };

  const updateSurgicalHistory = (index: number, field: keyof SurgicalHistory, value: string) => {
    const newHistory = [...(document.surgicalHistory || [])];
    newHistory[index] = { ...newHistory[index], [field]: value };
    updateField('surgicalHistory', newHistory);
  };

  const removeSurgicalHistory = (index: number) => {
    const newHistory = (document.surgicalHistory || []).filter((_, i) => i !== index);
    updateField('surgicalHistory', newHistory);
  };

  // Screening/Labs handlers
  const addScreeningLab = () => {
    const newLabs = [...(document.screeningLabs || []), createEmptyScreeningLab()];
    updateField('screeningLabs', newLabs);
  };

  const updateScreeningLab = (index: number, field: keyof ScreeningLab, value: string) => {
    const newLabs = [...(document.screeningLabs || [])];
    newLabs[index] = { ...newLabs[index], [field]: value };
    updateField('screeningLabs', newLabs);
  };

  const removeScreeningLab = (index: number) => {
    const newLabs = (document.screeningLabs || []).filter((_, i) => i !== index);
    updateField('screeningLabs', newLabs);
  };

  // Clinical Documentation handlers
  const addClinicalDocumentation = () => {
    const newDocs = [...(document.clinicalDocumentation || []), createEmptyClinicalDocumentation()];
    updateField('clinicalDocumentation', newDocs);
  };

  const updateClinicalDocumentation = (index: number, field: keyof ClinicalDocumentation, value: string) => {
    const newDocs = [...(document.clinicalDocumentation || [])];
    newDocs[index] = { ...newDocs[index], [field]: value };
    updateField('clinicalDocumentation', newDocs);
  };

  const removeClinicalDocumentation = (index: number) => {
    const newDocs = (document.clinicalDocumentation || []).filter((_, i) => i !== index);
    updateField('clinicalDocumentation', newDocs);
  };

  // Current Pregnancy Records handlers
  const addCurrentPregnancyRecord = () => {
    const newRecords = [...(document.currentPregnancyRecords || []), createEmptyCurrentPregnancyRecord()];
    updateField('currentPregnancyRecords', newRecords);
  };

  const updateCurrentPregnancyRecord = (index: number, field: keyof CurrentPregnancyRecord, value: string) => {
    const newRecords = [...(document.currentPregnancyRecords || [])];
    newRecords[index] = { ...newRecords[index], [field]: value };
    updateField('currentPregnancyRecords', newRecords);
  };

  const removeCurrentPregnancyRecord = (index: number) => {
    const newRecords = (document.currentPregnancyRecords || []).filter((_, i) => i !== index);
    updateField('currentPregnancyRecords', newRecords);
  };

  // Labor, Delivery & Postpartum handlers
  const initLaborDeliveryPostpartum = () => {
    if (!document.laborDeliveryPostpartum) {
      updateField('laborDeliveryPostpartum', createEmptyLaborDeliveryPostpartum());
    }
  };

  const updateLaborAdmission = (field: string, value: string) => {
    const ldp = document.laborDeliveryPostpartum || createEmptyLaborDeliveryPostpartum();
    updateField('laborDeliveryPostpartum', {
      ...ldp,
      laborAdmission: { ...ldp.laborAdmission, [field]: value }
    });
  };

  const updateDeliveryData = (field: string, value: string) => {
    const ldp = document.laborDeliveryPostpartum || createEmptyLaborDeliveryPostpartum();
    updateField('laborDeliveryPostpartum', {
      ...ldp,
      deliveryData: { ...ldp.deliveryData, [field]: value }
    });
  };

  const updateNewbornData = (field: string, value: string) => {
    const ldp = document.laborDeliveryPostpartum || createEmptyLaborDeliveryPostpartum();
    updateField('laborDeliveryPostpartum', {
      ...ldp,
      newbornData: { ...ldp.newbornData, [field]: value }
    });
  };

  const updatePostpartumData = (field: string, value: string) => {
    const ldp = document.laborDeliveryPostpartum || createEmptyLaborDeliveryPostpartum();
    updateField('laborDeliveryPostpartum', {
      ...ldp,
      postpartumData: { ...ldp.postpartumData, [field]: value }
    });
  };

  // Obstetric Outcomes handlers
  const updateObstetricOutcomes = (field: string, value: string) => {
    const outcomes = document.obstetricOutcomes || createEmptyObstetricOutcomes();
    updateField('obstetricOutcomes', { ...outcomes, [field]: value });
  };

  // Current AOG calculation
  const currentAOG = document.lmp ? formatAOG(calculateAOG(document.lmp)) : '';

  return (
    <div className="flex-1 bg-slate-100 overflow-y-auto">
      <div className="w-full px-4 sm:px-6 lg:px-8 py-4 sm:py-6 space-y-4 sm:space-y-5">
        {/* Header */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-5 print-content shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={onMenuClick}
                className="lg:hidden p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <Menu size={22} />
              </button>
              <div>
                <h1 className="text-lg sm:text-xl font-bold text-gray-800">
                  {document.patientName || 'New Patient'}
                </h1>
                <p className="text-xs sm:text-sm text-gray-500">
                  {isNew ? 'Creating new record' : `Last updated: ${formatDateObj(new Date(document.updatedAt))}`}
                </p>
              </div>
            </div>
            <div className="flex gap-2 sm:gap-3 no-print">
              <button
                onClick={handlePrint}
                className="flex items-center gap-1.5 bg-gray-100 text-gray-700 px-3 py-2 sm:py-2.5 rounded-lg hover:bg-gray-200 transition-colors text-sm"
              >
                <Printer size={16} />
                <span className="hidden sm:inline">Print</span>
              </button>
              <button
                onClick={onSave}
                className="flex items-center gap-1.5 px-4 py-2 sm:py-2.5 rounded-lg transition-all text-sm font-medium bg-gradient-to-r from-teal-500 to-cyan-500 text-white hover:from-teal-600 hover:to-cyan-600 shadow-sm"
              >
                <Save size={16} />
                <span className="hidden sm:inline">{isNew ? 'Save' : 'Update'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Patient Information */}
        <FormSection title="Patient Information">
          {/* Row 1: Surname, Given Name, Birth Date */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 lg:gap-4">
            <FormField
              label="Surname"
              value={surname}
              onChange={(value) => {
                setSurname(value);
                updatePatientName(value, givenName);
              }}
              required
            />
            <FormField
              label="Given Name"
              value={givenName}
              onChange={(value) => {
                setGivenName(value);
                updatePatientName(surname, value);
              }}
              required
            />
            <FormField
              label="Birth Date"
              value={document.birthday}
              onChange={(value) => updateField('birthday', value)}
              type="date"
              required
            />
          </div>

          {/* Row 2: Address (2/3), Contact Numbers (1/3) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 lg:gap-4 mt-4">
            <FormField
              label="Address"
              value={document.address}
              onChange={(value) => updateField('address', value)}
              className="sm:col-span-2"
              required
            />
            <FormField
              label="Contact Numbers"
              value={document.contactNumbers}
              onChange={(value) => updateField('contactNumbers', value)}
              required
            />
          </div>

          {/* Emergency Contact */}
          <div className="mt-6">
            <h4 className="font-semibold text-gray-900 mb-3">Emergency Contact</h4>

            {/* Show empty row if no contacts yet */}
            {(document.emergencyContacts || []).length === 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 lg:gap-4">
                <FormField
                  label="Name"
                  value=""
                  onChange={(value) => {
                    // Create first contact when user starts typing
                    const newContact = createEmptyEmergencyContact();
                    newContact.name = value;
                    updateField('emergencyContacts', [newContact]);
                  }}
                  required
                />
                <FormField
                  label="Relationship"
                  value=""
                  onChange={() => {}}
                  required
                />
                <FormField
                  label="Contact Numbers"
                  value=""
                  onChange={() => {}}
                  required
                />
              </div>
            ) : (
              /* Show existing contacts */
              (document.emergencyContacts || []).map((contact, index) => (
                <div key={contact.id} className={`grid grid-cols-1 sm:grid-cols-3 gap-3 lg:gap-4 ${index > 0 ? 'mt-3 pt-3 border-t border-gray-200' : ''}`}>
                  <FormField
                    label="Name"
                    value={contact.name}
                    onChange={(value) => updateEmergencyContact(index, 'name', value)}
                    required
                  />
                  <FormField
                    label="Relationship"
                    value={contact.relationship}
                    onChange={(value) => updateEmergencyContact(index, 'relationship', value)}
                    required
                  />
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <FormField
                        label="Contact Numbers"
                        value={contact.contactNumbers}
                        onChange={(value) => updateEmergencyContact(index, 'contactNumbers', value)}
                        required
                      />
                    </div>
                    {index > 0 && (
                      <div className="flex items-end pb-0.5">
                        <button
                          onClick={() => removeEmergencyContact(index)}
                          className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}

            {/* Add New Emergency Contact button */}
            <div className="flex justify-end mt-4">
              <button
                onClick={addEmergencyContact}
                className="px-5 py-2.5 text-sm font-medium border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 hover:border-gray-300 transition-colors shadow-sm"
              >
                Add New Emergency Contact
              </button>
            </div>
          </div>
        </FormSection>

        {/* Obstetric History */}
        <FormSection title="Obstetric History">
          {/* Row 1: Gravidity and Parity (2 columns) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 lg:gap-4">
            <FormField
              label="Gravidity"
              value={document.gravida?.toString() || ''}
              onChange={(value) => updateField('gravida', value ? parseInt(value) : undefined)}
              type="number"
              required
            />
            <FormField
              label="Parity"
              value={document.para?.toString() || ''}
              onChange={(value) => updateField('para', value ? parseInt(value) : undefined)}
              type="number"
              required
            />
          </div>

          {/* Obstetric Outcomes */}
          <div className="mt-6">
            <h4 className="font-semibold text-gray-900 mb-3">Obstetric Outcomes</h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 lg:gap-4">
              <FormField
                label="Term deliveries"
                value={document.obstetricOutcomes?.termDeliveries || ''}
                onChange={(value) => updateObstetricOutcomes('termDeliveries', value)}
                required
              />
              <FormField
                label="Preterm deliveries"
                value={document.obstetricOutcomes?.pretermDeliveries || ''}
                onChange={(value) => updateObstetricOutcomes('pretermDeliveries', value)}
                required
              />
              <FormField
                label="Abortions/Pregnancy losses"
                value={document.obstetricOutcomes?.abortionsPregnancyLosses || ''}
                onChange={(value) => updateObstetricOutcomes('abortionsPregnancyLosses', value)}
                required
              />
              <FormField
                label="Living children"
                value={document.obstetricOutcomes?.livingChildren || ''}
                onChange={(value) => updateObstetricOutcomes('livingChildren', value)}
                required
              />
            </div>
          </div>

          {/* Previous Pregnancies */}
          <div className="mt-6">
            <h4 className="font-semibold text-gray-900 mb-3">Previous Pregnancies</h4>

            {/* Show empty row if no pregnancies yet */}
            {(document.previousPregnancies || []).length === 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 lg:gap-4">
                <FormField
                  label="Complications"
                  value=""
                  onChange={(value) => {
                    const newPregnancy = createEmptyPreviousPregnancy();
                    newPregnancy.complications = value;
                    updateField('previousPregnancies', [newPregnancy]);
                  }}
                />
                <FormField
                  label="Mode of Delivery"
                  value=""
                  onChange={() => {}}
                />
                <FormField
                  label="Birth Weight"
                  value=""
                  onChange={() => {}}
                />
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Sex</label>
                  <div className="flex gap-4 h-10 items-center">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        value="Male"
                        checked={true}
                        onChange={() => {}}
                        className="mr-2 accent-teal-600"
                      />
                      Male
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        value="Female"
                        checked={false}
                        onChange={() => {}}
                        className="mr-2 accent-teal-600"
                      />
                      Female
                    </label>
                  </div>
                </div>
              </div>
            ) : (
              /* Show existing pregnancies */
              (document.previousPregnancies || []).map((pregnancy, index) => (
                <div key={pregnancy.id} className={`grid grid-cols-2 sm:grid-cols-4 gap-3 lg:gap-4 ${index > 0 ? 'mt-3 pt-3 border-t border-gray-200' : ''}`}>
                  <FormField
                    label="Complications"
                    value={pregnancy.complications}
                    onChange={(value) => updatePreviousPregnancy(index, 'complications', value)}
                  />
                  <FormField
                    label="Mode of Delivery"
                    value={pregnancy.modeOfDelivery}
                    onChange={(value) => updatePreviousPregnancy(index, 'modeOfDelivery', value)}
                  />
                  <FormField
                    label="Birth Weight"
                    value={pregnancy.birthWeight}
                    onChange={(value) => updatePreviousPregnancy(index, 'birthWeight', value)}
                  />
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Sex</label>
                      <div className="flex gap-4 h-10 items-center">
                        <label className="flex items-center">
                          <input
                            type="radio"
                            value="Male"
                            checked={pregnancy.sex === 'Male'}
                            onChange={() => updatePreviousPregnancy(index, 'sex', 'Male')}
                            className="mr-2 accent-teal-600"
                          />
                          Male
                        </label>
                        <label className="flex items-center">
                          <input
                            type="radio"
                            value="Female"
                            checked={pregnancy.sex === 'Female'}
                            onChange={() => updatePreviousPregnancy(index, 'sex', 'Female')}
                            className="mr-2 accent-teal-600"
                          />
                          Female
                        </label>
                      </div>
                    </div>
                    {index > 0 && (
                      <div className="flex items-end pb-0.5">
                        <button
                          onClick={() => removePreviousPregnancy(index)}
                          className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}

            {/* Add New Pregnancy button */}
            <div className="flex justify-end mt-4">
              <button
                onClick={addPreviousPregnancy}
                className="px-5 py-2.5 text-sm font-medium border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 hover:border-gray-300 transition-colors shadow-sm"
              >
                Add New Pregnancy
              </button>
            </div>
          </div>
        </FormSection>

        {/* Current Pregnancy */}
        <FormSection title="Current Pregnancy">
          {/* Header: Record Date and View All Records button */}
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-semibold text-gray-900">Record Date: {new Date().toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' })}</h4>
            <button
              className="px-5 py-2.5 text-sm font-medium border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 hover:border-gray-300 transition-colors shadow-sm"
            >
              View All Records
            </button>
          </div>

          {/* Row 1: LMP and EDD (2 columns) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 lg:gap-4">
            <FormField
              label="Last Menstrual Period"
              value={document.lmp || ''}
              onChange={(value) => {
                updateField('lmp', value);
                // Auto-calculate EDD
                if (value) {
                  updateField('edd', calculateEDD(value));
                }
              }}
              type="date"
              required
            />
            <FormField
              label="Estimated Delivery Date"
              value={document.edd || ''}
              onChange={(value) => updateField('edd', value)}
              type="date"
              required
            />
          </div>

          {/* Row 2: Weight, Blood Pressure, Gestational Age, Urine Test Results (4 columns) */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 lg:gap-4 mt-4">
            <FormField
              label="Weight"
              value={document.currentPregnancyRecords?.[0]?.weight || ''}
              onChange={(value) => {
                if ((document.currentPregnancyRecords || []).length === 0) {
                  const newRecord = createEmptyCurrentPregnancyRecord();
                  newRecord.weight = value;
                  updateField('currentPregnancyRecords', [newRecord]);
                } else {
                  updateCurrentPregnancyRecord(0, 'weight', value);
                }
              }}
            />
            <FormField
              label="Blood Pressure"
              value={document.currentPregnancyRecords?.[0]?.bloodPressure || ''}
              onChange={(value) => {
                if ((document.currentPregnancyRecords || []).length === 0) {
                  const newRecord = createEmptyCurrentPregnancyRecord();
                  newRecord.bloodPressure = value;
                  updateField('currentPregnancyRecords', [newRecord]);
                } else {
                  updateCurrentPregnancyRecord(0, 'bloodPressure', value);
                }
              }}
            />
            <FormField
              label="Gestational Age"
              value={document.currentPregnancyRecords?.[0]?.gestationalAge || ''}
              onChange={(value) => {
                if ((document.currentPregnancyRecords || []).length === 0) {
                  const newRecord = createEmptyCurrentPregnancyRecord();
                  newRecord.gestationalAge = value;
                  updateField('currentPregnancyRecords', [newRecord]);
                } else {
                  updateCurrentPregnancyRecord(0, 'gestationalAge', value);
                }
              }}
              required
            />
            <FormField
              label="Urine Test Results"
              value={document.currentPregnancyRecords?.[0]?.urineTestResults || ''}
              onChange={(value) => {
                if ((document.currentPregnancyRecords || []).length === 0) {
                  const newRecord = createEmptyCurrentPregnancyRecord();
                  newRecord.urineTestResults = value;
                  updateField('currentPregnancyRecords', [newRecord]);
                } else {
                  updateCurrentPregnancyRecord(0, 'urineTestResults', value);
                }
              }}
              placeholder="Select file"
              required
            />
          </div>

          {/* Fetal Assessment */}
          <div className="mt-6">
            <h4 className="font-semibold text-gray-900 mb-3">Fetal Assessment</h4>
            {/* Row 1: Fetal Heart Rate, Fetal Movement, Fundal Height (3 columns) */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 lg:gap-4">
              <FormField
                label="Fetal Heart Rate"
                value={document.currentPregnancyRecords?.[0]?.fetalHeartRate || ''}
                onChange={(value) => {
                  if ((document.currentPregnancyRecords || []).length === 0) {
                    const newRecord = createEmptyCurrentPregnancyRecord();
                    newRecord.fetalHeartRate = value;
                    updateField('currentPregnancyRecords', [newRecord]);
                  } else {
                    updateCurrentPregnancyRecord(0, 'fetalHeartRate', value);
                  }
                }}
              />
              <FormField
                label="Fetal Movement"
                value={document.currentPregnancyRecords?.[0]?.fetalMovement || ''}
                onChange={(value) => {
                  if ((document.currentPregnancyRecords || []).length === 0) {
                    const newRecord = createEmptyCurrentPregnancyRecord();
                    newRecord.fetalMovement = value;
                    updateField('currentPregnancyRecords', [newRecord]);
                  } else {
                    updateCurrentPregnancyRecord(0, 'fetalMovement', value);
                  }
                }}
              />
              <FormField
                label="Fundal Height"
                value={document.currentPregnancyRecords?.[0]?.fundalHeight || ''}
                onChange={(value) => {
                  if ((document.currentPregnancyRecords || []).length === 0) {
                    const newRecord = createEmptyCurrentPregnancyRecord();
                    newRecord.fundalHeight = value;
                    updateField('currentPregnancyRecords', [newRecord]);
                  } else {
                    updateCurrentPregnancyRecord(0, 'fundalHeight', value);
                  }
                }}
              />
            </div>
            {/* Row 2: Position of Fetus, Dilation (2 columns) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 lg:gap-4 mt-4">
              <FormField
                label="Position of the Fetus"
                value={document.currentPregnancyRecords?.[0]?.positionOfFetus || ''}
                onChange={(value) => {
                  if ((document.currentPregnancyRecords || []).length === 0) {
                    const newRecord = createEmptyCurrentPregnancyRecord();
                    newRecord.positionOfFetus = value;
                    updateField('currentPregnancyRecords', [newRecord]);
                  } else {
                    updateCurrentPregnancyRecord(0, 'positionOfFetus', value);
                  }
                }}
              />
              <FormField
                label="Dilation"
                value={document.currentPregnancyRecords?.[0]?.dilation || ''}
                onChange={(value) => {
                  if ((document.currentPregnancyRecords || []).length === 0) {
                    const newRecord = createEmptyCurrentPregnancyRecord();
                    newRecord.dilation = value;
                    updateField('currentPregnancyRecords', [newRecord]);
                  } else {
                    updateCurrentPregnancyRecord(0, 'dilation', value);
                  }
                }}
              />
            </div>
          </div>

          {/* Screening/Labs */}
          <div className="mt-6">
            <h4 className="font-semibold text-gray-900 mb-3">Screening/Labs</h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 lg:gap-4">
              <FormField
                label="Test Name"
                value={document.screeningLabs?.[0]?.testName || ''}
                onChange={(value) => {
                  if ((document.screeningLabs || []).length === 0) {
                    const newLab = createEmptyScreeningLab();
                    newLab.testName = value;
                    updateField('screeningLabs', [newLab]);
                  } else {
                    updateScreeningLab(0, 'testName', value);
                  }
                }}
              />
              <FormField
                label="Notes"
                value={document.screeningLabs?.[0]?.notes || ''}
                onChange={(value) => {
                  if ((document.screeningLabs || []).length === 0) {
                    const newLab = createEmptyScreeningLab();
                    newLab.notes = value;
                    updateField('screeningLabs', [newLab]);
                  } else {
                    updateScreeningLab(0, 'notes', value);
                  }
                }}
              />
              <FormField
                label="Test Results"
                value={document.screeningLabs?.[0]?.testResults || ''}
                onChange={(value) => {
                  if ((document.screeningLabs || []).length === 0) {
                    const newLab = createEmptyScreeningLab();
                    newLab.testResults = value;
                    updateField('screeningLabs', [newLab]);
                  } else {
                    updateScreeningLab(0, 'testResults', value);
                  }
                }}
                placeholder="Select file"
              />
            </div>
          </div>

          {/* Footer: Clear Fields and Create Record */}
          <div className="flex items-center justify-end gap-3 mt-6">
            <button
              onClick={() => {
                // Clear the current pregnancy record fields
                if ((document.currentPregnancyRecords || []).length > 0) {
                  const clearedRecord = createEmptyCurrentPregnancyRecord();
                  clearedRecord.id = document.currentPregnancyRecords[0].id;
                  updateField('currentPregnancyRecords', [clearedRecord]);
                }
                if ((document.screeningLabs || []).length > 0) {
                  const clearedLab = createEmptyScreeningLab();
                  clearedLab.id = document.screeningLabs[0].id;
                  updateField('screeningLabs', [clearedLab]);
                }
              }}
              className="text-sm font-medium text-teal-600 hover:text-teal-700"
            >
              Clear Fields
            </button>
            <button
              onClick={addCurrentPregnancyRecord}
              className="px-5 py-2.5 text-sm font-medium border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 hover:border-gray-300 transition-colors shadow-sm flex items-center gap-2"
            >
              Create Record
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                <polyline points="14 2 14 8 20 8"></polyline>
                <line x1="12" y1="18" x2="12" y2="12"></line>
                <line x1="9" y1="15" x2="15" y2="15"></line>
              </svg>
            </button>
          </div>
        </FormSection>

        {/* General Medical & Surgical History */}
        <FormSection title="General Medical & Surgical History">
          {/* Row 1: Allergies, Medical Conditions (2 columns) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 lg:gap-4">
            <FormField
              label="Allergies"
              value={document.allergies || ''}
              onChange={(value) => updateField('allergies', value)}
            />
            <FormField
              label="Medical Conditions"
              value={document.medicalConditions || ''}
              onChange={(value) => updateField('medicalConditions', value)}
            />
          </div>

          {/* Surgical History */}
          <div className="mt-6">
            <h4 className="font-semibold text-gray-900 mb-3">Surgical History</h4>

            {/* Show empty row if no history yet */}
            {(document.surgicalHistory || []).length === 0 ? (
              <div className="grid grid-cols-6 gap-3 lg:gap-4">
                <FormField
                  label="Date"
                  value=""
                  onChange={(value) => {
                    const newHistory = createEmptySurgicalHistory();
                    newHistory.date = value;
                    updateField('surgicalHistory', [newHistory]);
                  }}
                  type="date"
                />
                <FormField
                  label="Procedure"
                  value=""
                  onChange={() => {}}
                  className="col-span-2"
                />
                <FormField
                  label="Findings"
                  value=""
                  onChange={() => {}}
                  className="col-span-3"
                />
              </div>
            ) : (
              /* Show existing history */
              (document.surgicalHistory || []).map((history, index) => (
                <div key={history.id} className={`grid grid-cols-6 gap-3 lg:gap-4 ${index > 0 ? 'mt-3 pt-3 border-t border-gray-200' : ''}`}>
                  <FormField
                    label="Date"
                    value={history.date}
                    onChange={(value) => updateSurgicalHistory(index, 'date', value)}
                    type="date"
                  />
                  <FormField
                    label="Procedure"
                    value={history.procedure}
                    onChange={(value) => updateSurgicalHistory(index, 'procedure', value)}
                    className="col-span-2"
                  />
                  <div className={`flex gap-2 ${index > 0 ? 'col-span-3' : 'col-span-3'}`}>
                    <div className="flex-1">
                      <FormField
                        label="Findings"
                        value={history.findings}
                        onChange={(value) => updateSurgicalHistory(index, 'findings', value)}
                      />
                    </div>
                    {index > 0 && (
                      <div className="flex items-end pb-0.5">
                        <button
                          onClick={() => removeSurgicalHistory(index)}
                          className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}

            {/* Add New Surgical History button */}
            <div className="flex justify-end mt-4">
              <button
                onClick={addSurgicalHistory}
                className="px-5 py-2.5 text-sm font-medium border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 hover:border-gray-300 transition-colors shadow-sm"
              >
                Add New Surgical History
              </button>
            </div>
          </div>

          {/* Row: Medication, Dosage, Social History (3 columns) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 lg:gap-4 mt-6">
            <FormField
              label="Medication"
              value={document.medication || ''}
              onChange={(value) => updateField('medication', value)}
            />
            <FormField
              label="Dosage"
              value={document.dosage || ''}
              onChange={(value) => updateField('dosage', value)}
            />
            <FormField
              label="Social History"
              value={document.socialHistory || ''}
              onChange={(value) => updateField('socialHistory', value)}
            />
          </div>
        </FormSection>

        {/* Immunization and Skin Test */}
        <FormSection title="Immunization and Skin Test">
          <ImmunizationTable
            immunizations={document.immunizations}
            onChange={(immunizations) => updateField('immunizations', immunizations)}
          />
        </FormSection>

        {/* Labor, Delivery & Postpartum Notes */}
        <FormSection title="Labor, Delivery & Postpartum Notes">
          {/* Labor Admissions */}
          <div className="mb-6">
            <h4 className="font-semibold text-gray-900 mb-3">Labor Admissions</h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 lg:gap-4">
              <FormField
                label="Date of Admission"
                value={document.laborDeliveryPostpartum?.laborAdmission?.dateOfAdmission || ''}
                onChange={(value) => {
                  initLaborDeliveryPostpartum();
                  updateLaborAdmission('dateOfAdmission', value);
                }}
                type="date"
                required
              />
              <FormField
                label="Time of Admission"
                value={document.laborDeliveryPostpartum?.laborAdmission?.timeOfAdmission || ''}
                onChange={(value) => {
                  initLaborDeliveryPostpartum();
                  updateLaborAdmission('timeOfAdmission', value);
                }}
                required
              />
              <FormField
                label="Membrane Status"
                value={document.laborDeliveryPostpartum?.laborAdmission?.membraneStatus || ''}
                onChange={(value) => {
                  initLaborDeliveryPostpartum();
                  updateLaborAdmission('membraneStatus', value);
                }}
                required
              />
              <FormField
                label="Labor Onset"
                value={document.laborDeliveryPostpartum?.laborAdmission?.laborOnset || ''}
                onChange={(value) => {
                  initLaborDeliveryPostpartum();
                  updateLaborAdmission('laborOnset', value);
                }}
                required
              />
            </div>
          </div>

          {/* Delivery Data */}
          <div className="mb-6">
            <h4 className="font-semibold text-gray-900 mb-3">Delivery Data</h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 lg:gap-4">
              <FormField
                label="Date of Delivery"
                value={document.laborDeliveryPostpartum?.deliveryData?.dateOfDelivery || ''}
                onChange={(value) => {
                  initLaborDeliveryPostpartum();
                  updateDeliveryData('dateOfDelivery', value);
                }}
                required
              />
              <FormField
                label="Time of Delivery"
                value={document.laborDeliveryPostpartum?.deliveryData?.timeOfDelivery || ''}
                onChange={(value) => {
                  initLaborDeliveryPostpartum();
                  updateDeliveryData('timeOfDelivery', value);
                }}
                required
              />
              <FormField
                label="Mode of Delivery"
                value={document.laborDeliveryPostpartum?.deliveryData?.modeOfDelivery || ''}
                onChange={(value) => {
                  initLaborDeliveryPostpartum();
                  updateDeliveryData('modeOfDelivery', value);
                }}
                required
              />
              <FormField
                label="Placental Delivery"
                value={document.laborDeliveryPostpartum?.deliveryData?.placentalDelivery || ''}
                onChange={(value) => {
                  initLaborDeliveryPostpartum();
                  updateDeliveryData('placentalDelivery', value);
                }}
                required
              />
            </div>
          </div>

          {/* Newborn Data */}
          <div className="mb-6">
            <h4 className="font-semibold text-gray-900 mb-3">Newborn Data</h4>
            {/* Row 1: APGAR, Birth Weight, Sex (3 columns) */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 lg:gap-4">
              <FormField
                label="APGAR"
                value={document.laborDeliveryPostpartum?.newbornData?.apgar || ''}
                onChange={(value) => {
                  initLaborDeliveryPostpartum();
                  updateNewbornData('apgar', value);
                }}
              />
              <FormField
                label="Birth Weight"
                value={document.laborDeliveryPostpartum?.newbornData?.birthWeight || ''}
                onChange={(value) => {
                  initLaborDeliveryPostpartum();
                  updateNewbornData('birthWeight', value);
                }}
              />
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Sex</label>
                <div className="flex gap-4 h-10 items-center">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="Male"
                      checked={document.laborDeliveryPostpartum?.newbornData?.sex === 'Male' || !document.laborDeliveryPostpartum?.newbornData?.sex}
                      onChange={() => {
                        initLaborDeliveryPostpartum();
                        updateNewbornData('sex', 'Male');
                      }}
                      className="mr-2 accent-teal-600"
                    />
                    Male
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="Female"
                      checked={document.laborDeliveryPostpartum?.newbornData?.sex === 'Female'}
                      onChange={() => {
                        initLaborDeliveryPostpartum();
                        updateNewbornData('sex', 'Female');
                      }}
                      className="mr-2 accent-teal-600"
                    />
                    Female
                  </label>
                </div>
              </div>
            </div>
            {/* Row 2: Labor Issues (full width) */}
            <div className="mt-4">
              <FormField
                label="Labor Issues"
                value={document.laborDeliveryPostpartum?.newbornData?.laborIssues || ''}
                onChange={(value) => {
                  initLaborDeliveryPostpartum();
                  updateNewbornData('laborIssues', value);
                }}
              />
            </div>
          </div>

          {/* Postpartum Data */}
          <div className="mb-6">
            <h4 className="font-semibold text-gray-900 mb-3">Postpartum Data</h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 lg:gap-4">
              <FormField
                label="Fundal Check"
                value={document.laborDeliveryPostpartum?.postpartumData?.fundalCheck || ''}
                onChange={(value) => {
                  initLaborDeliveryPostpartum();
                  updatePostpartumData('fundalCheck', value);
                }}
              />
              <FormField
                label="Bleeding"
                value={document.laborDeliveryPostpartum?.postpartumData?.bleeding || ''}
                onChange={(value) => {
                  initLaborDeliveryPostpartum();
                  updatePostpartumData('bleeding', value);
                }}
              />
              <FormField
                label="Recovery Status"
                value={document.laborDeliveryPostpartum?.postpartumData?.recoveryStatus || ''}
                onChange={(value) => {
                  initLaborDeliveryPostpartum();
                  updatePostpartumData('recoveryStatus', value);
                }}
                placeholder="Select file"
              />
            </div>
          </div>

          {/* Footer: Clear Fields and Save Notes */}
          <div className="flex items-center justify-end gap-3">
            <button
              onClick={() => {
                updateField('laborDeliveryPostpartum', undefined);
              }}
              className="text-sm font-medium text-teal-600 hover:text-teal-700"
            >
              Clear Fields
            </button>
            <button
              onClick={onSave}
              className="px-5 py-2.5 text-sm font-medium border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 hover:border-gray-300 transition-colors shadow-sm flex items-center gap-2"
            >
              Save Notes
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                <polyline points="14 2 14 8 20 8"></polyline>
                <line x1="12" y1="18" x2="12" y2="12"></line>
                <line x1="9" y1="15" x2="15" y2="15"></line>
              </svg>
            </button>
          </div>
        </FormSection>

        {/* Clinical & Administrative Documentation */}
        <FormSection title="Clinical & Administrative Documentation">
          {/* Header: Visit Date and View Medical History button */}
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-semibold text-gray-900">Visit Date: {new Date().toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' })}</h4>
            <button
              className="px-5 py-2.5 text-sm font-medium border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 hover:border-gray-300 transition-colors shadow-sm"
            >
              View Medical History
            </button>
          </div>

          {/* Row 1: Subjective, Objective (2 columns) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 lg:gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Subjective <span className="text-red-500">*</span>
              </label>
              <textarea
                value={document.clinicalDocumentation?.[0]?.subjective || ''}
                onChange={(e) => {
                  if ((document.clinicalDocumentation || []).length === 0) {
                    const newDoc = createEmptyClinicalDocumentation();
                    newDoc.subjective = e.target.value;
                    updateField('clinicalDocumentation', [newDoc]);
                  } else {
                    updateClinicalDocumentation(0, 'subjective', e.target.value);
                  }
                }}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm resize-none"
                rows={4}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Objective <span className="text-red-500">*</span>
              </label>
              <textarea
                value={document.clinicalDocumentation?.[0]?.objective || ''}
                onChange={(e) => {
                  if ((document.clinicalDocumentation || []).length === 0) {
                    const newDoc = createEmptyClinicalDocumentation();
                    newDoc.objective = e.target.value;
                    updateField('clinicalDocumentation', [newDoc]);
                  } else {
                    updateClinicalDocumentation(0, 'objective', e.target.value);
                  }
                }}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm resize-none"
                rows={4}
              />
            </div>
          </div>

          {/* Row 2: Assessment, Plan (2 columns) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 lg:gap-4 mt-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Assessment <span className="text-red-500">*</span>
              </label>
              <textarea
                value={document.clinicalDocumentation?.[0]?.assessment || ''}
                onChange={(e) => {
                  if ((document.clinicalDocumentation || []).length === 0) {
                    const newDoc = createEmptyClinicalDocumentation();
                    newDoc.assessment = e.target.value;
                    updateField('clinicalDocumentation', [newDoc]);
                  } else {
                    updateClinicalDocumentation(0, 'assessment', e.target.value);
                  }
                }}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm resize-none"
                rows={4}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Plan <span className="text-red-500">*</span>
              </label>
              <textarea
                value={document.clinicalDocumentation?.[0]?.plan || ''}
                onChange={(e) => {
                  if ((document.clinicalDocumentation || []).length === 0) {
                    const newDoc = createEmptyClinicalDocumentation();
                    newDoc.plan = e.target.value;
                    updateField('clinicalDocumentation', [newDoc]);
                  } else {
                    updateClinicalDocumentation(0, 'plan', e.target.value);
                  }
                }}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm resize-none"
                rows={4}
              />
            </div>
          </div>

          {/* Row 3: Consent Form, Patient Education Materials, Imaging Reports (3 columns) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 lg:gap-4 mt-4">
            <FormField
              label="Consent Form"
              value={document.clinicalDocumentation?.[0]?.consentForm || ''}
              onChange={(value) => {
                if ((document.clinicalDocumentation || []).length === 0) {
                  const newDoc = createEmptyClinicalDocumentation();
                  newDoc.consentForm = value;
                  updateField('clinicalDocumentation', [newDoc]);
                } else {
                  updateClinicalDocumentation(0, 'consentForm', value);
                }
              }}
              placeholder="Select file"
            />
            <FormField
              label="Patient Education Materials"
              value={document.clinicalDocumentation?.[0]?.patientEducationMaterials || ''}
              onChange={(value) => {
                if ((document.clinicalDocumentation || []).length === 0) {
                  const newDoc = createEmptyClinicalDocumentation();
                  newDoc.patientEducationMaterials = value;
                  updateField('clinicalDocumentation', [newDoc]);
                } else {
                  updateClinicalDocumentation(0, 'patientEducationMaterials', value);
                }
              }}
              placeholder="Select file"
            />
            <FormField
              label="Imaging Reports"
              value={document.clinicalDocumentation?.[0]?.imagingReports || ''}
              onChange={(value) => {
                if ((document.clinicalDocumentation || []).length === 0) {
                  const newDoc = createEmptyClinicalDocumentation();
                  newDoc.imagingReports = value;
                  updateField('clinicalDocumentation', [newDoc]);
                } else {
                  updateClinicalDocumentation(0, 'imagingReports', value);
                }
              }}
              placeholder="Select file"
            />
          </div>

          {/* Footer: Clear Fields and Create Record */}
          <div className="flex items-center justify-end gap-3 mt-6">
            <button
              onClick={() => {
                if ((document.clinicalDocumentation || []).length > 0) {
                  const clearedDoc = createEmptyClinicalDocumentation();
                  clearedDoc.id = document.clinicalDocumentation[0].id;
                  updateField('clinicalDocumentation', [clearedDoc]);
                }
              }}
              className="text-sm font-medium text-teal-600 hover:text-teal-700"
            >
              Clear Fields
            </button>
            <button
              onClick={addClinicalDocumentation}
              className="px-5 py-2.5 text-sm font-medium border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 hover:border-gray-300 transition-colors shadow-sm flex items-center gap-2"
            >
              Create Record
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                <polyline points="14 2 14 8 20 8"></polyline>
                <line x1="12" y1="18" x2="12" y2="12"></line>
                <line x1="9" y1="15" x2="15" y2="15"></line>
              </svg>
            </button>
          </div>
        </FormSection>

        {/* Follow-Up Appointments */}
        <FormSection title="Follow-Up Appointments">
          <FollowUpManager
            followUpDates={document.followUpDates}
            originalFollowUpDates={originalDocument?.followUpDates}
            onChange={(followUpDates) => updateField('followUpDates', followUpDates)}
            onSave={onSave}
            patient={document}
          />
        </FormSection>
      </div>
    </div>
  );
}
