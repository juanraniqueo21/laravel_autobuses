import { Trash2, Edit2 } from 'lucide-react';

export default function Table({ 
  columns, 
  data, 
  onEdit, 
  onDelete,
  loading = false 
}) {
  if (loading) {
    return (
      <div className="flex justify-center items-center p-8 bg-white rounded-lg shadow-md">
        <p className="text-gray-500">Cargando...</p>
      </div>
    );
  }
  
  return (
    // 1. Contenedor con borde y sombra
    <div className="overflow-x-auto rounded-lg shadow-md border border-gray-200">
      <table className="w-full">
        {/* 2. Cabecera estandarizada */}
        <thead className="bg-gray-100 border-b border-gray-200">
          <tr>
            {columns.map(col => (
              <th 
                key={col.id}
                className="px-6 py-3 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider"
              >
                {col.label}
              </th>
            ))}
            <th className="px-6 py-3 text-center text-sm font-semibold text-gray-700 uppercase tracking-wider">
              Acciones
            </th>
          </tr>
        </thead>
        {/* 3. Cuerpo de tabla con división de líneas */}
        <tbody className="bg-white divide-y divide-gray-200">
          {data.length === 0 ? (
            <tr>
              <td colSpan={columns.length + 1} className="px-6 py-8 text-center text-gray-500">
                No hay datos disponibles
              </td>
            </tr>
          ) : (
            data.map((row, idx) => (
              // 4. Filas con efecto Zebra y hover
              <tr key={idx} className="hover:bg-gray-100 transition-colors even:bg-gray-50">
                {columns.map(col => (
                  <td key={col.id} className="px-6 py-4 text-sm text-gray-800 whitespace-nowrap">
                    {col.render ? col.render(row) : row[col.id]}
                  </td>
                ))}
                {/* 5. Celda de botones corregida (con ÍCONO y TEXTO) */}
                <td className="px-6 py-4 text-center whitespace-nowrap">
                  <div className="flex justify-center gap-2">
                    {/* Botón Editar (Icono + Texto) */}
                    <button
                      onClick={() => onEdit(row)}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-sm
                                 bg-blue-50 text-blue-700 border border-blue-200 
                                 rounded-md hover:bg-blue-100 hover:border-blue-300
                                 transition-colors font-medium"
                      title="Editar"
                    >
                      <Edit2 size={16} />
                      Editar
                    </button>
                    {/* Botón Eliminar (Icono + Texto) */}
                    <button
                      onClick={() => onDelete(row.id)}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-sm
                                 bg-red-50 text-red-700 border border-red-200
                                 rounded-md hover:bg-red-100 hover:border-red-300
                                 transition-colors font-medium"
                      title="Eliminar"
                    >
                      <Trash2 size={16} />
                      Eliminar
                    </button>
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}