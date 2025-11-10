export default function AuthLayout({ children }) {
  return (
    <div className="min-h-screen bg-linear-to-br from-blue-600 to-blue-800 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-2xl p-8 max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-blue-600">🚌 Gestión de Buses</h1>
          <p className="text-gray-600 mt-2">Sistema de Transporte</p>
        </div>
        
        {children}
      </div>
    </div>
  );
}