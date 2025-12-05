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
        // nuevos campos
        'tipo_bus',
        'cantidad_ejes',
        'marca_motor',
        'modelo_motor',
        'ubicacion_motor',
        'marca_chasis',
        'marca_carroceria',
        'modelo_carroceria',
        'proximo_mantenimiento_km',
        'fecha_proximo_mantenimiento',
        // campos de tipo de servicio
        'tipo_servicio',
        'factor_tarifa',
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
        // nuevos casts
        'proximo_mantenimiento_km' => 'integer',
        'fecha_ultimo_mantenimiento' => 'date',
        'fecha_proximo_mantenimiento' => 'date',
        'factor_tarifa' => 'decimal:1',
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
     * verificar si necesita mantenimiento proximo
     */
    public function necesitaMantenimientoProximo(): bool
    {
        if (!$this->fecha_proximo_mantenimiento) {
            return false;
        }
        $diasRestantes = Carbon::now()->diffInDays(
            Carbon::parse($this->fecha_proximo_mantenimiento),
            false
        );
        return $diasRestantes !== null && $diasRestantes >= 0 && $diasRestantes <= 30;
    }

    /**
     * verificar si el mantenimiento esta vencido
     */
    public function mantenimientoVencido(): bool
    {
        if (!$this->fecha_proximo_mantenimiento) {
            return false;
        }
        return Carbon::parse($this->fecha_proximo_mantenimiento)->isPast();
    }

    /**
     * verificar si requiere asistente (buses dole piso)
     */
    public function requiereAsistente(): bool
    {
        return $this->tipo_bus === 'doble_piso';
    }

    /**
     * Verificar si es un servicio premium (cama o premium)
     */
    public function esServicioPremium(): bool
    {
        return in_array($this->tipo_servicio, ['cama', 'premium']);
    }

    /**
     * Obtener nombre descriptivo del tipo de servicio
     */
    public function getNombreTipoServicioAttribute(): string
    {
        $nombres = [
            'clasico' => 'Clásico',
            'semicama' => 'Semi Cama',
            'cama' => 'Cama',
            'premium' => 'Premium',
        ];
        return $nombres[$this->tipo_servicio] ?? 'Desconocido';
    }

    /**
     * Calcular tarifa ajustada según tipo de servicio
     *
     * @param int|float $tarifaBase Tarifa base de la ruta
     * @return int Tarifa final en CLP
     */
    public function calcularTarifa($tarifaBase): int
    {
        return (int) ($tarifaBase * $this->factor_tarifa);
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

    /**
     * Scope para obtener buses por tipo de servicio
     */
    public function scopePorTipoServicio($query, $tipoServicio)
    {
        return $query->where('tipo_servicio', $tipoServicio);
    }

    /**
     * Scope para obtener buses premium (cama y premium)
     */
    public function scopePremium($query)
    {
        return $query->whereIn('tipo_servicio', ['cama', 'premium']);
    }

    /**
     * Scope para obtener buses económicos (clasico y semicama)
     */
    public function scopeEconomicos($query)
    {
        return $query->whereIn('tipo_servicio', ['clasico', 'semicama']);
    }
}