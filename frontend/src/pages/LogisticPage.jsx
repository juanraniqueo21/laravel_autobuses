import React from 'react';
import Button from '../components/common/Button';

export default function LogisticPage() {
  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Logística</h1>
        <p className="text-gray-600 mt-2">Análisis de viajes e ingresos</p>
      </div>

      {/* Gráfico Principal */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="lg:col-span-2 bg-white rounded-lg shadow-md p-6">
          <h2 className="text-lg font-bold mb-4">Viajes por Día (Este Mes)</h2>
          <div className="h-64 bg-gray-100 rounded flex items-center justify-center">
            <p className="text-gray-500">Gráfico con Recharts (próximo paso)</p>
          </div>
        </div>

        {/* Resumen Lateral */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-lg font-bold mb-4">Resumen del Mes</h2>
          <div className="space-y-4">
            <div className="p-3 bg-blue-50 rounded">
              <p className="text-sm text-gray-600">Total Ingresos</p>
              <p className="text-2xl font-bold text-blue-600">$45,600</p>
            </div>
            <div className="p-3 bg-green-50 rounded">
              <p className="text-sm text-gray-600">Viajes Completados</p>
              <p className="text-2xl font-bold text-green-600">128</p>
            </div>
            <div className="p-3 bg-yellow-50 rounded">
              <p className="text-sm text-gray-600">Promedio por Viaje</p>
              <p className="text-2xl font-bold text-yellow-600">$356</p>
            </div>
          </div>
        </div>
      </div>

      {/* Gráficos Secundarios */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-lg font-bold mb-4">Viajes por Ruta</h2>
          <div className="h-48 bg-gray-100 rounded flex items-center justify-center">
            <p className="text-gray-500">Gráfico (próximo)</p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-lg font-bold mb-4">Desempeño de Conductores</h2>
          <div className="h-48 bg-gray-100 rounded flex items-center justify-center">
            <p className="text-gray-500">Gráfico (próximo)</p>
          </div>
        </div>
      </div>

      {/* Botones */}
      <div className="mt-8 flex gap-4">
        <Button variant="primary" size="lg">
          Exportar Reporte
        </Button>
        <Button variant="outline" size="lg">
          Volver al Dashboard
        </Button>
      </div>
    </div>
  );
}