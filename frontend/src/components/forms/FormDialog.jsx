import Button from '../common/Button';

export default function FormDialog({ 
  isOpen, 
  title, 
  children,
  onSubmit, 
  onCancel,
  loading = false,
  size = 'default' // Agregamos soporte para tamaño
}) {
  if (!isOpen) return null;
  
  const handleSubmit = (e) => {
    e.preventDefault();
    e.stopPropagation();
    onSubmit(e);
  };
  
  const maxWidthClass = size === 'large' ? 'max-w-5xl' : 'max-w-2xl';
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className={`bg-white rounded-lg shadow-xl ${maxWidthClass} w-full mx-4 max-h-[90vh] overflow-y-auto`}>
        {/* Header */}
        <div className="sticky top-0 bg-gray-50 border-b px-6 py-4 z-10">
          <h2 className="text-xl font-bold text-gray-900">{title}</h2>
        </div>
        
        {/* Content */}
        <div className="p-6 space-y-4">
          {children}
        </div>
        
        {/* Footer */}
        <div className="sticky bottom-0 bg-gray-50 border-t px-6 py-4 flex justify-end gap-3 z-10">
          <Button 
            variant="secondary" 
            onClick={onCancel}
            type="button"
          >
            Cancelar
          </Button>
          <Button 
            variant="primary" 
            onClick={handleSubmit}
            disabled={loading}
            type="button"
          >
            {loading ? 'Guardando...' : 'Guardar'}
          </Button>
        </div>
      </div>
    </div>
  );
}