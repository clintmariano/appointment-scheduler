import React, { useRef, useState } from 'react';
import { formatDate } from '../utils/documentUtils';
import { Calendar } from 'lucide-react';

interface DateInputProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
  placeholder?: string;
  min?: string;
  max?: string;
}

export function DateInput({ value, onChange, className = '', placeholder = 'MM/DD/YYYY', min, max }: DateInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isFocused, setIsFocused] = useState(false);

  const handleClick = () => {
    if (inputRef.current) {
      // For browsers that support showPicker
      if (typeof inputRef.current.showPicker === 'function') {
        try {
          inputRef.current.showPicker();
        } catch {
          // Fallback for browsers that don't support showPicker
          inputRef.current.focus();
          inputRef.current.click();
        }
      } else {
        inputRef.current.focus();
        inputRef.current.click();
      }
    }
  };

  return (
    <div className={`relative ${className}`}>
      {/* Display field showing formatted date */}
      <div
        onClick={handleClick}
        className={`w-full px-3 py-2 border rounded-lg bg-white cursor-pointer flex items-center justify-between text-sm transition-colors ${
          isFocused
            ? 'border-teal-500 ring-2 ring-teal-500'
            : 'border-gray-200 hover:border-gray-300'
        }`}
      >
        <span className={value ? 'text-gray-900' : 'text-gray-400'}>
          {value ? formatDate(value) : placeholder}
        </span>
        <Calendar size={16} className="text-gray-400 flex-shrink-0" />
      </div>
      {/* Hidden native date input for picker functionality */}
      <input
        ref={inputRef}
        type="date"
        value={value}
        min={min}
        max={max}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        className="absolute inset-0 opacity-0 pointer-events-none w-full h-full"
        style={{ colorScheme: 'light' }}
      />
    </div>
  );
}
