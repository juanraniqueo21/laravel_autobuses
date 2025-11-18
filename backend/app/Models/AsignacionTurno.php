<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class AsignacionTurno extends Model
{
    protected $table = 'asignaciones_turno';
    public $timestamps = true;

    protected $fillable = [
        'bus_id',
        'fecha_turno',
        'hora_inicio',
        'hora_termino',
        'tipo_turno',
        'estado',
        'observaciones',
    ];

    protected $casts = [
        'fecha_turno' => 'date',
        'bus_id' => 'integer',
    ];

    // ============================================
    // RELACIONES
    // ============================================

    /**
     * Bus asignado al turno
     */
    public function bus(): BelongsTo
    {
        return $this->belongsTo(Bus::class);
    }

    /**
     * Conductores asignados al turno (relación N:N)
     */
    public function conductores(): BelongsToMany
    {
        return $this->belongsToMany(
            Conductor::class,
            'turno_conductores',
            'asignacion_turno_id',
            'conductor_id'
        )->withPivot('rol')
          ->withTimestamps();
    }

    /**
     * Asistentes asignados al turno (relación N:N)
     */
    public function asistentes(): BelongsToMany
    {
        return $this->belongsToMany(
            Asistente::class,
            'turno_asistentes',
            'asignacion_turno_id',
            'asistente_id'
        )->withPivot('posicion')
          ->withTimestamps();
    }

    /**
     * Viajes realizados durante este turno
     */
    public function viajes(): HasMany
    {
        return $this->hasMany(Viaje::class, 'asignacion_turno_id');
    }

    /**
     * Reporte de operatividad del turno
     */
    public function reporteOperatividad()
    {
        return $this->hasOne(ReporteOperatividad::class, 'asignacion_turno_id');
    }

    // ============================================
    // SCOPES
    // ============================================

    /**
     * Scope para turnos de una fecha específica
     */
    public function scopePorFecha($query, $fecha)
    {
        return $query->whereDate('fecha_turno', $fecha);
    }

    /**
     * Scope para turnos entre fechas
     */
    public function scopeEntreFechas($query, $fechaInicio, $fechaFin)
    {
        return $query->whereBetween('fecha_turno', [$fechaInicio, $fechaFin]);
    }

    /**
     * Scope para turnos por tipo
     */
    public function scopePorTipo($query, $tipo)
    {
        return $query->where('tipo_turno', $tipo);
    }

    /**
     * Scope para turnos programados
     */
    public function scopeProgramados($query)
    {
        return $query->where('estado', 'programado');
    }

    /**
     * Scope para turnos en curso
     */
    public function scopeEnCurso($query)
    {
        return $query->where('estado', 'en_curso');
    }

    /**
     * Scope para turnos completados
     */
    public function scopeCompletados($query)
    {
        return $query->where('estado', 'completado');
    }

    /**
     * Scope para turnos de un conductor específico
     */
    public function scopePorConductor($query, $conductorId)
    {
        return $query->whereHas('conductores', function($q) use ($conductorId) {
            $q->where('conductor_id', $conductorId);
        });
    }

    /**
     * Scope para turnos de un bus específico
     */
    public function scopePorBus($query, $busId)
    {
        return $query->where('bus_id', $busId);
    }

    // ============================================
    // MÉTODOS ÚTILES
    // ============================================

    /**
     * Obtener conductor principal del turno
     */
    public function getConductorPrincipal()
    {
        return $this->conductores()
            ->wherePivot('rol', 'principal')
            ->first();
    }

    /**
     * Obtener conductores de apoyo del turno
     */
    public function getConductoresApoyo()
    {
        return $this->conductores()
            ->wherePivot('rol', 'apoyo')
            ->get();
    }

    /**
     * Verificar si el turno requiere asistente (bus doble piso)
     */
    public function requiereAsistente(): bool
    {
        return $this->bus && $this->bus->tipo_bus === 'doble_piso';
    }

    /**
     * Verificar si el turno está completo (tiene todo el personal necesario)
     */
    public function estaCompleto(): bool
    {
        // Verificar conductores
        $tieneConductor = $this->conductores()->count() > 0;
        
        // Verificar asistentes si es bus doble piso
        if ($this->requiereAsistente()) {
            $tieneAsistente = $this->asistentes()->count() > 0;
            return $tieneConductor && $tieneAsistente;
        }
        
        return $tieneConductor;
    }

    /**
     * Verificar si un horario se solapa con otros turnos del mismo bus
     */
    public static function tieneSolapamiento($busId, $fecha, $horaInicio, $horaTermino, $turnoId = null)
    {
        $query = self::where('bus_id', $busId)
            ->where('fecha_turno', $fecha)
            ->where('estado', '!=', 'cancelado')
            ->where(function($q) use ($horaInicio, $horaTermino) {
                $q->whereBetween('hora_inicio', [$horaInicio, $horaTermino])
                  ->orWhereBetween('hora_termino', [$horaInicio, $horaTermino])
                  ->orWhere(function($q2) use ($horaInicio, $horaTermino) {
                      $q2->where('hora_inicio', '<=', $horaInicio)
                         ->where('hora_termino', '>=', $horaTermino);
                  });
            });
        
        // Si es actualización, excluir el turno actual
        if ($turnoId) {
            $query->where('id', '!=', $turnoId);
        }
        
        return $query->exists();
    }

    /**
     * Verificar si un conductor ya tiene turno en esta fecha
     */
    public static function conductorTieneTurnoEnFecha($conductorId, $fecha, $turnoId = null)
    {
        $query = self::whereDate('fecha_turno', $fecha)
            ->where('estado', '!=', 'cancelado')
            ->whereHas('conductores', function($q) use ($conductorId) {
                $q->where('conductor_id', $conductorId);
            });
        
        if ($turnoId) {
            $query->where('id', '!=', $turnoId);
        }
        
        return $query->exists();
    }

    /**
     * Verificar si un asistente ya tiene turno en esta fecha
     */
    public static function asistenteTieneTurnoEnFecha($asistenteId, $fecha, $turnoId = null)
    {
        $query = self::whereDate('fecha_turno', $fecha)
            ->where('estado', '!=', 'cancelado')
            ->whereHas('asistentes', function($q) use ($asistenteId) {
                $q->where('asistente_id', $asistenteId);
            });
        
        if ($turnoId) {
            $query->where('id', '!=', $turnoId);
        }
        
        return $query->exists();
    }
}