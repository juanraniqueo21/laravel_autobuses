export const LICENCIAS_ACTUALIZADAS_EVENT = 'licencias:actualizadas';

export const emitLicenciasActualizadas = () => {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new Event(LICENCIAS_ACTUALIZADAS_EVENT));
};
