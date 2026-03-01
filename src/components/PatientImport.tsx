import React, { useState, useCallback } from 'react';
import { X, Upload, Download, FileSpreadsheet, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface PatientImportProps {
  onClose: () => void;
  onSuccess: () => void;
}

interface ImportError {
  row: { patientName: string };
  error: string;
}

interface ImportResult {
  success: boolean;
  imported: number;
  errors: number;
  errorDetails: ImportError[];
}

// CSV template headers
const CSV_HEADERS = 'patientName,birthday,gender,nickname,address,contactNumbers,guardianPhone,smsConsent,order,religion,nationality,referredBy,manner,birthplace,gestationalAge,apgar,bloodType,momBloodType,dadBloodType,birthWeight,birthLength,headCircumference,chestCircumference,abdominalCircumference,fatherName,fatherAge,fatherOccupation,motherName,motherAge,motherOccupation';

// Example CSV row
const CSV_EXAMPLE = '"Santos, Mateo",03/15/2023,M,Mateoy,"123 Main St, Manila, Philippines",09171234567,09171234567,true,1st child,Catholic,Filipino,Dr. Reyes,Normal spontaneous delivery,Makati Medical Center,39 weeks,9/10,A+,O+,O+,3.2 kg,50 cm,35 cm,33 cm,32 cm,Jose Santos,35,Engineer,Maria Santos,32,Teacher';

export function PatientImport({ onClose, onSuccess }: PatientImportProps) {
  const { getToken } = useAuth();
  const [dragActive, setDragActive] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string[][]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Handle drag events
  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  }, []);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = (selectedFile: File) => {
    if (!selectedFile.name.endsWith('.csv')) {
      setError('Please upload a CSV file');
      return;
    }

    setError(null);
    setFile(selectedFile);

    // Parse and preview first 5 rows
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const rows = text.split('\n').filter(row => row.trim());
      const previewRows = rows.slice(0, 6).map(row => parseCSVRow(row));
      setPreview(previewRows);
    };
    reader.readAsText(selectedFile);
  };

  // Parse a CSV row properly handling quoted fields with commas
  const parseCSVRow = (row: string): string[] => {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < row.length; i++) {
      const char = row[i];
      const nextChar = row[i + 1];

      if (char === '"') {
        if (inQuotes && nextChar === '"') {
          // Escaped quote inside quotes
          current += '"';
          i++; // Skip next quote
        } else {
          // Toggle quote mode
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        // Comma separator outside quotes
        result.push(current);
        current = '';
      } else {
        current += char;
      }
    }

    // Add the last field
    result.push(current);

    return result;
  };

  const handleUpload = async () => {
    if (!file) return;

    setIsUploading(true);
    setError(null);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append('csv', file);

      const response = await fetch('/api/import/patients', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${getToken()}`
        },
        body: formData
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Import failed');
      }

      setResult(data);

      if (data.imported > 0) {
        setTimeout(() => {
          onSuccess();
          onClose();
        }, 2000);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Import failed');
    } finally {
      setIsUploading(false);
    }
  };

  const downloadTemplate = () => {
    const csvContent = CSV_HEADERS + '\n' + CSV_EXAMPLE;
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'patients_template.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div>
            <h2 className="text-xl font-bold text-gray-800">Import Patients from CSV</h2>
            <p className="text-sm text-gray-500">Bulk import patient records</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Download Template */}
          <div className="bg-teal-50 border border-teal-200 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <FileSpreadsheet className="w-5 h-5 text-teal-600 mt-0.5" />
              <div className="flex-1">
                <h4 className="font-semibold text-teal-800">CSV Template</h4>
                <p className="text-sm text-teal-600 mt-1">
                  Download the template to see the required format for importing patients.
                  Use <span className="font-medium">MM/DD/YYYY</span> format for dates (e.g., 03/15/2023).
                </p>
                <button
                  onClick={downloadTemplate}
                  className="mt-3 flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors text-sm font-medium"
                >
                  <Download size={16} />
                  Download Template
                </button>
              </div>
            </div>
          </div>

          {/* Upload Area */}
          {!file && (
            <div
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
                dragActive
                  ? 'border-teal-500 bg-teal-50'
                  : 'border-gray-300 hover:border-gray-400'
              }`}
            >
              <input
                type="file"
                accept=".csv"
                onChange={handleFileInput}
                className="hidden"
                id="csv-upload"
              />
              <label htmlFor="csv-upload" className="cursor-pointer">
                <Upload className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-700 font-medium">
                  {dragActive ? 'Drop your CSV file here' : 'Drag & drop your CSV file here'}
                </p>
                <p className="text-gray-500 text-sm mt-1">or click to browse</p>
              </label>
            </div>
          )}

          {/* File Info & Preview */}
          {file && !result && (
            <div className="space-y-4">
              <div className="flex items-center justify-between bg-gray-50 rounded-lg p-3">
                <div className="flex items-center gap-3">
                  <FileSpreadsheet className="w-8 h-8 text-teal-600" />
                  <div>
                    <p className="font-medium text-gray-800">{file.name}</p>
                    <p className="text-sm text-gray-500">{(file.size / 1024).toFixed(1)} KB</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setFile(null);
                    setPreview([]);
                    setError(null);
                  }}
                  className="text-sm text-gray-500 hover:text-gray-700"
                >
                  Remove
                </button>
              </div>

              {/* Preview Table */}
              {preview.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Preview (first 5 rows)</h4>
                  <div className="border border-gray-200 rounded-lg overflow-auto max-h-64">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50 sticky top-0">
                        <tr>
                          {preview[0]?.map((header, i) => (
                            <th key={i} className="px-3 py-2 text-left font-medium text-gray-600 whitespace-nowrap">
                              {header}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {preview.slice(1, 6).map((row, i) => (
                          <tr key={i}>
                            {row.map((cell, j) => (
                              <td key={j} className="px-3 py-2 text-gray-600 whitespace-nowrap">
                                {cell}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Upload Button */}
              <button
                onClick={handleUpload}
                disabled={isUploading}
                className="w-full py-3 bg-gradient-to-r from-teal-500 to-cyan-500 text-white rounded-xl hover:from-teal-600 hover:to-cyan-600 transition-all font-medium flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Importing...
                  </>
                ) : (
                  <>
                    <Upload className="w-5 h-5" />
                    Import {preview.length - 1} Patient(s)
                  </>
                )}
              </button>
            </div>
          )}

          {/* Result */}
          {result && (
            <div className={`rounded-xl p-4 ${
              result.imported > 0 ? 'bg-green-50 border border-green-200' : 'bg-amber-50 border border-amber-200'
            }`}>
              <div className="flex items-start gap-3">
                {result.imported > 0 ? (
                  <CheckCircle className="w-6 h-6 text-green-600 mt-0.5" />
                ) : (
                  <AlertCircle className="w-6 h-6 text-amber-600 mt-0.5" />
                )}
                <div className="flex-1">
                  <h4 className={`font-semibold ${
                    result.imported > 0 ? 'text-green-800' : 'text-amber-800'
                  }`}>
                    {result.imported > 0 ? 'Import Successful' : 'Import Completed with Issues'}
                  </h4>
                  <p className={`text-sm mt-1 ${
                    result.imported > 0 ? 'text-green-600' : 'text-amber-600'
                  }`}>
                    {result.imported} patient(s) imported successfully
                    {result.errors > 0 && `, ${result.errors} row(s) skipped`}
                  </p>

                  {result.errorDetails && result.errorDetails.length > 0 && (
                    <div className="mt-3">
                      <details className="text-sm">
                        <summary className="cursor-pointer text-gray-700 hover:text-gray-900">
                          View errors ({result.errorDetails.length})
                        </summary>
                        <div className="mt-2 space-y-1 max-h-32 overflow-auto">
                          {result.errorDetails.map((err, i) => (
                            <div key={i} className="text-gray-600">
                              <span className="font-medium">{err.row.patientName}</span>: {err.error}
                            </div>
                          ))}
                        </div>
                      </details>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-red-800">Import Failed</h4>
                  <p className="text-sm text-red-600 mt-1">{error}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-6 border-t border-gray-100">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors"
            disabled={isUploading}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
