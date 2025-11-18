<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TurnoAsistente extends Model
{
    protected $table = 'turno_asistentes';
    public $timestamps = true;

    protected $fillable = [
        'asignacion_turno_id',
        'asistente_id',
        'posicion',
    ];

    protected $casts = [
        'asignacion_turno_id' => 'integer',
        'asistente_id' => 'integer',
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
     * Asistente asignado
     */
    public function asistente(): BelongsTo
    {
        return $this->belongsTo(Asistente::class);
    }

    // ============================================
    // SCOPES
    // ============================================

    /**
     * Scope para asistentes del piso superior
     */
    public function scopePisoSuperior($query)
    {
        return $query->where('posicion', 'piso_superior');
    }

    /**
     * Scope para asistentes del piso inferior
     */
    public function scopePisoInferior($query)
    {
        return $query->where('posicion', 'piso_inferior');
    }

    /**
     * Scope para asistentes generales
     */
    public function scopeGeneral($query)
    {
        return $query->where('posicion', 'general');
    }

    /**
     * Scope para turnos de un asistente específico
     */
    public function scopePorAsistente($query, $asistenteId)
    {
        return $query->where('asistente_id', $asistenteId);
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
     * Verificar si está asignado al piso superior
     */
    public function esPisoSuperior(): bool
    {
        return $this->posicion === 'piso_superior';
    }

    /**
     * Verificar si está asignado al piso inferior
     */
    public function esPisoInferior(): bool
    {
        return $this->posicion === 'piso_inferior';
    }

    /**
     * Verificar si es asistente general
     */
    public function esGeneral(): bool
    {
        return $this->posicion === 'general';
    }

    /**
     * Obtener nombre completo del asistente
     */
    public function getNombreCompletoAttribute(): string
    {
        if (!$this->asistente || !$this->asistente->empleado || !$this->asistente->empleado->user) {
            return 'Sin nombre';
        }
        
        $user = $this->asistente->empleado->user;
        return $user->nombre . ' ' . $user->apellido;
    }

    /**
     * Obtener número del asistente (A-XXXX)
     */
    public function getNumeroFuncionalAttribute(): ?string
    {
        return $this->asistente?->empleado?->numero_funcional;
    }

    /**
     * Obtener nombre legible de la posición
     */
    public function getPosicionNombreAttribute(): string
    {
        return match($this->posicion) {
            'piso_superior' => 'Piso Superior',
            'piso_inferior' => 'Piso Inferior',
            'general' => 'General',
            default => ucfirst($this->posicion),
        };
    }
}
