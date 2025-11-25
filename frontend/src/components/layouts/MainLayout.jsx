import React, { useState } from 'react';
import Header from '../common/Header';
import Sidebar from '../common/Sidebar';

export default function MainLayout({ children, user, onLogout, currentPage, onPageChange }) {
  
  // Estado del menú (empieza cerrado para móviles/overlay)
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  
  return (
    <div className="min-h-screen w-full bg-gray-50 relative">
      
      {/* 1. HEADER: Se oculta en móvil cuando el menú está abierto para evitar solapamientos feos, 
          pero se mantiene visible en desktop si decides cambiar el comportamiento luego. */}
      {!isMenuOpen && (
        <Header 
          user={user} 
          onLogout={onLogout} 
          onToggleMenu={() => setIsMenuOpen(true)} 
        />
      )}
      
      {/* 2. SIDEBAR: Superpuesto (Overlay) a la izquierda */}
      <Sidebar 
        current={currentPage} 
        onSelect={(page) => {
          onPageChange(page);
          setIsMenuOpen(false); // Cerrar menú automáticamente al navegar (UX móvil)
        }}
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)} 
        user={user} // <--- CRÍTICO: Pasamos el usuario para que el Sidebar sepa qué menú mostrar (Admin vs Conductor)
      />
      
      {/* 3. CONTENIDO: Siempre visible debajo */}
      <main className="p-6 w-full">
        <div className="max-w-7xl mx-auto">
          {children}
        </div>
      </main>
      
    </div>
  );
}