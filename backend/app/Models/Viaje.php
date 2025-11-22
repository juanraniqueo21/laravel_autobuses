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
    ];

    protected $casts = [
        'asignacion_turno_id' => 'integer',
        'ruta_id' => 'integer',
        'fecha_hora_salida' => 'datetime',
        'fecha_hora_llegada' => 'datetime',
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
}