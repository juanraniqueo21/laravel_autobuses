<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Carbon\Carbon;

class Bus extends Model
{
    protected $table = 'buses';
    public $timestamps = true;

    protected $fillable = [
        'patente',
        'patente_verificador',
        'marca',
        'modelo',
        'tipo_combustible',
        'color',
        'anio',
        'numero_serie',
        'numero_motor',
        'capacidad_pasajeros',
        'fecha_adquisicion',
        'estado',
        'proxima_revision_tecnica',
        'ultima_revision_tecnica',
        'documento_revision_tecnica',
        'vencimiento_soap',
        'compania_seguro',
        'numero_poliza',
        'tipo_cobertura_adicional',
        'vencimiento_poliza',
        'numero_permiso_circulacion',
        'numero_soap',
        'observaciones',
        'kilometraje_original',
        'kilometraje_actual',
    ];

    protected $casts = [
        'fecha_adquisicion' => 'date',
        'proxima_revision_tecnica' => 'date',
        'ultima_revision_tecnica' => 'date',
        'vencimiento_soap' => 'date',
        'vencimiento_poliza' => 'date',
        'anio' => 'integer',
        'capacidad_pasajeros' => 'integer',
        'kilometraje_original' => 'integer',
        'kilometraje_actual' => 'integer',
    ];

    /**
     * Agregar atributos calculados al JSON
     */
    protected $appends = [
        'antiguedad',
        'revision_tecnica_vencida',
        'seguro_vencido',
        'dias_hasta_revision',
        'dias_hasta_vencimiento_seguro',
    ];

    // ============================================
    // RELACIONES
    // ============================================

    /**
     * Viajes asociados al bus
     */
    public function viajes(): HasMany
    {
        return $this->hasMany(Viaje::class);
    }

    /**
     * Mantenimientos asociados al bus
     */
    public function mantenimientos(): HasMany
    {
        return $this->hasMany(Mantenimiento::class);
    }

    // ============================================
    // ATRIBUTOS CALCULADOS (Accessors)
    // ============================================

    /**
     * Calcular antigüedad del bus en años
     */
    public function getAntiguedadAttribute(): int
    {
        return Carbon::now()->year - $this->anio;
    }

    /**
     * Verificar si la revisión técnica está vencida
     */
    public function getRevisionTecnicaVencidaAttribute(): bool
    {
        if (!$this->proxima_revision_tecnica) {
            return false;
        }
        return Carbon::parse($this->proxima_revision_tecnica)->isPast();
    }

    /**
     * Verificar si el seguro está vencido
     */
    public function getSeguroVencidoAttribute(): bool
    {
        if (!$this->vencimiento_seguro) {
            return false;
        }
        return Carbon::parse($this->vencimiento_seguro)->isPast();
    }

    /**
     * Calcular días hasta la próxima revisión técnica
     */
    public function getDiasHastaRevisionAttribute(): ?int
    {
        if (!$this->proxima_revision_tecnica) {
            return null;
        }
        return Carbon::now()->diffInDays(Carbon::parse($this->proxima_revision_tecnica), false);
    }

    /**
     * Calcular días hasta el vencimiento del seguro
     */
    public function getDiasHastaVencimientoSeguroAttribute(): ?int
    {
        if (!$this->vencimiento_seguro) {
            return null;
        }
        return Carbon::now()->diffInDays(Carbon::parse($this->vencimiento_seguro), false);
    }

    // ============================================
    // MÉTODOS ÚTILES
    // ============================================

    /**
     * Verificar si el bus está operativo
     */
    public function estaOperativo(): bool
    {
        return $this->estado === 'operativo';
    }

    /**
     * Verificar si el bus está en mantenimiento
     */
    public function estaEnMantenimiento(): bool
    {
        return $this->estado === 'mantenimiento';
    }

    /**
     * Verificar si el bus está desmantelado
     */
    public function estaDesmantelado(): bool
    {
        return $this->estado === 'desmantelado';
    }

    /**
     * Verificar si el bus necesita revisión técnica pronto (30 días)
     */
    public function necesitaRevisionProxima(): bool
    {
        $dias = $this->dias_hasta_revision;
        return $dias !== null && $dias >= 0 && $dias <= 30;
    }

    /**
     * Verificar si el seguro vence pronto (30 días)
     */
    public function seguroVenceProxima(): bool
    {
        $dias = $this->dias_hasta_vencimiento_seguro;
        return $dias !== null && $dias >= 0 && $dias <= 30;
    }

    /**
     * Verificar si el bus puede ser asignado a un viaje
     */
    public function puedeSerAsignado(): bool
    {
        return $this->estaOperativo() 
            && !$this->revision_tecnica_vencida 
            && !$this->seguro_vencido;
    }

    /**
     * Obtener kilometraje recorrido
     */
    public function getKilometrajeRecorrido(): int
    {
        return $this->kilometraje_actual - $this->kilometraje_original;
    }

    /**
     * Actualizar kilometraje actual
     */
    public function actualizarKilometraje(int $nuevoKilometraje): bool
    {
        if ($nuevoKilometraje < $this->kilometraje_actual) {
            return false;
        }
        
        $this->kilometraje_actual = $nuevoKilometraje;
        return $this->save();
    }

    // ============================================
    // SCOPES (Consultas reutilizables)
    // ============================================

    /**
     * Scope para obtener solo buses operativos
     */
    public function scopeOperativos($query)
    {
        return $query->where('estado', 'operativo');
    }

    /**
     * Scope para obtener buses en mantenimiento
     */
    public function scopeEnMantenimiento($query)
    {
        return $query->where('estado', 'mantenimiento');
    }

    /**
     * Scope para obtener buses con revisión técnica vencida
     */
    public function scopeConRevisionVencida($query)
    {
        return $query->whereDate('proxima_revision_tecnica', '<', Carbon::now());
    }

    /**
     * Scope para obtener buses con seguro vencido
     */
    public function scopeConSeguroVencido($query)
    {
        return $query->whereDate('vencimiento_seguro', '<', Carbon::now());
    }

    /**
     * Scope para obtener buses disponibles para asignar
     */
    public function scopeDisponibles($query)
    {
        return $query->where('estado', 'operativo')
            ->where(function($q) {
                $q->whereDate('proxima_revision_tecnica', '>=', Carbon::now())
                  ->orWhereNull('proxima_revision_tecnica');
            })
            ->where(function($q) {
                $q->whereDate('vencimiento_seguro', '>=', Carbon::now())
                  ->orWhereNull('vencimiento_seguro');
            });
    }
}