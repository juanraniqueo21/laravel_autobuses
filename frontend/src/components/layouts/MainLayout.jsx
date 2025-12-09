import React, { useState } from 'react';
import Header from '../common/Header';
import Sidebar from '../common/Sidebar';

export default function MainLayout({ children, user, onLogout, currentPage, onPageChange }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  
  return (
    <div className="min-h-screen w-full bg-gray-50 relative flex flex-col">
      
      {/* Header */}
      {!isMenuOpen && (
        <Header 
          user={user} 
          onLogout={onLogout} 
          onToggleMenu={() => setIsMenuOpen(true)} 
        />
      )}
      
      {/* Sidebar */}
      <Sidebar 
        current={currentPage} 
        onSelect={(page) => {
          onPageChange(page);
          setIsMenuOpen(false);
        }}
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)} 
        user={user}
      />
      
      {/* === CAMBIO CLAVE AQUÍ === */}
      <main className="flex-1 w-full">
        {/* 1. Quitamos 'max-w-7xl' (que limitaba el ancho).
            2. Cambiamos a 'w-full' o 'max-w-[1920px]' si no quieres que se deforme en pantallas gigantes.
            3. Quitamos 'mx-auto' si usamos w-full.
            4. Ajustamos el padding (px-4 o px-6) para que no pegue al borde.
        */}
        <div className="w-full px-4 md:px-6 py-6">
          {children}
        </div>
      </main>
      
    </div>
  );
}