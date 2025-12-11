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
        'kilometraje_actual',
        'kilometraje_ultimo_cambio_aceite',
        'tipo_aceite_motor',
        'fecha_ultima_revision_tecnica',
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
        'kilometraje_actual' => 'integer',
        'kilometraje_ultimo_cambio_aceite' => 'integer',
        'fecha_ultima_revision_tecnica' => 'date',
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
     * Calcular kilómetros desde último cambio de aceite
     */
    public function getKmDesdeUltimoAceiteAttribute(): ?int
    {
        if ($this->kilometraje_actual === null || $this->kilometraje_ultimo_cambio_aceite === null) {
            return null;
        }
        return max(0, $this->kilometraje_actual - $this->kilometraje_ultimo_cambio_aceite);
    }

    /**
     * Obtener estado del aceite del motor
     */
    public function getEstadoAceiteAttribute(): string
    {
        $km = $this->km_desde_ultimo_aceite;
        if ($km === null) {
            return 'sin_datos';
        }

        $umbral = $this->tipo_aceite_motor === 'sintetico' ? 40000 : 15000;
        $alerta = $umbral * 0.9;

        if ($km >= $umbral) {
            return 'critico';
        }
        if ($km >= $alerta) {
            return 'alerta';
        }
        return 'ok';
    }

    /**
     * Verificar si la revisión técnica semestral está vencida
     */
    public function getRevisionTecnicaSemestralVencidaAttribute(): bool
    {
        if (!$this->fecha_ultima_revision_tecnica) {
            return false;
        }
        $proxima = Carbon::parse($this->fecha_ultima_revision_tecnica)->addMonths(6);
        return $proxima->isPast();
    }

    /**
     * Calcular días para la próxima revisión técnica semestral
     */
    public function getDiasRevisionTecnicaSemestralAttribute(): ?int
    {
        if (!$this->fecha_ultima_revision_tecnica) {
            return null;
        }
        $proxima = Carbon::parse($this->fecha_ultima_revision_tecnica)->addMonths(6);
        return Carbon::now()->diffInDays($proxima, false);
    }

    /**
     * Verificar si la revisión técnica anual está vencida
     */
    public function getRevisionTecnicaVencidaAttribute(): bool
    {
        if (!$this->proxima_revision_tecnica) {
            return false;
        }
        return Carbon::parse($this->proxima_revision_tecnica)->isPast();
    }

    /**
     * Verificar si el SOAP está vencido (seguro obligatorio)
     */
    public function getSeguroVencidoAttribute(): bool
    {
        if (!$this->vencimiento_soap) {
            return false;
        }
        return Carbon::parse($this->vencimiento_soap)->isPast();
    }

    /**
     * Verificar si la póliza de seguro adicional está vencida
     */
    public function getPolizaVencidaAttribute(): bool
    {
        if (!$this->vencimiento_poliza) {
            return false;
        }
        return Carbon::parse($this->vencimiento_poliza)->isPast();
    }

    /**
     * Calcular días hasta la próxima revisión técnica anual
     */
    public function getDiasHastaRevisionAttribute(): ?int
    {
        if (!$this->proxima_revision_tecnica) {
            return null;
        }
        return Carbon::now()->diffInDays(Carbon::parse($this->proxima_revision_tecnica), false);
    }

    /**
     * Calcular días hasta el vencimiento del SOAP
     */
    public function getDiasHastaVencimientoSeguroAttribute(): ?int
    {
        if (!$this->vencimiento_soap) {
            return null;
        }
        return Carbon::now()->diffInDays(Carbon::parse($this->vencimiento_soap), false);
    }

    /**
     * Calcular días hasta el vencimiento de la póliza adicional
     */
    public function getDiasHastaVencimientoPolizaAttribute(): ?int
    {
        if (!$this->vencimiento_poliza) {
            return null;
        }
        return Carbon::now()->diffInDays(Carbon::parse($this->vencimiento_poliza), false);
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
     * Verificar si el SOAP vence pronto (30 días)
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
            && !$this->seguro_vencido
            && !$this->mantenimientoVencido();
    }
    
    /**
     * Verificar si necesita mantenimiento próximo (30 días)
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
     * Verificar si el mantenimiento está vencido
     */
    public function mantenimientoVencido(): bool
    {
        if (!$this->fecha_proximo_mantenimiento) {
            return false;
        }
        return Carbon::parse($this->fecha_proximo_mantenimiento)->isPast();
    }

    /**
     * Verificar si necesita mantenimiento por kilometraje
     */
    public function necesitaMantenimientoPorKm(): bool
    {
        if ($this->kilometraje_actual === null || $this->proximo_mantenimiento_km === null) {
            return false;
        }
        $diferencia = $this->proximo_mantenimiento_km - $this->kilometraje_actual;
        return $diferencia <= 1000 && $diferencia >= 0;
    }

    /**
     * Verificar si requiere asistente (buses doble piso)
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
     * Calcular tarifa ajustada según tipo de servicio
     *
     * @param int|float $tarifaBase Tarifa base de la ruta
     * @return int Tarifa final en CLP
     */
    public function calcularTarifa($tarifaBase): int
    {
        return (int) ($tarifaBase * $this->factor_tarifa);
    }

    /**
     * Obtener estado general del bus
     */
    public function getEstadoGeneralAttribute(): string
    {
        if (!$this->estaOperativo()) {
            return 'no_operativo';
        }
        
        if ($this->revision_tecnica_vencida || $this->seguro_vencido || $this->mantenimientoVencido()) {
            return 'con_vencimientos';
        }
        
        if ($this->necesitaRevisionProxima() || $this->seguroVenceProxima() || 
            $this->necesitaMantenimientoProximo() || $this->necesitaMantenimientoPorKm()) {
            return 'con_advertencias';
        }
        
        return 'optimo';
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
     * Scope para obtener buses con SOAP vencido
     */
    public function scopeConSeguroVencido($query)
    {
        return $query->whereDate('vencimiento_soap', '<', Carbon::now());
    }

    /**
     * Scope para obtener buses con póliza vencida
     */
    public function scopeConPolizaVencida($query)
    {
        return $query->whereDate('vencimiento_poliza', '<', Carbon::now());
    }

    /**
     * Scope para obtener buses con mantenimiento vencido
     */
    public function scopeConMantenimientoVencido($query)
    {
        return $query->whereDate('fecha_proximo_mantenimiento', '<', Carbon::now());
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
                $q->whereDate('vencimiento_soap', '>=', Carbon::now())
                  ->orWhereNull('vencimiento_soap');
            })
            ->where(function($q) {
                $q->whereDate('fecha_proximo_mantenimiento', '>=', Carbon::now())
                  ->orWhereNull('fecha_proximo_mantenimiento');
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

    /**
     * Scope para obtener buses por tipo
     */
    public function scopePorTipo($query, $tipoBus)
    {
        return $query->where('tipo_bus', $tipoBus);
    }

    /**
     * Scope para obtener buses con aceite en estado crítico
     */
    public function scopeConAceiteCritico($query)
    {
        return $query->where(function($q) {
            $q->where('tipo_aceite_motor', 'sintetico')
              ->whereRaw('kilometraje_actual - kilometraje_ultimo_cambio_aceite >= 40000');
        })->orWhere(function($q) {
            $q->where('tipo_aceite_motor', '!=', 'sintetico')
              ->orWhereNull('tipo_aceite_motor')
              ->whereRaw('kilometraje_actual - kilometraje_ultimo_cambio_aceite >= 15000');
        });
    }

    /**
     * Scope para obtener buses que necesitan revisión técnica próxima
     */
    public function scopeConRevisionProxima($query, $dias = 30)
    {
        return $query->whereDate('proxima_revision_tecnica', '>=', Carbon::now())
                     ->whereDate('proxima_revision_tecnica', '<=', Carbon::now()->addDays($dias));
    }

    /**
     * Scope para obtener buses que necesitan mantenimiento próximo
     */
    public function scopeConMantenimientoProximo($query, $dias = 30)
    {
        return $query->whereDate('fecha_proximo_mantenimiento', '>=', Carbon::now())
                     ->whereDate('fecha_proximo_mantenimiento', '<=', Carbon::now()->addDays($dias));
    }

    /**
     * Scope para obtener buses por rango de kilometraje
     */
    public function scopePorKilometraje($query, $min = null, $max = null)
    {
        if ($min !== null) {
            $query->where('kilometraje_actual', '>=', $min);
        }
        if ($max !== null) {
            $query->where('kilometraje_actual', '<=', $max);
        }
        return $query;
    }
}