import React, { useState } from 'react';
import Input from '../components/common/Input';
import Button from '../components/common/Button';
import { login } from '../services/api';

export default function LoginPage({ onLoginSuccess }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError(null);

    if (!email || !password) {
      setError('Por favor completa todos los campos');
      return;
    }

    try {
      setLoading(true);
      
      // Usar la función login de api.js (ya guarda token automáticamente)
      const data = await login(email, password);

      if (data.success) {
        // esperar un tick para asegurar que el token guardo
        await new Promise(resolve => setTimeout(resolve, 100));
        onLoginSuccess(data.user);
      } else {
        setError(data.message || 'Error en el login');
      }
    } catch (err) {
      setError(err.message || 'Credenciales inválidas');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">🚌 Gestión de Buses</h1>
        <p className="text-gray-600">Sistema de gestión operativa</p>
      </div>

      {/* Errores */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* Formulario */}
      <form onSubmit={handleLogin} className="space-y-4">
        <Input
          label="Email"
          type="email"
          placeholder="ejemplo@correo.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={loading}
          required
        />

        <Input
          label="Contraseña"
          type="password"
          placeholder="Tu contraseña"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          disabled={loading}
          required
        />

        <Button
          variant="primary"
          size="lg"
          onClick={handleLogin}
          disabled={loading}
          className="w-full"
        >
          {loading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
        </Button>
      </form>

      {/* Info */}
      <div className="bg-gray-100 p-4 rounded-lg">
        <p className="text-sm text-gray-700">
          <strong>Credenciales de prueba:</strong>
          <br />
          Email: test@test.com
          <br />
          Contraseña: 123456
        </p>
      </div>
    </div>
  );
}