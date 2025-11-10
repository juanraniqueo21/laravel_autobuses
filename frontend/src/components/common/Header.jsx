import { LogOut, User } from 'lucide-react';
import Button from './Button';

export default function Header({ user, onLogout }) {
  return (
    <header className="bg-white border-b shadow-sm sticky top-0 z-40">
      <div className="flex justify-between items-center px-6 py-4">
        <h1 className="text-2xl font-bold text-blue-600"></h1>
        
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-sm font-medium text-gray-900">{user?.nombre}</p>
            <p className="text-xs text-gray-500">{user?.rol?.nombre}</p>
          </div>
          <div className="flex gap-2">
            <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <User size={20} className="text-gray-600" />
            </button>
            <Button 
              variant="danger" 
              size="sm"
              onClick={onLogout}
              className="flex items-center gap-2"
            >
              <LogOut size={16} />
              Salir
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}