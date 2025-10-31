import Button from '../common/Button';

export default function FormDialog({ 
  isOpen, 
  title, 
  children,
  onSubmit, 
  onCancel,
  loading = false 
}) {
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gray-50 border-b px-6 py-4">
          <h2 className="text-xl font-bold text-gray-900">{title}</h2>
        </div>
        
        {/* Content */}
        <form onSubmit={onSubmit} className="p-6 space-y-4">
          {children}
        </form>
        
        {/* Footer */}
        <div className="sticky bottom-0 bg-gray-50 border-t px-6 py-4 flex justify-end gap-3">
          <Button variant="secondary" onClick={onCancel}>
            Cancelar
          </Button>
          <Button 
            variant="primary" 
            onClick={onSubmit}
            disabled={loading}
          >
            {loading ? 'Guardando...' : 'Guardar'}
          </Button>
        </div>
      </div>
    </div>
  );
}