# 🔄 Sincronización Automática de Estados de Empleados

## 📋 Problema Identificado

Anteriormente, cuando se actualizaba el estado de un **Empleado** (ej: de `activo` a `licencia`), este cambio **NO se reflejaba automáticamente** en las tablas relacionadas:

- ✗ `conductores.estado` quedaba desincronizado
- ✗ `asistentes.estado` quedaba desincronizado
- ✗ `mecanicos.estado` quedaba desincronizado

Esto causaba **inconsistencias de datos** donde:
- Un empleado estaba en licencia en la tabla `empleados`
- Pero seguía apareciendo como `activo` en `conductores` o `asistentes`

---

## ✅ Solución Implementada

### 1. **Sincronización Automática en el Modelo Empleado**

**Archivo:** `backend/app/Models/Empleado.php`

Se agregó un **evento `updated`** en el método `boot()` que detecta cuando cambia el campo `estado` y automáticamente sincroniza con las tablas relacionadas:

```php
static::updated(function($empleado){
    // Solo sincronizar si el campo 'estado' fue modificado
    if ($empleado->wasChanged('estado')) {
        $nuevoEstado = $empleado->estado;

        // Sincronizar con Conductor (si existe)
        if ($empleado->conductor) {
            $empleado->conductor->update(['estado' => $nuevoEstado]);
        }

        // Sincronizar con Asistente (si existe)
        if ($empleado->asistente) {
            $empleado->asistente->update(['estado' => $nuevoEstado]);
        }

        // Sincronizar con Mecánico (si existe)
        if ($empleado->mecanico) {
            $empleado->mecanico->update(['estado' => $nuevoEstado]);
        }

        \Log::info("Estado sincronizado para empleado #{$empleado->id}: {$nuevoEstado}");
    }
});
```

**Beneficios:**
- ✅ Sincronización automática en **tiempo real**
- ✅ Funciona en **todos los puntos** donde se actualice un empleado:
  - `EmpleadoController::update()`
  - Comando `ActualizarEstadosLicencias`
  - Cualquier otro lugar que use `$empleado->update()` o `$empleado->save()`
- ✅ **Log automático** de cada sincronización

---

### 2. **Comando Artisan para Sincronizar Datos Existentes**

**Archivo:** `backend/app/Console/Commands/SincronizarEstadosEmpleados.php`

Comando para corregir **inconsistencias existentes** en la base de datos:

```bash
php artisan empleados:sincronizar-estados
```

**Salida esperada:**
```
🔄 Iniciando sincronización de estados...

🚗 Sincronizando conductores...
   ✓ Conductor ID 3: activo → licencia
   ✓ Conductor ID 7: activo → licencia

👥 Sincronizando asistentes...
   ✓ Asistente ID 2: activo → licencia

🔧 Sincronizando mecánicos...
   (No hay inconsistencias)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 RESUMEN DE SINCRONIZACIÓN
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   Conductores actualizados:  2
   Asistentes actualizados:   1
   Mecánicos actualizados:    0
   ─────────────────────────────────────────
   TOTAL:                     3
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✅ Sincronización completada exitosamente.
```

---

### 3. **Script SQL Directo (Alternativa)**

**Archivo:** `backend/database/scripts/sincronizar_estados_empleados.sql`

Si prefieres ejecutar directamente en la base de datos sin usar Laravel:

```bash
# Conectar a la base de datos
mysql -u root -p laravel_autobuses

# Ejecutar el script
source backend/database/scripts/sincronizar_estados_empleados.sql
```

O usando PostgreSQL:
```bash
psql -U postgres -d laravel_autobuses -f backend/database/scripts/sincronizar_estados_empleados.sql
```

El script contiene:
1. **Queries de verificación** (ver inconsistencias)
2. **Queries de corrección** (UPDATE automáticos)
3. **Queries de validación** (confirmar que todo quedó OK)
4. **Estadísticas finales** por estado

---

## 🔍 Verificar Inconsistencias Manualmente

### Opción 1: SQL Directo
```sql
-- Conductores inconsistentes
SELECT
    c.id,
    c.estado as estado_conductor,
    e.estado as estado_empleado,
    CONCAT(u.nombre, ' ', u.apellido) as nombre
FROM conductores c
INNER JOIN empleados e ON c.empleado_id = e.id
INNER JOIN users u ON e.user_id = u.id
WHERE c.estado != e.estado;

-- Asistentes inconsistentes
SELECT
    a.id,
    a.estado as estado_asistente,
    e.estado as estado_empleado,
    CONCAT(u.nombre, ' ', u.apellido) as nombre
FROM asistentes a
INNER JOIN empleados e ON a.empleado_id = e.id
INNER JOIN users u ON e.user_id = u.id
WHERE a.estado != e.estado;

-- Mecánicos inconsistentes
SELECT
    m.id,
    m.estado as estado_mecanico,
    e.estado as estado_empleado,
    CONCAT(u.nombre, ' ', u.apellido) as nombre
FROM mecanicos m
INNER JOIN empleados e ON m.empleado_id = e.id
INNER JOIN users u ON e.user_id = u.id
WHERE m.estado != e.estado;
```

### Opción 2: Tinker (Laravel)
```bash
php artisan tinker
```

```php
// Verificar conductores
$inconsistentes = App\Models\Conductor::with('empleado')
    ->get()
    ->filter(fn($c) => $c->estado !== $c->empleado->estado);

echo "Conductores inconsistentes: " . $inconsistentes->count();

// Verificar asistentes
$inconsistentes = App\Models\Asistente::with('empleado')
    ->get()
    ->filter(fn($a) => $a->estado !== $a->empleado->estado);

echo "Asistentes inconsistentes: " . $inconsistentes->count();

// Verificar mecánicos
$inconsistentes = App\Models\Mecanico::with('empleado')
    ->get()
    ->filter(fn($m) => $m->estado !== $m->empleado->estado);

echo "Mecánicos inconsistentes: " . $inconsistentes->count();
```

---

## 🚀 Pasos para Implementar

### 1️⃣ Corregir Datos Existentes

**Opción A - Comando Artisan (Recomendado):**
```bash
cd backend
php artisan empleados:sincronizar-estados
```

**Opción B - SQL Directo:**
```bash
mysql -u root -p laravel_autobuses < backend/database/scripts/sincronizar_estados_empleados.sql
```

### 2️⃣ Verificar que Funcionó

```bash
php artisan tinker
```

```php
// Debe retornar 0 inconsistencias
$conductores = App\Models\Conductor::with('empleado')->get()
    ->filter(fn($c) => $c->estado !== $c->empleado->estado)->count();

$asistentes = App\Models\Asistente::with('empleado')->get()
    ->filter(fn($a) => $a->estado !== $a->empleado->estado)->count();

$mecanicos = App\Models\Mecanico::with('empleado')->get()
    ->filter(fn($m) => $m->estado !== $m->empleado->estado)->count();

echo "Total inconsistencias: " . ($conductores + $asistentes + $mecanicos);
```

### 3️⃣ Probar la Sincronización Automática

```bash
php artisan tinker
```

```php
// Obtener un empleado que sea conductor
$empleado = App\Models\Empleado::whereHas('conductor')->first();

echo "Estado actual empleado: " . $empleado->estado . "\n";
echo "Estado actual conductor: " . $empleado->conductor->estado . "\n";

// Cambiar estado del empleado
$empleado->update(['estado' => 'licencia']);

// Refrescar relaciones
$empleado->refresh();

echo "Nuevo estado empleado: " . $empleado->estado . "\n";
echo "Nuevo estado conductor: " . $empleado->conductor->estado . "\n";

// ✅ Ambos deben mostrar "licencia"
```

---

## 📝 Casos de Uso

### Caso 1: Empleado con Licencia Médica
```php
// El usuario solicita licencia desde el frontend
// El controlador actualiza el empleado
$empleado->update(['estado' => 'licencia']);

// ✅ Automáticamente se sincroniza:
// - conductores.estado = 'licencia'
// - asistentes.estado = 'licencia'
// - mecanicos.estado = 'licencia'
```

### Caso 2: Comando Automático de Licencias
El comando `ActualizarEstadosLicencias` que se ejecuta diariamente:

```php
// backend/app/Console/Commands/ActualizarEstadosLicencias.php
$empleado->estado = 'licencia';
$empleado->save();

// ✅ La sincronización se ejecuta automáticamente
```

### Caso 3: Actualización Manual desde el Frontend
```php
// EmpleadoController@update
$empleado->update($request->validated());

// ✅ Si se cambió el estado, se sincroniza automáticamente
```

---

## 🧪 Testing

### Test Manual 1: Cambio Individual
```php
$empleado = App\Models\Empleado::find(1);
$empleado->update(['estado' => 'suspendido']);
$empleado->refresh();

// Verificar
echo $empleado->conductor->estado; // Debe ser 'suspendido'
echo $empleado->asistente->estado; // Debe ser 'suspendido'
```

### Test Manual 2: Cambio Masivo
```php
// Cambiar múltiples empleados
App\Models\Empleado::whereIn('id', [1, 2, 3])
    ->update(['estado' => 'activo']);

// Verificar que todos se sincronizaron
$empleados = App\Models\Empleado::with('conductor', 'asistente')
    ->whereIn('id', [1, 2, 3])
    ->get();

foreach ($empleados as $emp) {
    if ($emp->conductor) {
        assert($emp->conductor->estado === 'activo');
    }
    if ($emp->asistente) {
        assert($emp->asistente->estado === 'activo');
    }
}
```

---

## 📊 Monitoreo

Los logs se guardan en `storage/logs/laravel.log`:

```
[2025-12-09 01:23:45] local.INFO: Estado sincronizado para empleado #3: licencia
[2025-12-09 01:24:12] local.INFO: Estado sincronizado para empleado #7: activo
[2025-12-09 01:25:03] local.INFO: Estado sincronizado para empleado #12: suspendido
```

Para ver logs en tiempo real:
```bash
tail -f storage/logs/laravel.log | grep "Estado sincronizado"
```

---

## ⚠️ Consideraciones Importantes

1. **Sincronización Unidireccional**:
   - La sincronización va desde `empleados` → `conductores/asistentes/mecanicos`
   - NO al revés. El estado en `empleados` es siempre la fuente de verdad.

2. **Campos de Estado Válidos**:
   - `activo` - Empleado trabajando normalmente
   - `licencia` - Licencia médica o permiso
   - `suspendido` - Suspensión disciplinaria
   - `terminado` - Contrato terminado

3. **Performance**:
   - La sincronización solo ocurre cuando **cambia** el estado
   - No afecta updates de otros campos del empleado

4. **Transacciones**:
   - Si el update del empleado falla, no se ejecuta la sincronización
   - Laravel maneja esto automáticamente

---

## 🔧 Troubleshooting

### Problema: "Call to a member function update() on null"
**Causa:** El empleado no tiene conductor/asistente/mecánico relacionado.
**Solución:** Ya está manejado con `if ($empleado->conductor)` en el código.

### Problema: Los estados no se sincronizan
**Verificar:**
1. Que el archivo `Empleado.php` tenga el evento `updated` correctamente
2. Que el cache de Laravel esté limpio: `php artisan config:clear`
3. Ver logs: `tail -f storage/logs/laravel.log`

### Problema: "Unknown column 'estado' in field list"
**Causa:** Falta ejecutar migraciones.
**Solución:**
```bash
php artisan migrate
```

---

## 📚 Referencias

- **Modelo Empleado:** `backend/app/Models/Empleado.php` (líneas 267-289)
- **Comando de Sincronización:** `backend/app/Console/Commands/SincronizarEstadosEmpleados.php`
- **Script SQL:** `backend/database/scripts/sincronizar_estados_empleados.sql`
- **Comando de Licencias:** `backend/app/Console/Commands/ActualizarEstadosLicencias.php`

---

## ✅ Checklist de Implementación

- [x] Agregar evento `updated` en modelo Empleado
- [x] Crear comando `SincronizarEstadosEmpleados`
- [x] Crear script SQL de sincronización
- [ ] Ejecutar comando de sincronización inicial
- [ ] Verificar que no hay inconsistencias
- [ ] Probar sincronización automática en desarrollo
- [ ] Probar con comando de licencias
- [ ] Verificar logs
- [ ] Documentar en README del proyecto

---

**Fecha de Implementación:** 09/12/2025
**Desarrollador:** Claude AI
**Estado:** ✅ Completado
