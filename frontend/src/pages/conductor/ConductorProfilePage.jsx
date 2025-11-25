import React, { useState, useEffect } from 'react';
import { 
  User, Award, Phone, Mail, MapPin, Calendar, 
  ShieldCheck, AlertTriangle, Activity, ArrowLeft
} from 'lucide-react';
import Button from '../../components/common/Button';
import { fetchConductorDashboard } from '../../services/api';

export default function ConductorProfilePage({ onBack }) {
  const [loading, setLoading] = useState(true);
  const [conductorData, setConductorData] = useState(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        // Usamos el mismo endpoint del dashboard ya que trae toda la info del conductor
        const data = await fetchConductorDashboard();
        setConductorData(data.conductor); 
      } catch (error) {
        console.error("Error cargando perfil:", error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  if (loading) return <div className="flex justify-center items-center min-h-screen text-slate-500">Cargando perfil...</div>;
  if (!conductorData) return <div className="p-8 text-center text-red-500">No se pudo cargar la información del conductor.</div>;

  return (
    <div className="p-6 max-w-5xl mx-auto font-sans text-slate-800">
      
      {/* Header de navegación */}
      <div className="mb-6">
        <Button 
          variant="ghost" 
          onClick={() => onBack && onBack('conductor-dashboard')} // Volver al dashboard
          className="flex items-center gap-2 text-slate-500 hover:text-slate-800 pl-0"
        >
          <ArrowLeft size={20} /> Volver al Dashboard
        </Button>
      </div>

      {/* Tarjeta Principal de Perfil */}
      <div className="bg-white rounded-3xl shadow-lg border border-slate-100 overflow-hidden mb-8">
        
        {/* Banner / Fondo decorativo */}
        <div className="h-40 bg-gradient-to-r from-slate-800 to-slate-900 relative">
          <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]"></div>
        </div>

        <div className="px-8 pb-8 relative">
          
          {/* Avatar e Info Principal */}
          <div className="flex flex-col md:flex-row items-start gap-6 -mt-16">
            <div className="w-32 h-32 bg-white rounded-2xl p-2 shadow-xl">
              <div className="w-full h-full bg-slate-100 rounded-xl flex items-center justify-center text-slate-400">
                <User size={64} />
              </div>
            </div>
            
            <div className="flex-1 pt-16 md:pt-0 md:mt-20">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                  <h1 className="text-3xl font-bold text-slate-900">
                    {conductorData.nombre} {conductorData.apellido}
                  </h1>
                  <p className="text-slate-500 flex items-center gap-2 mt-1">
                    <ShieldCheck size={16} className="text-blue-500"/> 
                    Conductor Profesional • Ficha #{conductorData.numero_funcional}
                  </p>
                </div>
                
                <div className={`px-4 py-2 rounded-xl flex items-center gap-2 font-bold text-sm border ${
                  conductorData.apto_conducir 
                    ? 'bg-green-50 text-green-700 border-green-200' 
                    : 'bg-red-50 text-red-700 border-red-200'
                }`}>
                  <Activity size={18} />
                  {conductorData.apto_conducir ? 'APTO PARA CONDUCIR' : 'NO APTO'}
                </div>
              </div>
            </div>
          </div>

          {/* Grid de Datos Personales */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-10">
            
            {/* Columna 1: Contacto */}
            <div className="space-y-6">
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 border-b border-slate-100 pb-2">Contacto</h3>
              
              <div className="flex items-start gap-3">
                <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                  <Mail size={20} />
                </div>
                <div>
                  <p className="text-xs text-slate-500 font-semibold uppercase">Email</p>
                  <p className="text-slate-800 font-medium">{conductorData.email || 'No registrado'}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                  <Phone size={20} />
                </div>
                <div>
                  <p className="text-xs text-slate-500 font-semibold uppercase">Teléfono</p>
                  <p className="text-slate-800 font-medium">{conductorData.telefono || 'No registrado'}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                  <MapPin size={20} />
                </div>
                <div>
                  <p className="text-xs text-slate-500 font-semibold uppercase">Dirección</p>
                  <p className="text-slate-800 font-medium">{conductorData.direccion || 'No registrada'}</p>
                </div>
              </div>
            </div>

            {/* Columna 2: Licencia */}
            <div className="space-y-6">
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 border-b border-slate-100 pb-2">Documentación</h3>
              
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div className="flex justify-between items-start mb-2">
                  <p className="text-xs text-slate-500 font-bold uppercase">Licencia de Conducir</p>
                  <Award className="text-slate-400" size={20} />
                </div>
                <p className="text-3xl font-bold text-slate-800 mb-1">{conductorData.clase_licencia}</p>
                <p className="text-xs text-slate-500">Clase Autorizada</p>
              </div>

              <div className={`p-4 rounded-xl border ${
                new Date(conductorData.vencimiento_licencia) < new Date() ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'
              }`}>
                <div className="flex justify-between items-start mb-2">
                  <p className={`text-xs font-bold uppercase ${
                    new Date(conductorData.vencimiento_licencia) < new Date() ? 'text-red-600' : 'text-green-600'
                  }`}>Vencimiento</p>
                  <Calendar size={20} className={new Date(conductorData.vencimiento_licencia) < new Date() ? 'text-red-500' : 'text-green-500'} />
                </div>
                <p className={`text-xl font-bold mb-1 ${
                   new Date(conductorData.vencimiento_licencia) < new Date() ? 'text-red-800' : 'text-green-800'
                }`}>
                  {new Date(conductorData.vencimiento_licencia).toLocaleDateString('es-CL')}
                </p>
                {new Date(conductorData.vencimiento_licencia) < new Date() && (
                  <div className="flex items-center gap-1 text-xs text-red-600 font-bold mt-1">
                    <AlertTriangle size={12} /> Documento Vencido
                  </div>
                )}
              </div>
            </div>

            {/* Columna 3: Estado Laboral */}
            <div className="space-y-6">
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 border-b border-slate-100 pb-2">Estado Laboral</h3>
              
              <div className="flex items-center justify-between p-3 bg-white border border-slate-200 rounded-xl">
                <span className="text-slate-600 font-medium">Estado Actual</span>
                <span className={`px-3 py-1 rounded-lg text-xs font-bold uppercase ${
                  conductorData.estado === 'activo' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'
                }`}>
                  {conductorData.estado}
                </span>
              </div>

              <div className="p-4 bg-slate-50 rounded-xl text-sm text-slate-600 border border-slate-200">
                <p className="font-bold text-slate-800 mb-2">Notas del Sistema:</p>
                <p>
                  El conductor se encuentra habilitado para realizar servicios de transporte de pasajeros. 
                  Última actualización de estado realizada por administración.
                </p>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}