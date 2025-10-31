import { Trash2, Edit2 } from 'lucide-react';

export default function Table({ 
  columns, 
  data, 
  onEdit, 
  onDelete,
  loading = false 
}) {
  if (loading) {
    return <div className="flex justify-center p-8">Cargando...</div>;
  }
  
  return (
    <div className="overflow-x-auto bg-white rounded-lg shadow-md">
      <table className="w-full">
        <thead className="bg-gray-100 border-b">
          <tr>
            {columns.map(col => (
              <th 
                key={col.id}
                className="px-6 py-3 text-left text-sm font-semibold text-gray-700"
              >
                {col.label}
              </th>
            ))}
            <th className="px-6 py-3 text-center text-sm font-semibold text-gray-700">
              Acciones
            </th>
          </tr>
        </thead>
        <tbody>
          {data.length === 0 ? (
            <tr>
              <td colSpan={columns.length + 1} className="px-6 py-8 text-center text-gray-500">
                No hay datos
              </td>
            </tr>
          ) : (
            data.map((row, idx) => (
              <tr key={idx} className="border-b hover:bg-gray-50 transition-colors">
                {columns.map(col => (
                  <td key={col.id} className="px-6 py-4 text-sm">
                    {col.render ? col.render(row) : row[col.id]}
                  </td>
                ))}
                <td className="px-6 py-4 text-center">
                  <div className="flex justify-center gap-2">
                    <button
                      onClick={() => onEdit(row)}
                      className="p-2 hover:bg-blue-100 rounded-lg transition-colors"
                      title="Editar"
                    >
                      <Edit2 size={18} className="text-blue-600" />
                    </button>
                    <button
                      onClick={() => onDelete(row.id)}
                      className="p-2 hover:bg-red-100 rounded-lg transition-colors"
                      title="Eliminar"
                    >
                      <Trash2 size={18} className="text-red-600" />
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