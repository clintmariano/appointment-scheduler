import React, { ReactNode } from 'react';

interface FormSectionProps {
  title: string;
  children: ReactNode;
  className?: string;
}

export function FormSection({ title, children, className = '' }: FormSectionProps) {
  return (
    <div className={`bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm ${className}`}>
      <div className="bg-gradient-to-r from-teal-500 to-cyan-500 px-4 sm:px-5 py-3 sm:py-3.5">
        <h3 className="text-sm sm:text-base font-semibold text-white">
          {title}
        </h3>
      </div>
      <div className="p-4 sm:p-5">
        {children}
      </div>
    </div>
  );
}