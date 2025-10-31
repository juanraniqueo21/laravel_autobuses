import { BarChart3, Users, Bus, MapPin, Zap, Settings, Briefcase, Users2, Wrench, TrendingUp } from 'lucide-react';

const menuItems = [
  { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
  { id: 'roles', label: 'Roles', icon: Briefcase },
  { id: 'usuarios', label: 'Usuarios', icon: Users },
  { id: 'empleados', label: 'Empleados', icon: Users2 },
  { id: 'conductores', label: 'Conductores', icon: Bus },
  { id: 'asistentes', label: 'Asistentes', icon: Briefcase },
  { id: 'mecanicos', label: 'Mecánicos', icon: Wrench },
  { id: 'buses', label: 'Buses', icon: Bus },
  { id: 'rutas', label: 'Rutas', icon: MapPin },
  { id: 'viajes', label: 'Viajes', icon: Zap },
  { id: 'mantenimientos', label: 'Mantenimientos', icon: Wrench },
  { id: 'logistica', label: 'Logística', icon: TrendingUp },
];

export default function Sidebar({ current, onSelect }) {
  return (
    <aside className="w-64 bg-gray-900 text-white p-6 fixed h-screen overflow-y-auto">
      <div className="mb-8">
        <h2 className="text-xl font-bold">Menú</h2>
      </div>
      
      <nav className="space-y-2">
        {menuItems.map(item => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => onSelect(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors text-left ${
                current === item.id
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-400 hover:bg-gray-800'
              }`}
            >
              <Icon size={20} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>
    </aside>
  );
}