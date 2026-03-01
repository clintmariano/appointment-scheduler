import React from 'react';
import { DateInput } from './DateInput';

interface FormFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: 'text' | 'date' | 'textarea';
  placeholder?: string;
  required?: boolean;
  className?: string;
}

export function FormField({
  label,
  value,
  onChange,
  type = 'text',
  placeholder,
  required = false,
  className = ''
}: FormFieldProps) {
  const baseClasses = "w-full px-3 py-2.5 sm:py-2 text-base sm:text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-colors bg-gray-50";

  return (
    <div className={className}>
      <label className="block text-sm sm:text-xs font-medium text-gray-600 mb-1.5 sm:mb-1">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {type === 'textarea' ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={`${baseClasses} resize-none`}
          rows={3}
        />
      ) : type === 'date' ? (
        <DateInput
          value={value}
          onChange={onChange}
          placeholder={placeholder}
        />
      ) : (
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={baseClasses}
        />
      )}
    </div>
  );
}
