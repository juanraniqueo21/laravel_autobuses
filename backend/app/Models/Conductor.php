<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Carbon\Carbon;

class Conductor extends Model
{
    protected $table = 'conductores';
    public $timestamps = true;

    protected $fillable = [
        'empleado_id',
        'numero_licencia',
        'clase_licencia',
        'fecha_vencimiento_licencia',
        'estado',
        // Nuevos campos
        'anios_experiencia',
        'fecha_primera_licencia',
        'estado_licencia',
        'observaciones_licencia',
        'cantidad_infracciones',
        'cantidad_accidentes',
        'historial_sanciones',
        'fecha_examen_ocupacional',
        'apto_conducir',
        'certificado_rcp',
        'vencimiento_rcp',
        'certificado_defensa',
        'vencimiento_defensa',
    ];

    protected $casts = [
        'fecha_vencimiento_licencia' => 'date',
        'fecha_emision_licencia' => 'date',
        'fecha_primera_licencia' => 'date',
        'fecha_examen_ocupacional' => 'date',
        'vencimiento_rcp' => 'date',
        'vencimiento_defensa' => 'date',
        'puntos_licencia' => 'integer',
        'anios_experiencia' => 'integer',
        'cantidad_infracciones' => 'integer',
        'cantidad_accidentes' => 'integer',
        'apto_conducir' => 'boolean',
        'certificado_rcp' => 'boolean',
        'certificado_defensa' => 'boolean',
        'empleado_id' => 'integer',
    ];

    public function empleado(): BelongsTo
    {
        return $this->belongsTo(Empleado::class);
    }

    public function viajes(): HasMany
    {
        return $this->hasMany(Viaje::class);
    }

    // ============================================
    // MÉTODOS DE ESTADO
    // ============================================

    /**
     * Verifica si el conductor está inactivo
     */
    public function estaInactivo(): bool
    {
        return $this->estado === 'inactivo';
    }

    // ============================================
    // SCOPES
    // ============================================

    /**
     * Scope para obtener conductores inactivos
     */
    public function scopeInactivos($query)
    {
        return $query->where('estado', 'inactivo');
    }

    /**
     * Scope para obtener conductores con licencia vencida
     */
    public function scopeConLicenciaVencida($query)
    {
        return $query->whereNotNull('fecha_vencimiento_licencia')
                     ->whereDate('fecha_vencimiento_licencia', '<', now());
    }

    // ============================================
    // ACCESSORS
    // ============================================

    /**
     * Verifica si la licencia está vencida
     */
    public function getLicenciaVencidaAttribute(): bool
    {
        if (!$this->fecha_vencimiento_licencia) {
            return false;
        }
        return $this->fecha_vencimiento_licencia->isPast();
    }

    /**
     * Obtiene los días hasta el vencimiento de la licencia
     */
    public function getDiasHastaVencimientoLicenciaAttribute(): ?int
    {
        if (!$this->fecha_vencimiento_licencia) {
            return null;
        }
        return now()->diffInDays($this->fecha_vencimiento_licencia, false);
    }
}