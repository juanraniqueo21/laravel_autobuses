import React, { useState, useEffect } from 'react';
import { 
  User, Phone, Mail, MapPin, Briefcase, 
  ShieldCheck, Activity, ArrowLeft
} from 'lucide-react';
import Button from '../../components/common/Button';
import { fetchAsistenteDashboard } from '../../services/api';

export default function AsistenteProfilePage({ onBack }) {
  const [loading, setLoading] = useState(true);
  const [asistenteData, setAsistenteData] = useState(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        // Reutilizamos el endpoint del dashboard que trae la info del usuario
        const data = await fetchAsistenteDashboard();
        setAsistenteData(data.asistente); 
      } catch (error) {
        console.error("Error cargando perfil:", error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  if (loading) return <div className="flex justify-center items-center min-h-screen text-slate-500">Cargando perfil...</div>;
  if (!asistenteData) return <div className="p-8 text-center text-red-500">No se pudo cargar la información del asistente.</div>;

  return (
    <div className="p-6 max-w-5xl mx-auto font-sans text-slate-800">
      
      {/* Header de navegación */}
      <div className="mb-6">
        <Button 
          variant="ghost" 
          onClick={() => onBack && onBack('asistente-dashboard')} // Volver al dashboard
          className="flex items-center gap-2 text-slate-500 hover:text-slate-800 pl-0"
        >
          <ArrowLeft size={20} /> Volver al Dashboard
        </Button>
      </div>

      {/* Tarjeta Principal de Perfil */}
      <div className="bg-white rounded-3xl shadow-lg border border-slate-100 overflow-hidden mb-8">
        
        {/* Banner / Fondo decorativo (Verde para Asistente) */}
        <div className="h-40 bg-gradient-to-r from-slate-800 to-emerald-900 relative">
          <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]"></div>
        </div>

        <div className="px-8 pb-8 relative">
          
          {/* Avatar e Info Principal */}
          <div className="flex flex-col md:flex-row items-start gap-6 -mt-16">
            <div className="w-32 h-32 bg-white rounded-2xl p-2 shadow-xl">
              <div className="w-full h-full bg-slate-100 rounded-xl flex items-center justify-center text-slate-400">
                <Briefcase size={64} />
              </div>
            </div>
            
            <div className="flex-1 pt-16 md:pt-0 md:mt-20">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                  <h1 className="text-3xl font-bold text-slate-900">
                    {asistenteData.nombre} {asistenteData.apellido}
                  </h1>
                  <p className="text-slate-500 flex items-center gap-2 mt-1">
                    <ShieldCheck size={16} className="text-emerald-600"/> 
                    Asistente de Bus • Ficha #{asistenteData.numero_funcional}
                  </p>
                </div>
                
                <div className={`px-4 py-2 rounded-xl flex items-center gap-2 font-bold text-sm border ${
                  asistenteData.estado === 'activo'
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                    : 'bg-slate-50 text-slate-700 border-slate-200'
                }`}>
                  <Activity size={18} />
                  {asistenteData.estado === 'activo' ? 'PERSONAL ACTIVO' : 'INACTIVO'}
                </div>
              </div>
            </div>
          </div>

          {/* Grid de Datos Personales */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-10">
            
            {/* Columna 1: Contacto */}
            <div className="space-y-6">
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 border-b border-slate-100 pb-2">Contacto</h3>
              
              <div className="flex items-start gap-3">
                <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
                  <Mail size={20} />
                </div>
                <div>
                  <p className="text-xs text-slate-500 font-semibold uppercase">Email</p>
                  <p className="text-slate-800 font-medium">{asistenteData.email || 'No registrado'}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
                  <Phone size={20} />
                </div>
                <div>
                  <p className="text-xs text-slate-500 font-semibold uppercase">Teléfono</p>
                  <p className="text-slate-800 font-medium">{asistenteData.telefono || 'No registrado'}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
                  <MapPin size={20} />
                </div>
                <div>
                  <p className="text-xs text-slate-500 font-semibold uppercase">Dirección</p>
                  <p className="text-slate-800 font-medium">{asistenteData.direccion || 'No registrada'}</p>
                </div>
              </div>
            </div>

            {/* Columna 2: Información Laboral */}
            <div className="space-y-6">
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 border-b border-slate-100 pb-2">Información Laboral</h3>
              
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div className="flex justify-between items-start mb-2">
                  <p className="text-xs text-slate-500 font-bold uppercase">Rol en Sistema</p>
                  <User className="text-slate-400" size={20} />
                </div>
                <p className="text-2xl font-bold text-slate-800 mb-1">Asistente</p>
                <p className="text-xs text-slate-500">Personal de apoyo en ruta</p>
              </div>

              <div className="p-4 bg-emerald-50/50 rounded-xl text-sm text-slate-600 border border-emerald-100">
                <p className="font-bold text-emerald-800 mb-2">Estado:</p>
                <p>
                  El asistente se encuentra habilitado para realizar funciones de apoyo en servicios de transporte.
                </p>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}