import React from 'react';
import Button from './Button'; // Reutilizamos tu botÃ³n existente
import { AlertTriangle, HelpCircle } from 'lucide-react';

export default function ConfirmDialog({ 
  isOpen, 
  title, 
  message, 
  onConfirm, 
  onCancel, 
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  type = 'danger', // 'danger' | 'info' | 'warning'
  loading = false
}) {
  if (!isOpen) return null;

  const isDanger = type === 'danger';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] backdrop-blur-sm transition-opacity">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full mx-4 overflow-hidden transform transition-all scale-100">
        
        {/* Icono y Header */}
        <div className="p-6 text-center">
          <div className={`mx-auto flex items-center justify-center h-16 w-16 rounded-full mb-4 ${isDanger ? 'bg-red-100' : 'bg-blue-100'}`}>
            {isDanger ? (
              <AlertTriangle className={`h-8 w-8 ${isDanger ? 'text-red-600' : 'text-blue-600'}`} />
            ) : (
              <HelpCircle className="h-8 w-8 text-blue-600" />
            )}
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">
            {title}
          </h3>
          <p className="text-sm text-gray-500 leading-relaxed">
            {message}
          </p>
        </div>

        {/* Footer con Botones */}
        <div className="bg-gray-50 px-6 py-4 flex flex-col sm:flex-row gap-3 justify-end border-t border-gray-100">
          <Button 
            variant="secondary" 
            onClick={onCancel}
            disabled={loading}
            className="w-full sm:w-auto justify-center"
          >
            {cancelText}
          </Button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className={`inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-white rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 w-full sm:w-auto transition-colors ${
              isDanger 
                ? 'bg-red-600 hover:bg-red-700 focus:ring-red-500' 
                : 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500'
            } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {loading ? 'Procesando...' : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}