<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Viaje extends Model
{
    protected $table = 'viajes';
    public $timestamps = true;

    protected $fillable = [
        'asignacion_turno_id',
        'codigo_viaje',
        'nombre_viaje',
        'ruta_id',
        'fecha_hora_salida',
        'fecha_hora_llegada',
        'estado',
        'observaciones',
        'incidentes',
        // === NUEVOS CAMPOS PARA CONTROL DE RECAUDACIÓN ===
        'pasajeros',
        'dinero_recaudado',
        'dinero_esperado',
        'diferencia_porcentaje',
        'requiere_revision',
        // === NUEVOS CAMPOS OPERATIVOS ===
        'combustible_litros',
        'kilometros_recorridos',
        'costo_combustible',
        'costo_por_km',
    ];

    protected $casts = [
        'asignacion_turno_id' => 'integer',
        'ruta_id' => 'integer',
        'fecha_hora_salida' => 'datetime',
        'fecha_hora_llegada' => 'datetime',
        // === NUEVOS CASTS ===
        'pasajeros' => 'integer',
        'dinero_recaudado' => 'integer',
        'dinero_esperado' => 'integer',
        'diferencia_porcentaje' => 'decimal:2',
        'requiere_revision' => 'boolean',
        // === NUEVOS CASTS OPERATIVOS ===
        'combustible_litros' => 'decimal:2',
        'kilometros_recorridos' => 'integer',
        'costo_combustible' => 'integer',
        'costo_por_km' => 'integer',
    ];

    // ============================================
    // RELACIONES
    // ============================================

    /**
     * Turno al que pertenece este viaje
     * Desde aquí se obtiene el bus y la tripulación
     */
    public function asignacionTurno(): BelongsTo
    {
        return $this->belongsTo(AsignacionTurno::class, 'asignacion_turno_id');
    }

    /**
     * Ruta que usa este viaje como plantilla
     */
    public function ruta(): BelongsTo
    {
        return $this->belongsTo(Ruta::class);
    }

    // ============================================
    // ACCESORES (para facilitar el acceso)
    // ============================================

    /**
     * Obtener el bus del turno
     */
    public function getBusAttribute()
    {
        return $this->asignacionTurno?->bus;
    }

    /**
     * Obtener todos los conductores del turno
     */
    public function getConductoresAttribute()
    {
        return $this->asignacionTurno?->conductores;
    }

    /**
     * Obtener el conductor principal del turno
     */
    public function getConductorPrincipalAttribute()
    {
        return $this->asignacionTurno?->getConductorPrincipal();
    }

    /**
     * Obtener todos los asistentes del turno
     */
    public function getAsistentesAttribute()
    {
        return $this->asignacionTurno?->asistentes;
    }

    /**
     * Obtener la diferencia en dinero (absoluta)
     */
    public function getDiferenciaDineroAttribute()
    {
        if (!$this->dinero_esperado || !$this->dinero_recaudado) {
            return 0;
        }
        return $this->dinero_recaudado - $this->dinero_esperado;
    }

    /**
     * Obtener el estado de recaudación como texto
     */
    public function getEstadoRecaudacionAttribute()
    {
        if (!$this->requiere_revision) {
            return 'ok';
        }
        
        if ($this->diferencia_porcentaje > 20) {
            return 'critico';
        }
        
        if ($this->diferencia_porcentaje > 10) {
            return 'advertencia';
        }
        
        return 'ok';
    }

    // ============================================
    // SCOPES
    // ============================================

    /**
     * Scope para viajes de un turno específico
     */
    public function scopePorTurno($query, $turnoId)
    {
        return $query->where('asignacion_turno_id', $turnoId);
    }

    /**
     * Scope para viajes de una fecha específica
     */
    public function scopePorFecha($query, $fecha)
    {
        return $query->whereHas('asignacionTurno', function($q) use ($fecha) {
            $q->whereDate('fecha_turno', $fecha);
        });
    }

    /**
     * Scope para viajes de una ruta específica
     */
    public function scopePorRuta($query, $rutaId)
    {
        return $query->where('ruta_id', $rutaId);
    }

    /**
     * Scope para viajes en curso
     */
    public function scopeEnCurso($query)
    {
        return $query->where('estado', 'en_curso');
    }

    /**
     * Scope para viajes completados
     */
    public function scopeCompletados($query)
    {
        return $query->where('estado', 'completado');
    }

    /**
     * Scope para viajes que requieren revisión de recaudación
     */
    public function scopeRequiereRevision($query)
    {
        return $query->where('requiere_revision', true);
    }

    /**
     * Scope para viajes con diferencia crítica (>20%)
     */
    public function scopeRecaudacionCritica($query)
    {
        return $query->where('diferencia_porcentaje', '>', 20);
    }

    /**
     * Scope para viajes con diferencia moderada (>10%)
     */
    public function scopeRecaudacionModerada($query)
    {
        return $query->where('diferencia_porcentaje', '>', 10)
            ->where('diferencia_porcentaje', '<=', 20);
    }

    // ============================================
    // MÉTODOS ÚTILES
    // ============================================

    /**
     * Calcular duración del viaje en minutos
     */
    public function getDuracionMinutos()
    {
        if (!$this->fecha_hora_salida || !$this->fecha_hora_llegada) {
            return null;
        }
        
        return $this->fecha_hora_salida->diffInMinutes($this->fecha_hora_llegada);
    }

    /**
     * Verificar si el viaje está activo
     */
    public function estaActivo(): bool
    {
        return $this->estado === 'en_curso';
    }

    /**
     * Verificar si el viaje está completado
     */
    public function estaCompletado(): bool
    {
        return $this->estado === 'completado';
    }

    /**
     * Generar código de viaje automático
     */
    public static function generarCodigo($fecha)
    {
        $fechaFormato = date('Ymd', strtotime($fecha));
        $ultimoViaje = self::whereDate('fecha_hora_salida', $fecha)
            ->orderBy('id', 'desc')
            ->first();
        
        $numero = $ultimoViaje ? ((int) substr($ultimoViaje->codigo_viaje, -3)) + 1 : 1;
        
        return 'VJ-' . $fechaFormato . '-' . str_pad($numero, 3, '0', STR_PAD_LEFT);
    }

    // ============================================
    // MÉTODOS DE RECAUDACIÓN
    // ============================================

    /**
     * Calcular dinero esperado según pasajeros y tarifa promedio de la ruta
     */
    public function calcularDineroEsperado()
    {
        if (!$this->pasajeros || !$this->ruta) {
            return 0;
        }

        // Obtener tarifa promedio de todas las paradas de la ruta
        $tarifaPromedio = $this->ruta->paradas()
            ->avg('tarifa_adulto');

        if (!$tarifaPromedio) {
            return 0;
        }

        return intval($this->pasajeros * $tarifaPromedio);
    }

    /**
     * Validar si requiere revisión (diferencia > 10%)
     * Retorna true si requiere revisión
     */
    public function validarRecaudacion(): bool
    {
        if (!$this->dinero_esperado || !$this->dinero_recaudado) {
            $this->diferencia_porcentaje = 0;
            $this->requiere_revision = false;
            return false;
        }

        $diferencia = abs($this->dinero_esperado - $this->dinero_recaudado);
        $porcentaje = ($diferencia / $this->dinero_esperado) * 100;

        $this->diferencia_porcentaje = round($porcentaje, 2);
        $this->requiere_revision = $porcentaje > 10;

        return $this->requiere_revision;
    }

    /**
     * Actualizar recaudación automáticamente
     * Calcula dinero esperado y valida si requiere revisión
     */
    public function actualizarRecaudacion()
    {
        if ($this->pasajeros && $this->ruta) {
            $this->dinero_esperado = $this->calcularDineroEsperado();
        }
        
        if ($this->dinero_recaudado && $this->dinero_esperado) {
            $this->validarRecaudacion();
        }
        
        return $this;
    }

    /**
     * Obtener resumen de recaudación para reportes
     */
    public function getResumenRecaudacion(): array
    {
        return [
            'pasajeros' => $this->pasajeros ?? 0,
            'recaudado' => $this->dinero_recaudado ?? 0,
            'esperado' => $this->dinero_esperado ?? $this->calcularDineroEsperado(),
            'diferencia_dinero' => $this->diferencia_dinero,
            'diferencia_porcentaje' => $this->diferencia_porcentaje ?? 0,
            'requiere_revision' => $this->requiere_revision ?? false,
            'estado' => $this->estado_recaudacion,
        ];
    }

    // ============================================
    // MÉTODOS OPERATIVOS (NUEVOS)
    // ============================================

    /**
     * Calcular costo por kilómetro automáticamente
     */
    public function calcularCostoPorKm(): ?int
    {
        if (!$this->costo_combustible || !$this->kilometros_recorridos || $this->kilometros_recorridos == 0) {
            return null;
        }
        
        return intval($this->costo_combustible / $this->kilometros_recorridos);
    }

    /**
     * Verificar si el viaje es ineficiente (costo > 1000 CLP/km)
     */
    public function esIneficiente(): bool
    {
        $costoPorKm = $this->costo_por_km ?? $this->calcularCostoPorKm();
        return $costoPorKm !== null && $costoPorKm > 1000;
    }

    // ============================================
    // MÉTODOS DE ANÁLISIS GERENCIAL
    // ============================================

    /**
     * Obtener tipo de servicio del bus
     */
    public function getTipoServicioAttribute()
    {
        return $this->bus?->tipo_servicio ?? 'clasico';
    }

    /**
     * Obtener nombre del tipo de servicio
     */
    public function getNombreTipoServicioAttribute()
    {
        $tipos = [
            'clasico' => 'Clásico',
            'semicama' => 'Semicama',
            'cama' => 'Cama',
            'premium' => 'Premium',
        ];

        return $tipos[$this->tipo_servicio] ?? 'Clásico';
    }

    /**
     * Calcular tasa de ocupación (%)
     */
    public function calcularTasaOcupacion(): float
    {
        $capacidad = $this->bus?->capacidad_pasajeros ?? 1;
        $pasajeros = $this->pasajeros_transportados ?? $this->pasajeros ?? 0;

        if ($capacidad == 0) {
            return 0;
        }

        return round(($pasajeros / $capacidad) * 100, 2);
    }

    /**
     * Calcular margen de ganancia (%)
     */
    public function calcularMargenGanancia(): float
    {
        $ingresos = $this->dinero_recaudado ?? 0;
        $gastos = $this->costo_total ?? 0;

        if ($ingresos == 0) {
            return 0;
        }

        $ganancia = $ingresos - $gastos;
        return round(($ganancia / $ingresos) * 100, 2);
    }

    /**
     * Calcular diferencia de recaudación (%)
     */
    public function calcularDiferencia(): float
    {
        return $this->diferencia_porcentaje ?? 0;
    }

    /**
     * Obtener kilómetros recorridos
     */
    public function calcularKilometrosRecorridos(): int
    {
        return $this->kilometros_recorridos ?? $this->ruta?->distancia_km ?? 0;
    }

    /**
     * Calcular eficiencia de combustible (km/litro)
     */
    public function calcularEficienciaCombustible(): float
    {
        $km = $this->kilometros_recorridos ?? 0;
        $litros = $this->combustible_litros ?? 0;

        if ($litros == 0) {
            return 0;
        }

        return round($km / $litros, 2);
    }
}