<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Carbon\Carbon;

class Mantenimiento extends Model
{
    protected $table = 'mantenimientos';
    public $timestamps = true;

    protected $fillable = [
        'bus_id',
        'mecanico_id',
        'tipo_mantenimiento',
        'descripcion',
        'fecha_inicio',
        'fecha_termino',
        'costo_total',
        'estado',
        'repuestos_utilizados',
        'observaciones',
    ];

    protected $casts = [
        'fecha_inicio' => 'date',
        'fecha_termino' => 'date',
        'costo_total' => 'integer',
        'repuestos_utilizados' => 'array',
        'bus_id' => 'integer',
        'mecanico_id' => 'integer',
    ];

    // ============================================
    // RELACIONES
    // ============================================

    public function bus(): BelongsTo
    {
        return $this->belongsTo(Bus::class);
    }

    public function mecanico(): BelongsTo
    {
        return $this->belongsTo(Empleado::class, 'mecanico_id');
    }

    // ============================================
    // EVENTOS AUTOMÁTICOS
    // ============================================

    protected static function boot()
    {
        parent::boot();

        // Cuando se crea un mantenimiento
        static::created(function ($mantenimiento) {
            self::verificarEstadoBus($mantenimiento->bus_id);
        });

        // Cuando se actualiza un mantenimiento
        static::updated(function ($mantenimiento) {
            self::verificarEstadoBus($mantenimiento->bus_id);
        });

        // Cuando se elimina un mantenimiento
        static::deleted(function ($mantenimiento) {
            self::verificarEstadoBus($mantenimiento->bus_id);
        });
    }

    /**
     * Verificar y actualizar estado del bus según mantenimientos activos
     */
    protected static function verificarEstadoBus($busId)
    {
        $bus = Bus::find($busId);
        
        if (!$bus) {
            return;
        }

        $hoy = Carbon::now()->format('Y-m-d');

        // Verificar si tiene mantenimientos activos HOY
        $tieneMantenimientoActivo = self::where('bus_id', $busId)
            ->where('estado', 'en_proceso')
            ->where('fecha_inicio', '<=', $hoy)
            ->where(function($query) use ($hoy) {
                $query->whereNull('fecha_termino')
                      ->orWhere('fecha_termino', '>=', $hoy);
            })
            ->exists();

        if ($tieneMantenimientoActivo) {
            // Cambiar a estado mantenimiento
            if ($bus->estado !== 'mantenimiento') {
                $bus->estado = 'mantenimiento';
                $bus->save();
            }
        } else {
            // Si no tiene mantenimientos activos y está en mantenimiento, volver a operativo
            if ($bus->estado === 'mantenimiento') {
                $bus->estado = 'operativo';
                $bus->save();
            }
        }
    }
}