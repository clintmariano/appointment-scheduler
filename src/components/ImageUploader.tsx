import React, { useState, useRef } from 'react';
import { Upload, Camera, X, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import Tesseract from 'tesseract.js';
import { PatientDocument } from '../types';

interface ImageUploaderProps {
  onDataExtracted: (data: Partial<PatientDocument>) => void;
  isProcessing: boolean;
  onProcessingChange: (processing: boolean) => void;
}

export function ImageUploader({ onDataExtracted, isProcessing, onProcessingChange }: ImageUploaderProps) {
  const [dragActive, setDragActive] = useState(false);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [extractionStatus, setExtractionStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');
  const [progress, setProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const imageUrl = e.target?.result as string;
      setUploadedImage(imageUrl);
      processImage(imageUrl);
    };
    reader.readAsDataURL(file);
  };

  const processImage = async (imageUrl: string) => {
    setExtractionStatus('processing');
    setProgress(0);
    onProcessingChange(true);

    try {
      const result = await Tesseract.recognize(imageUrl, 'eng', {
        logger: (m) => {
          if (m.status === 'recognizing text') {
            setProgress(Math.round(m.progress * 100));
          }
        }
      });

      const extractedText = result.data.text;
      const extractedData = parseExtractedText(extractedText);
      
      onDataExtracted(extractedData);
      setExtractionStatus('success');
      
      // Auto-hide success message after 3 seconds
      setTimeout(() => {
        setExtractionStatus('idle');
      }, 3000);
      
    } catch (error) {
      console.error('OCR Error:', error);
      setExtractionStatus('error');
      setTimeout(() => {
        setExtractionStatus('idle');
      }, 3000);
    } finally {
      onProcessingChange(false);
      setProgress(0);
    }
  };

  const parseExtractedText = (text: string): Partial<PatientDocument> => {
    const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    const extractedData: Partial<PatientDocument> = {};

    // Helper function to find value after a label
    const findValueAfterLabel = (label: string): string => {
      const regex = new RegExp(`${label}[:\\s]*([^\\n\\r]+)`, 'i');
      const match = text.match(regex);
      return match ? match[1].trim() : '';
    };

    // Helper function to extract date
    const extractDate = (dateStr: string): string => {
      const dateMatch = dateStr.match(/(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{4})/);
      if (dateMatch) {
        const [, month, day, year] = dateMatch;
        return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
      }
      return '';
    };

    // Extract patient name
    const patientName = findValueAfterLabel("PATIENT'S NAME") || findValueAfterLabel("NAME");
    if (patientName) {
      extractedData.patientName = patientName.replace(/[^\w\s]/g, '').trim();
    }

    // Extract birthday
    const birthday = findValueAfterLabel("BIRTHDAY") || findValueAfterLabel("DOB") || findValueAfterLabel("DATE OF BIRTH");
    if (birthday) {
      const formattedDate = extractDate(birthday);
      if (formattedDate) {
        extractedData.birthday = formattedDate;
      }
    }

    // Extract gender
    const genderText = text.toLowerCase();
    if (genderText.includes('gender') || genderText.includes('sex')) {
      if (genderText.includes('male') && !genderText.includes('female')) {
        extractedData.gender = 'M';
      } else if (genderText.includes('female')) {
        extractedData.gender = 'F';
      }
    }

    // Extract nickname
    const nickname = findValueAfterLabel("NICKNAME");
    if (nickname) {
      extractedData.nickname = nickname.replace(/[^\w\s]/g, '').trim();
    }

    // Extract address
    const address = findValueAfterLabel("ADDRESS");
    if (address) {
      extractedData.address = address.trim();
    }

    // Extract contact numbers
    const contactNumbers = findValueAfterLabel("CONTACT NUMBERS") || findValueAfterLabel("PHONE") || findValueAfterLabel("CONTACT");
    if (contactNumbers) {
      extractedData.contactNumbers = contactNumbers.trim();
    }

    // Extract religion
    const religion = findValueAfterLabel("RELIGION");
    if (religion) {
      extractedData.religion = religion.replace(/[^\w\s]/g, '').trim();
    }

    // Extract nationality
    const nationality = findValueAfterLabel("NATIONALITY");
    if (nationality) {
      extractedData.nationality = nationality.replace(/[^\w\s]/g, '').trim();
    }

    // Extract referred by
    const referredBy = findValueAfterLabel("REFERRED BY");
    if (referredBy) {
      extractedData.referredBy = referredBy.trim();
    }

    // Extract birth information
    const birthplace = findValueAfterLabel("BIRTHPLACE");
    if (birthplace) {
      extractedData.birthplace = birthplace.trim();
    }

    const manner = findValueAfterLabel("MANNER");
    if (manner) {
      extractedData.manner = manner.trim();
    }

    const gestationalAge = findValueAfterLabel("GESTATIONAL AGE");
    if (gestationalAge) {
      extractedData.gestationalAge = gestationalAge.trim();
    }

    const apgar = findValueAfterLabel("APGAR");
    if (apgar) {
      extractedData.apgar = apgar.trim();
    }

    // Extract parent information
    const fatherName = findValueAfterLabel("FATHER");
    if (fatherName) {
      extractedData.fatherName = fatherName.replace(/[^\w\s]/g, '').trim();
    }

    const motherName = findValueAfterLabel("MOTHER");
    if (motherName) {
      extractedData.motherName = motherName.replace(/[^\w\s]/g, '').trim();
    }

    return extractedData;
  };

  const clearImage = () => {
    setUploadedImage(null);
    setExtractionStatus('idle');
    setProgress(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="font-semibold text-gray-900 flex items-center gap-2">
          <Camera size={18} />
          Image Recognition
        </h4>
        {uploadedImage && (
          <button
            onClick={clearImage}
            className="text-gray-500 hover:text-gray-700 p-1"
            disabled={isProcessing}
          >
            <X size={16} />
          </button>
        )}
      </div>

      {!uploadedImage ? (
        <div
          className={`relative border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
            dragActive
              ? 'border-blue-400 bg-blue-50'
              : 'border-gray-300 hover:border-gray-400'
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileInput}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />
          <Upload className="mx-auto mb-4 text-gray-400" size={48} />
          <p className="text-lg font-medium text-gray-900 mb-2">
            Upload Medical Form Image
          </p>
          <p className="text-sm text-gray-600 mb-4">
            Drag and drop an image here, or click to select a file
          </p>
          <p className="text-xs text-gray-500">
            Supports JPG, PNG, GIF up to 10MB
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="relative">
            <img
              src={uploadedImage}
              alt="Uploaded medical form"
              className="w-full max-h-64 object-contain rounded-lg border border-gray-200"
            />
          </div>

          {extractionStatus === 'processing' && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <Loader2 className="animate-spin text-blue-600" size={20} />
                <div className="flex-1">
                  <p className="text-sm font-medium text-blue-900">
                    Processing image... {progress}%
                  </p>
                  <div className="w-full bg-blue-200 rounded-full h-2 mt-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {extractionStatus === 'success' && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <CheckCircle className="text-green-600" size={20} />
                <p className="text-sm font-medium text-green-900">
                  Patient information extracted successfully!
                </p>
              </div>
            </div>
          )}

          {extractionStatus === 'error' && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <AlertCircle className="text-red-600" size={20} />
                <p className="text-sm font-medium text-red-900">
                  Failed to extract information. Please try again or enter manually.
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="text-xs text-gray-500 bg-gray-50 rounded-lg p-3">
        <p className="font-medium mb-1">Tips for better recognition:</p>
        <ul className="space-y-1">
          <li>• Ensure the image is clear and well-lit</li>
          <li>• Make sure text is not blurry or distorted</li>
          <li>• Crop the image to focus on the form content</li>
          <li>• Review and verify extracted information before saving</li>
        </ul>
      </div>
    </div>
  );
}