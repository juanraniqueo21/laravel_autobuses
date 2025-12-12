import React, { useState } from 'react';
import { Filter, X, RefreshCw, ChevronDown, ChevronUp } from 'lucide-react';
import { getMesNombre } from '../../utils/formatters';

/**
 * Componente de Filtros Avanzados Reutilizable
 * Soporta múltiples tipos de filtros y es completamente configurable
 */
export default function AdvancedFilters({
  filters,
  onFilterChange,
  onApplyFilters,
  onClearFilters,
  filterConfig = [],
  isCollapsed = false
}) {
  const [collapsed, setCollapsed] = useState(isCollapsed);

  const handleInputChange = (filterName, value) => {
    onFilterChange({ ...filters, [filterName]: value });
  };

  const countActiveFilters = () => {
    return Object.values(filters).filter(value =>
      value !== null && value !== undefined && value !== ''
    ).length;
  };

  const activeCount = countActiveFilters();

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6">
      {/* Header del Panel de Filtros */}
      <div
        className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50 transition-colors"
        onClick={() => setCollapsed(!collapsed)}
      >
        <div className="flex items-center gap-3">
          <Filter className="text-blue-600" size={20} />
          <h3 className="font-semibold text-gray-900">Filtros Avanzados</h3>
          {activeCount > 0 && (
            <span className="px-2.5 py-0.5 bg-blue-100 text-blue-800 text-xs font-bold rounded-full">
              {activeCount} activo{activeCount !== 1 ? 's' : ''}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {activeCount > 0 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onClearFilters();
              }}
              className="px-3 py-1.5 text-sm bg-red-50 hover:bg-red-100 text-red-700 rounded-lg transition-colors flex items-center gap-1.5"
            >
              <X size={14} />
              Limpiar
            </button>
          )}

          {collapsed ? <ChevronDown size={20} /> : <ChevronUp size={20} />}
        </div>
      </div>

      {/* Contenido de Filtros */}
      {!collapsed && (
        <div className="p-6 pt-2 border-t border-gray-100">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filterConfig.map((config) => (
              <div key={config.name}>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  {config.label}
                </label>

                {config.type === 'select' && (
                  <select
                    value={filters[config.name] || ''}
                    onChange={(e) => handleInputChange(config.name, e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                  >
                    <option value="">Todos</option>
                    {config.options.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                )}

                {config.type === 'text' && (
                  <input
                    type="text"
                    value={filters[config.name] || ''}
                    onChange={(e) => handleInputChange(config.name, e.target.value)}
                    placeholder={config.placeholder || ''}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                  />
                )}

                {config.type === 'number' && (
                  <input
                    type="number"
                    value={filters[config.name] || ''}
                    onChange={(e) => handleInputChange(config.name, e.target.value)}
                    placeholder={config.placeholder || ''}
                    min={config.min}
                    max={config.max}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                  />
                )}

                {config.type === 'date' && (
                  <input
                    type="date"
                    value={filters[config.name] || ''}
                    onChange={(e) => handleInputChange(config.name, e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                  />
                )}

                {config.type === 'month' && (
                  <select
                    value={filters[config.name] || ''}
                    onChange={(e) => handleInputChange(config.name, e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                  >
                    <option value="">Todos los meses</option>
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((m) => (
                      <option key={m} value={m}>{getMesNombre(m)}</option>
                    ))}
                  </select>
                )}

                {config.type === 'year' && (
                  <select
                    value={filters[config.name] || ''}
                    onChange={(e) => handleInputChange(config.name, e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                  >
                    <option value="">Todos los años</option>
                    {config.years.map((y) => (
                      <option key={y} value={y}>{y}</option>
                    ))}
                  </select>
                )}
              </div>
            ))}
          </div>

          {/* Botón de Aplicar Filtros */}
          <div className="mt-6 flex items-center justify-end gap-3">
            <button
              onClick={onApplyFilters}
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2 shadow-sm"
            >
              <RefreshCw size={16} />
              Aplicar Filtros
            </button>
          </div>
        </div>
      )}
    </div>
  );
}