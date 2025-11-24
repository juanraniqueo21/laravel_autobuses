import { useState, useRef, useEffect } from 'react';
import { X, ChevronDown } from 'lucide-react';

export default function MultiSelect({ 
  label, 
  options = [], 
  value = [], // Debe ser un array
  onChange = () => {},
  required = false,
  error = '' 
}) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  // Cerrar dropdown al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleOption = (optionId) => {
    const newValue = value.includes(optionId)
      ? value.filter(id => id !== optionId) // Quitar si existe
      : [...value, optionId]; // Agregar si no existe
    
    onChange(newValue);
  };

  const removeTag = (e, optionId) => {
    e.stopPropagation();
    onChange(value.filter(id => id !== optionId));
  };

  return (
    <div className="mb-4" ref={containerRef}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label} {required && <span className="text-red-600">*</span>}
        </label>
      )}
      
      <div className="relative">
        {/* Caja principal */}
        <div 
          onClick={() => setIsOpen(!isOpen)}
          className={`w-full min-h-[42px] px-3 py-2 border rounded-lg bg-white cursor-pointer flex items-center justify-between flex-wrap gap-2 
            ${error ? 'border-red-500' : 'border-gray-300 focus-within:ring-2 focus-within:ring-blue-500'}`}
        >
          <div className="flex flex-wrap gap-2">
            {value.length === 0 && <span className="text-gray-400">Seleccionar especialidades...</span>}
            
            {value.map(selectedId => {
              const option = options.find(o => o.id === selectedId);
              if (!option) return null;
              return (
                <span key={selectedId} className="bg-blue-100 text-blue-800 text-xs font-medium px-2 py-1 rounded flex items-center gap-1">
                  {option.label}
                  <button onClick={(e) => removeTag(e, selectedId)} className="hover:text-blue-600">
                    <X size={14} />
                  </button>
                </span>
              );
            })}
          </div>
          <ChevronDown size={18} className="text-gray-500" />
        </div>

        {/* Menú desplegable */}
        {isOpen && (
          <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-auto">
            {options.map(opt => (
              <div 
                key={opt.id}
                onClick={() => toggleOption(opt.id)}
                className="px-4 py-2 hover:bg-gray-50 cursor-pointer flex items-center gap-2"
              >
                <input 
                  type="checkbox" 
                  checked={value.includes(opt.id)} 
                  onChange={() => {}} // Controlado por el div padre
                  className="rounded text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">{opt.label}</span>
              </div>
            ))}
          </div>
        )}
      </div>
      {error && <p className="text-red-600 text-sm mt-1">{error}</p>}
    </div>
  );
}