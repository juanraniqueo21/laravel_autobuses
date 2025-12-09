import React from 'react';
import Button from './Button';
import { CheckCircle, XCircle, Info } from 'lucide-react';

export default function AlertDialog({ 
  isOpen, 
  title, 
  message, 
  onClose, 
  type = 'success', // 'success' | 'error' | 'info'
  btnText = 'Aceptar'
}) {
  if (!isOpen) return null;

  const icons = {
    success: <CheckCircle className="h-10 w-10 text-green-500" />,
    error: <XCircle className="h-10 w-10 text-red-500" />,
    info: <Info className="h-10 w-10 text-blue-500" />
  };

  const bgColors = {
    success: 'bg-green-50',
    error: 'bg-red-50',
    info: 'bg-blue-50'
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl max-w-sm w-full mx-4 overflow-hidden animate-fade-in-up">
        <div
          className={`mx-auto flex items-center justify-center h-20 w-20 rounded-full mb-4 ${bgColors[type]}`}
        >
          {icons[type]}
        </div>
        <div className="p-6 text-center">
          <h3 className="text-xl font-bold text-gray-900 mb-2">
            {title}
          </h3>
          <p className="text-gray-600 text-sm leading-relaxed">
            {message}
          </p>
        </div>
        <div className="bg-gray-50 px-6 py-4 border-t border-gray-100">
          <Button 
            variant="primary" 
            onClick={onClose}
            className="w-full justify-center"
          >
            {btnText}
          </Button>
        </div>
      </div>
    </div>
  );
}
