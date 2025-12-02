import React, { useState, useEffect } from 'react';
import { 
  User, Award, Phone, Mail, MapPin, Calendar, 
  ShieldCheck, Activity, ArrowLeft, Wrench, PenTool
} from 'lucide-react';
import Button from '../../components/common/Button';
import { fetchMecanicoDashboard } from '../../services/api';

export default function MecanicoProfilePage({ onBack }) {
  const [loading, setLoading] = useState(true);
  const [mecanicoData, setMecanicoData] = useState(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const data = await fetchMecanicoDashboard();
        setMecanicoData(data.mecanico);
      } catch (error) {
        console.error("Error cargando perfil:", error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen text-slate-500">
        Cargando perfil...
      </div>
    );
  }

  if (!mecanicoData) {
    return (
      <div className="p-8 text-center text-red-500">
        No se pudo cargar la información del mecánico.
      </div>
    );
  }

  return (
    <div className="p-6 max-w-5xl mx-auto font-sans text-slate-800">
      
      {/* Header de navegación */}
      <div className="mb-6">
        <Button 
          variant="ghost" 
          onClick={() => onBack && onBack('mecanico-dashboard')}
          className="flex items-center gap-2 text-slate-500 hover:text-slate-800 pl-0"
        >
          <ArrowLeft size={20} /> Volver al Dashboard
        </Button>
      </div>

      {/* Tarjeta Principal de Perfil */}
      <div className="bg-white rounded-3xl shadow-lg border border-slate-100 overflow-hidden mb-8">
        
        {/* Banner / Fondo decorativo */}
        <div className="h-40 bg-gradient-to-r from-slate-800 to-blue-900 relative">
          <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]"></div>
        </div>

        <div className="px-8 pb-8 relative">
          
          {/* Avatar e Info Principal */}
          <div className="flex flex-col md:flex-row items-start gap-6 -mt-16">
            <div className="w-32 h-32 bg-white rounded-2xl p-2 shadow-xl">
              <div className="w-full h-full bg-slate-100 rounded-xl flex items-center justify-center text-slate-400">
                <Wrench size={64} />
              </div>
            </div>
            
            <div className="flex-1 pt-16 md:pt-0 md:mt-20">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                  <h1 className="text-3xl font-bold text-slate-900">
                    {mecanicoData.nombre}
                  </h1>
                  <p className="text-slate-500 flex items-center gap-2 mt-1">
                    <ShieldCheck size={16} className="text-blue-500"/> 
                    Mecánico Profesional • Ficha #{mecanicoData.empleado?.numero_funcional}
                  </p>
                </div>
                
                <div className={`px-4 py-2 rounded-xl flex items-center gap-2 font-bold text-sm border ${
                  mecanicoData.estado === 'activo'
                    ? 'bg-green-50 text-green-700 border-green-200' 
                    : 'bg-red-50 text-red-700 border-red-200'
                }`}>
                  <Activity size={18} />
                  {mecanicoData.estado === 'activo' ? 'PERSONAL ACTIVO' : 'INACTIVO'}
                </div>
              </div>
            </div>
          </div>

          {/* Grid de Datos Personales */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-10">
            
            {/* Columna 1: Contacto */}
            <div className="space-y-6">
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 border-b border-slate-100 pb-2">
                Contacto
              </h3>
              
              <div className="flex items-start gap-3">
                <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                  <Mail size={20} />
                </div>
                <div>
                  <p className="text-xs text-slate-500 font-semibold uppercase">Email</p>
                  <p className="text-slate-800 font-medium">
                    {mecanicoData.email || 'No registrado'}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                  <Phone size={20} />
                </div>
                <div>
                  <p className="text-xs text-slate-500 font-semibold uppercase">Teléfono</p>
                  <p className="text-slate-800 font-medium">
                    {mecanicoData.telefono || 'No registrado'}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                  <MapPin size={20} />
                </div>
                <div>
                  <p className="text-xs text-slate-500 font-semibold uppercase">Dirección</p>
                  <p className="text-slate-800 font-medium">
                    {mecanicoData.direccion || 'No registrada'}
                  </p>
                </div>
              </div>
            </div>

            {/* Columna 2: Datos Técnicos */}
            <div className="space-y-6">
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 border-b border-slate-100 pb-2">
                Perfil Técnico
              </h3>
              
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div className="flex justify-between items-start mb-2">
                  <p className="text-xs text-slate-500 font-bold uppercase">N° Certificación</p>
                  <Award className="text-slate-400" size={20} />
                </div>
                <p className="text-3xl font-bold text-slate-800 mb-1">
                  {mecanicoData.numero_certificacion || '---'}
                </p>
                <p className="text-xs text-slate-500">Registro Profesional</p>
              </div>

              {/* Especialidades */}
              <div className="bg-white p-4 rounded-xl border border-gray-200">
                 <div className="flex items-center gap-2 mb-3">
                    <PenTool size={18} className="text-blue-500"/>
                    <p className="text-sm font-bold text-slate-700">Especialidades</p>
                 </div>
                 <div className="flex flex-wrap gap-2">
                    {Array.isArray(mecanicoData.especialidad) ? (
                        mecanicoData.especialidad.map((esp, idx) => (
                            <span key={idx} className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-medium border border-blue-100">
                                {esp}
                            </span>
                        ))
                    ) : (
                        <span className="px-3 py-1 bg-gray-50 text-gray-600 rounded-full text-xs font-medium">
                           {mecanicoData.especialidad || 'General'}
                        </span>
                    )}
                 </div>
              </div>

              {mecanicoData.fecha_examen_ocupacional && (
                <div className="p-4 rounded-xl border bg-green-50 border-green-200">
                  <div className="flex justify-between items-start mb-2">
                    <p className="text-xs font-bold uppercase text-green-600">
                      Examen Ocupacional
                    </p>
                    <Calendar size={20} className="text-green-500" />
                  </div>
                  <p className="text-xl font-bold mb-1 text-green-800">
                    {new Date(mecanicoData.fecha_examen_ocupacional).toLocaleDateString('es-CL')}
                  </p>
                </div>
              )}
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}