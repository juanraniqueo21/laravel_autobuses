import React, { useState } from "react";
import { login } from '../services/api';
import { Bus, KeyRound, Mail } from 'lucide-react';

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
      // Usamos el servicio 'login' existente que ya maneja la URL correcta y el token
      const data = await login(email, password);

      if (data.success) {
        // Pequeña pausa para asegurar que el token se guardó
        await new Promise(resolve => setTimeout(resolve, 100));
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
    // CAMBIO AQUÍ: 'bg-white/10' a 'bg-slate-900/80' para hacerlo más oscuro y sólido
    // CAMBIO AQUÍ: 'backdrop-blur-xl' a 'backdrop-blur-md' para reducir un poco el desenfoque si se desea, o dejarlo igual.
    <div className="bg-slate-900/80 backdrop-blur-md p-8 rounded-3xl shadow-2xl border border-white/10">
      <div className="text-center mb-8">
        <div className="inline-flex p-4 bg-blue-600/20 rounded-2xl mb-4 backdrop-blur-sm border border-blue-500/30">
          <Bus size={40} className="text-blue-400" />
        </div>
        <h1 className="text-3xl font-bold text-white mb-2">
          Bienvenido
        </h1>
        <p className="text-blue-200/80">
          Sistema de Gestión de Buses
        </p>
      </div>

      {serverError && (
        <div className="bg-red-500/20 border border-red-500/50 text-red-200 px-4 py-3 rounded-xl mb-6 text-sm text-center backdrop-blur-sm">
          {serverError}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <label className="text-sm font-medium text-blue-100 ml-1">
            Correo Electrónico
          </label>
          <div className="relative">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-300" size={20} />
            <input
              type="email"
              // CAMBIO AQUÍ: 'bg-white/5' a 'bg-slate-800/50' para inputs más sólidos
              className={`w-full pl-12 pr-4 py-3.5 bg-slate-800/50 border ${errors.email ? 'border-red-400/50' : 'border-blue-300/20'} rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-400/50 text-white placeholder-blue-300/30 transition-all`}
              placeholder="nombre@empresa.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          {errors.email && <p className="text-red-300 text-xs ml-1">{errors.email}</p>}
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-blue-100 ml-1">
            Contraseña
          </label>
          <div className="relative">
            <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-300" size={20} />
            <input
              type="password"
              // CAMBIO AQUÍ: 'bg-white/5' a 'bg-slate-800/50' para inputs más sólidos
              className={`w-full pl-12 pr-4 py-3.5 bg-slate-800/50 border ${errors.password ? 'border-red-400/50' : 'border-blue-300/20'} rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-400/50 text-white placeholder-blue-300/30 transition-all`}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          {errors.password && <p className="text-red-300 text-xs ml-1">{errors.password}</p>}
        </div>

        <button
          type="submit"
          disabled={submitting}
          className={`w-full py-3.5 px-4 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold rounded-xl transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-blue-500/50 shadow-lg shadow-blue-500/25 ${
            submitting ? 'opacity-70 cursor-not-allowed' : ''
          }`}
        >
          {submitting ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Iniciando...
            </span>
          ) : (
            "Iniciar Sesión"
          )}
        </button>
      </form>

      <div className="mt-8 text-center">
        <p className="text-blue-200/60 text-sm">
          © 2025 Gestión de Buses
        </p>
      </div>
    </div>
  );
}