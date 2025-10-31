import { useState } from 'react';
import Header from '../common/Header';
import Sidebar from '../common/Sidebar';

export default function MainLayout({ children, user, onLogout, currentPage, onPageChange }) {
  return (
    <div className="flex">
      {/* Sidebar */}
      <Sidebar current={currentPage} onSelect={onPageChange} />
      
      {/* Main Content */}
      <div className="ml-64 w-full flex flex-col">
        {/* Header */}
        <Header user={user} onLogout={onLogout} />
        
        {/* Page Content */}
        <main className="flex-1 bg-gray-50 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}