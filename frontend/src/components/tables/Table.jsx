import React from 'react';
import { Trash2, Edit2 } from 'lucide-react';
import Button from '../common/Button';

export default function Table({ 
  columns, 
  data, 
  onEdit, 
  onDelete,
  actions, // Para compatibilidad con sistema de tu amigo
  loading = false,
  emptyMessage = 'No hay datos disponibles'
}) {
  // Determinar si mostrar columna de acciones
  const showActions = onEdit || onDelete || (actions && actions.length > 0);

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8 bg-white rounded-lg shadow-md">
        <p className="text-gray-500">Cargando...</p>
      </div>
    );
  }
  
  return (
    <div className="overflow-x-auto rounded-lg shadow-md border border-gray-200">
      <table className="w-full min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-100 border-b border-gray-200">
          <tr>
            {columns.map((column, index) => (
              <th 
                key={column.id || column.key || index}
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                {column.label}
              </th>
            ))}
            
            {showActions && (
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                Acciones
              </th>
            )}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {data && data.length > 0 ? (
            data.map((item, rowIndex) => {
              const columnKey = (col) => col.id || col.key;
              
              return (
                <tr key={item.id || rowIndex} className="hover:bg-gray-50 transition-colors even:bg-gray-50/50">
                  {columns.map((column, colIndex) => (
                    <td 
                      key={`${item.id || rowIndex}-${columnKey(column) || colIndex}`} 
                      className="px-6 py-4 whitespace-nowrap text-sm text-gray-900"
                    >
                      {column.render ? column.render(item) : item[columnKey(column)]}
                    </td>
                  ))}
                  
                  {showActions && (
                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                      <div className="flex justify-center gap-2">
                        {/* Sistema de acciones personalizado (tu amigo) */}
                        {actions && actions.length > 0 && actions.map((action, actionIndex) => {
                          // Si hay una función show, usarla para determinar visibilidad
                          if (action.show && !action.show(item)) {
                            return null;
                          }

                          const Icon = action.icon;
                          return (
                            <Button
                              key={`${item.id || rowIndex}-action-${actionIndex}`}
                              onClick={() => action.onClick(item)}
                              variant={action.variant || 'secondary'}
                              size="sm"
                              title={action.label}
                            >
                              {Icon && <Icon size={16} />}
                            </Button>
                          );
                        })}
                        
                        {/* Sistema de botones simple (tuyo) */}
                        {!actions && onEdit && (
                          <button
                            onClick={() => onEdit(item)}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-blue-50 text-blue-700 border border-blue-200 rounded-md hover:bg-blue-100 hover:border-blue-300 transition-colors font-medium"
                            title="Editar"
                          >
                            <Edit2 size={16} />
                            Editar
                          </button>
                        )}
                        
                        {!actions && onDelete && (
                          <button
                            onClick={() => onDelete(item.id)}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-red-50 text-red-700 border border-red-200 rounded-md hover:bg-red-100 hover:border-red-300 transition-colors font-medium"
                            title="Eliminar"
                          >
                            <Trash2 size={16} />
                            Eliminar
                          </button>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              );
            })
          ) : (
            <tr>
              <td 
                colSpan={columns.length + (showActions ? 1 : 0)} 
                className="px-6 py-8 text-center text-sm text-gray-500"
              >
                {emptyMessage}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}