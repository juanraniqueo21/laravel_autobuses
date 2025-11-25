import React, { useState } from "react";
import { login } from '../services/api';
import { KeyRound, Mail, Bus } from 'lucide-react';

export default function LoginPage({ onLoginSuccess }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const validate = () => {
    const newErrors = {};
    if (!email) newErrors.email = "El correo es requerido";
    else if (!/\S+@\S+\.\S+/.test(email)) newErrors.email = "Correo inválido";
    if (!password) newErrors.password = "La contraseña es requerida";
    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError(null);
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    setErrors({});
    setSubmitting(true);

    try {
      const data = await login(email, password);
      if (data.success) {
        await new Promise(resolve => setTimeout(resolve, 500));
        onLoginSuccess(data.user);
      } else {
        setServerError(data.message || "Credenciales incorrectas");
      }
    } catch (error) {
      setServerError(error.message || "Error de conexión con el servidor");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      
      <div className="bg-slate-900/90 backdrop-blur-xl p-8 rounded-3xl shadow-2xl border border-white/10 w-full max-w-md relative overflow-hidden">
        

        <div className="text-center mb-8">
          <div className="flex justify-center items-center mb-6">
          </div>
          <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">
            ConectaFlota
          </h1>
          <p className="text-blue-200/80 font-medium text-sm">
            Sistema de Gestión de Buses
          </p>
        </div>

        {serverError && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-200 px-4 py-3 rounded-xl mb-6 text-sm text-center flex items-center justify-center gap-2">
            <span className="block w-2 h-2 bg-red-400 rounded-full animate-pulse"></span>
            {serverError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          
          <div className="space-y-2">
            <label className="text-xs font-bold text-blue-200/70 uppercase tracking-wider ml-1">
              Correo Electrónico
            </label>
            <div className="relative group">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-400 group-focus-within:text-blue-300 transition-colors" size={20} />
              <input
                type="email"
                className={`w-full pl-12 pr-4 py-4 bg-slate-950/50 border ${errors.email ? 'border-red-500/50 focus:ring-red-500/20' : 'border-slate-700 focus:border-blue-500 focus:ring-blue-500/20'} rounded-xl focus:outline-none focus:ring-4 text-white placeholder-slate-500 transition-all duration-200 shadow-inner`}
                placeholder="ejemplo@empresa.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            {errors.email && <p className="text-red-400 text-xs ml-1 font-medium">{errors.email}</p>}
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-blue-200/70 uppercase tracking-wider ml-1">
              Contraseña
            </label>
            <div className="relative group">
              <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-400 group-focus-within:text-blue-300 transition-colors" size={20} />
              <input
                type="password"
                className={`w-full pl-12 pr-4 py-4 bg-slate-950/50 border ${errors.password ? 'border-red-500/50 focus:ring-red-500/20' : 'border-slate-700 focus:border-blue-500 focus:ring-blue-500/20'} rounded-xl focus:outline-none focus:ring-4 text-white placeholder-slate-500 transition-all duration-200 shadow-inner`}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            {errors.password && <p className="text-red-400 text-xs ml-1 font-medium">{errors.password}</p>}
          </div>

          <button
            type="submit"
            disabled={submitting}
            className={`w-full py-4 px-4 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white font-bold tracking-wide rounded-xl transition-all duration-300 transform hover:-translate-y-0.5 active:translate-y-0 shadow-lg shadow-blue-900/40 ${
              submitting ? 'opacity-70 cursor-not-allowed grayscale' : ''
            }`}
          >
            {submitting ? (
              <span className="flex items-center justify-center gap-3">
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Accediendo...
              </span>
            ) : (
              "Iniciar Sesión"
            )}
          </button>
        </form>

        <div className="mt-8 text-center border-t border-white/5 pt-6">
          <p className="text-slate-500 text-xs font-medium">
            © 2025 ConectaFlota
          </p>
        </div>
      </div>
    </div>
  );
}