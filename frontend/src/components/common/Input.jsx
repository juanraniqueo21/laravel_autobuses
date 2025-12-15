export default function Input({ 
  label, 
  type = 'text',
  placeholder = '',
  value = '',
  onChange = () => {},
  error = '',
  required = false,
  ...props 
}) {
  const safeValue = value ?? '';
  return (
    <div className="mb-4">
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label}
          {required && <span className="text-red-600">*</span>}
        </label>
      )}
      <input
        type={type}
        placeholder={placeholder}
        value={safeValue}
        onChange={onChange}
        className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${error ? 'border-red-500 ring-red-500' : ''}`}
        {...props}
      />
      {error && <p className="text-red-600 text-sm mt-1">{error}</p>}
    </div>
  );
}
