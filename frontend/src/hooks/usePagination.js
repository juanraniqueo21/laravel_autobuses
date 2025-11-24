import { useState, useMemo } from 'react';

/**
 * Hook personalizado para paginar datos en el frontend.
 * @param {Array} data - El array completo de datos a paginar.
 * @param {number} itemsPerPage - Cuántos items mostrar por página.
 * @returns {object} - { currentPage, setCurrentPage, totalPages, paginatedData }
 */
export default function usePagination(data = [], itemsPerPage = 10) {
  const [currentPage, setCurrentPage] = useState(1);

  // Calcula el número total de páginas
  const totalPages = useMemo(() => {
    return Math.ceil(data.length / itemsPerPage);
  }, [data, itemsPerPage]);

  // Calcula los datos que se deben mostrar en la página actual
  const paginatedData = useMemo(() => {
    if (data.length === 0) return [];
    
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    
    // Asegurarse de que la página actual sea válida
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(totalPages);
    } else if (currentPage < 1) {
      setCurrentPage(1);
    }

    return data.slice(startIndex, endIndex);
  }, [data, currentPage, itemsPerPage, totalPages]);

  return {
    currentPage,
    setCurrentPage,
    totalPages,
    paginatedData,
  };
}