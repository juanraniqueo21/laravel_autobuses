import { useState } from 'react';
import Header from '../common/Header';
import Sidebar from '../common/Sidebar';

export default function MainLayout({ children, user, onLogout, currentPage, onPageChange }) {
  
  // Estado del menú (empieza cerrado)
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  
  return (
    <div className="min-h-screen w-full bg-gray-50 relative">
      
      {/* 1. HEADER: Se oculta cuando el menú está abierto */}
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
          setIsMenuOpen(false); // Cerrar al navegar
        }}
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)} 
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