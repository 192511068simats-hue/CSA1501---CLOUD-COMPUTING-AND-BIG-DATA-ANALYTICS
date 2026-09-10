import React, { forwardRef } from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  icon?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, icon, className = '', id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-medium text-navy-700 mb-1.5"
          >
            {label}
          </label>
        )}
        <div className="relative">
          {icon && (
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-navy-400">
              {icon}
            </div>
          )}
          <input
            ref={ref}
            id={inputId}
            className={`w-full rounded-lg border bg-white px-3.5 py-2.5 text-sm text-navy-900 placeholder:text-navy-400 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
              icon ? 'pl-10' : ''
            } ${
              error
                ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                : 'border-navy-200 hover:border-navy-300'
            } ${className}`}
            {...props}
          />
        </div>
        {error && <p className="mt-1.5 text-sm text-red-600">{error}</p>}
        {helperText && !error && (
          <p className="mt-1.5 text-sm text-navy-500">{helperText}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
