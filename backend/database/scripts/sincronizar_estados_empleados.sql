-- ============================================
-- SCRIPT: Sincronización de Estados de Empleados
-- ============================================
-- Este script verifica y corrige inconsistencias de estados
-- entre la tabla empleados y las tablas conductores, asistentes y mecánicos
--
-- IMPORTANTE: Ejecutar este script UNA VEZ para arreglar datos existentes.
-- Después de esto, la sincronización será automática gracias a los
-- eventos del modelo Empleado.
-- ============================================

-- ============================================
-- 1. VERIFICAR INCONSISTENCIAS ACTUALES
-- ============================================

-- Conductores con estados inconsistentes
SELECT
    'CONDUCTOR' as tipo,
    c.id,
    c.estado as estado_conductor,
    e.estado as estado_empleado,
    CONCAT(u.nombre, ' ', u.apellido) as nombre_completo
FROM conductores c
INNER JOIN empleados e ON c.empleado_id = e.id
INNER JOIN users u ON e.user_id = u.id
WHERE c.estado != e.estado
ORDER BY c.id;

-- Asistentes con estados inconsistentes
SELECT
    'ASISTENTE' as tipo,
    a.id,
    a.estado as estado_asistente,
    e.estado as estado_empleado,
    CONCAT(u.nombre, ' ', u.apellido) as nombre_completo
FROM asistentes a
INNER JOIN empleados e ON a.empleado_id = e.id
INNER JOIN users u ON e.user_id = u.id
WHERE a.estado != e.estado
ORDER BY a.id;

-- Mecánicos con estados inconsistentes
SELECT
    'MECANICO' as tipo,
    m.id,
    m.estado as estado_mecanico,
    e.estado as estado_empleado,
    CONCAT(u.nombre, ' ', u.apellido) as nombre_completo
FROM mecanicos m
INNER JOIN empleados e ON m.empleado_id = e.id
INNER JOIN users u ON e.user_id = u.id
WHERE m.estado != e.estado
ORDER BY m.id;

-- ============================================
-- 2. CORREGIR INCONSISTENCIAS
-- ============================================
-- Sincronizar estados desde empleados hacia conductores, asistentes y mecánicos

-- Actualizar conductores
UPDATE conductores c
INNER JOIN empleados e ON c.empleado_id = e.id
SET c.estado = e.estado
WHERE c.estado != e.estado;

-- Actualizar asistentes
UPDATE asistentes a
INNER JOIN empleados e ON a.empleado_id = e.id
SET a.estado = e.estado
WHERE a.estado != e.estado;

-- Actualizar mecánicos
UPDATE mecanicos m
INNER JOIN empleados e ON m.empleado_id = e.id
SET m.estado = e.estado
WHERE m.estado != e.estado;

-- ============================================
-- 3. VERIFICAR QUE TODO QUEDÓ SINCRONIZADO
-- ============================================

-- Contar inconsistencias restantes (debe ser 0)
SELECT
    'Conductores inconsistentes' as descripcion,
    COUNT(*) as cantidad
FROM conductores c
INNER JOIN empleados e ON c.empleado_id = e.id
WHERE c.estado != e.estado

UNION ALL

SELECT
    'Asistentes inconsistentes' as descripcion,
    COUNT(*) as cantidad
FROM asistentes a
INNER JOIN empleados e ON a.empleado_id = e.id
WHERE a.estado != e.estado

UNION ALL

SELECT
    'Mecánicos inconsistentes' as descripcion,
    COUNT(*) as cantidad
FROM mecanicos m
INNER JOIN empleados e ON m.empleado_id = e.id
WHERE m.estado != e.estado;

-- ============================================
-- 4. ESTADÍSTICAS FINALES
-- ============================================

SELECT
    e.estado,
    COUNT(DISTINCT e.id) as total_empleados,
    COUNT(DISTINCT c.id) as conductores,
    COUNT(DISTINCT a.id) as asistentes,
    COUNT(DISTINCT m.id) as mecanicos
FROM empleados e
LEFT JOIN conductores c ON e.id = c.empleado_id
LEFT JOIN asistentes a ON e.id = a.empleado_id
LEFT JOIN mecanicos m ON e.id = m.empleado_id
GROUP BY e.estado
ORDER BY e.estado;
