import React, { useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Upload, X, Loader2, FileImage, Eye, Trash2 } from 'lucide-react';

interface ImagingReportUploadProps {
  value: string;
  onChange: (url: string) => void;
}

export function ImagingReportUpload({ value, onChange }: ImagingReportUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showViewer, setShowViewer] = useState(false);

  const isPdf = value?.toLowerCase().endsWith('.pdf');
  const isImage = value && !isPdf;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);

    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
    if (!allowed.includes(file.type)) {
      setError('Only JPEG, PNG, WebP, or PDF files allowed');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError('File must be less than 10MB');
      return;
    }

    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const token = localStorage.getItem('auth_token');

      const response = await fetch('/api/upload/document', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Upload failed');
      }

      const data = await response.json();
      onChange(data.url);
    } catch (err) {
      console.error('Upload error:', err);
      setError(err instanceof Error ? err.message : 'Failed to upload file');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemove = () => {
    onChange('');
    setError(null);
  };

  const getFileName = (url: string) => {
    if (!url) return '';
    const parts = url.split('/');
    const filename = parts[parts.length - 1];
    // Truncate UUID prefix, show just extension hint
    if (filename.length > 40) {
      const ext = filename.split('.').pop();
      return `imaging-report.${ext}`;
    }
    return filename;
  };

  return (
    <div>
      <label className="block text-sm sm:text-xs font-medium text-gray-600 mb-1.5 sm:mb-1">
        Imaging Reports
      </label>

      {!value ? (
        // Upload area
        <div
          onClick={() => !isUploading && fileInputRef.current?.click()}
          className={`
            w-full px-3 py-2.5 sm:py-2 border border-gray-200 rounded-lg bg-gray-50
            flex items-center gap-2 cursor-pointer
            hover:border-teal-400 hover:bg-teal-50/30 transition-colors
            ${isUploading ? 'pointer-events-none opacity-60' : ''}
          `}
        >
          {isUploading ? (
            <Loader2 size={16} className="text-teal-500 animate-spin" />
          ) : (
            <Upload size={16} className="text-gray-400" />
          )}
          <span className="text-sm text-gray-400">
            {isUploading ? 'Uploading...' : 'Upload image or PDF'}
          </span>
        </div>
      ) : (
        // File uploaded - show info + actions
        <div className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 flex items-center gap-2">
          <FileImage size={16} className="text-teal-600 flex-shrink-0" />
          <span className="text-sm text-gray-700 truncate flex-1" title={value}>
            {getFileName(value)}
          </span>
          <button
            type="button"
            onClick={() => setShowViewer(true)}
            className="p-1 text-teal-600 hover:text-teal-700 hover:bg-teal-50 rounded transition-colors"
            title="View report"
          >
            <Eye size={15} />
          </button>
          <button
            type="button"
            onClick={handleRemove}
            className="p-1 text-red-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
            title="Remove"
          >
            <Trash2 size={15} />
          </button>
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,application/pdf"
        onChange={handleFileChange}
        className="hidden"
      />

      {error && (
        <span className="mt-1 block text-xs text-red-500">{error}</span>
      )}

      {/* Viewer Modal - rendered via portal to escape overflow-hidden parents */}
      {showViewer && value && createPortal(
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={() => setShowViewer(false)}
        >
          <div
            className="relative bg-white rounded-xl shadow-2xl max-w-4xl w-[95vw] max-h-[90vh] flex flex-col overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
              <h3 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
                <FileImage size={16} className="text-teal-600" />
                Imaging Report
              </h3>
              <div className="flex items-center gap-2">
                <a
                  href={value}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-teal-600 hover:text-teal-700 font-medium px-3 py-1.5 rounded-lg hover:bg-teal-50 transition-colors"
                >
                  Open in new tab
                </a>
                <button
                  onClick={() => setShowViewer(false)}
                  className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-auto p-4 bg-gray-50 flex items-center justify-center min-h-[60vh]">
              {isPdf ? (
                <iframe
                  src={value}
                  className="w-full h-full min-h-[60vh] rounded-lg border border-gray-200"
                  title="Imaging Report PDF"
                />
              ) : isImage ? (
                <img
                  src={value}
                  alt="Imaging Report"
                  className="max-w-full max-h-[75vh] object-contain rounded-lg shadow-sm"
                />
              ) : (
                <p className="text-gray-400 text-sm">Unable to preview this file</p>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
