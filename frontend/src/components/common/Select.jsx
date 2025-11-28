import React from 'react';

export default function Select({ 
  label, 
  options = [], 
  value = '', 
  onChange = () => {},
  required = false,
  error = '',
  children,
  disabled = false,
  showDefaultOption = true,
  ...props 
}) {
  return (
    <div className="mb-4">
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label}
          {required && <span className="text-red-600">*</span>}
        </label>
      )}
      <select
        value={value}
        onChange={onChange}
        disabled={disabled}
        className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent cursor-pointer disabled:bg-gray-100 disabled:cursor-not-allowed ${error ? 'border-red-500' : ''}`}
        {...props}
      >
        {children ? children : (
          <>
            {showDefaultOption && <option value="">Seleccionar...</option>}
            {options.map(opt => (
              <option key={opt.id} value={opt.id}>
                {opt.label}
              </option>
            ))}
          </>
        )}
      </select>
      {error && <p className="text-red-600 text-sm mt-1">{error}</p>}
    </div>
  );
}