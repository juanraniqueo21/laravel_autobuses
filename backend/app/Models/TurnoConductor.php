<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TurnoConductor extends Model
{
    protected $table = 'turno_conductores';
    public $timestamps = true;

    protected $fillable = [
        'asignacion_turno_id',
        'conductor_id',
        'rol',
    ];

    protected $casts = [
        'asignacion_turno_id' => 'integer',
        'conductor_id' => 'integer',
    ];

    // ============================================
    // RELACIONES
    // ============================================

    /**
     * Turno al que pertenece esta asignación
     */
    public function asignacionTurno(): BelongsTo
    {
        return $this->belongsTo(AsignacionTurno::class, 'asignacion_turno_id');
    }

    /**
     * Conductor asignado
     */
    public function conductor(): BelongsTo
    {
        return $this->belongsTo(Conductor::class);
    }

    // ============================================
    // SCOPES
    // ============================================

    /**
     * Scope para conductores principales
     */
    public function scopePrincipales($query)
    {
        return $query->where('rol', 'principal');
    }

    /**
     * Scope para conductores de apoyo
     */
    public function scopeApoyo($query)
    {
        return $query->where('rol', 'apoyo');
    }

    /**
     * Scope para turnos de un conductor específico
     */
    public function scopePorConductor($query, $conductorId)
    {
        return $query->where('conductor_id', $conductorId);
    }

    /**
     * Scope para turnos en una fecha específica
     */
    public function scopeEnFecha($query, $fecha)
    {
        return $query->whereHas('asignacionTurno', function($q) use ($fecha) {
            $q->whereDate('fecha_turno', $fecha);
        });
    }

    // ============================================
    // MÉTODOS ÚTILES
    // ============================================

    /**
     * Verificar si es conductor principal
     */
    public function esPrincipal(): bool
    {
        return $this->rol === 'principal';
    }

    /**
     * Verificar si es conductor de apoyo
     */
    public function esApoyo(): bool
    {
        return $this->rol === 'apoyo';
    }

    /**
     * Obtener nombre completo del conductor
     */
    public function getNombreCompletoAttribute(): string
    {
        if (!$this->conductor || !$this->conductor->empleado || !$this->conductor->empleado->user) {
            return 'Sin nombre';
        }
        
        $user = $this->conductor->empleado->user;
        return $user->nombre . ' ' . $user->apellido;
    }

    /**
     * Obtener número del conductor (C-XXXX)
     */
    public function getNumeroFuncionalAttribute(): ?string
    {
        return $this->conductor?->empleado?->numero_funcional;
    }
}