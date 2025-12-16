<?php

namespace App\Models;

use Carbon\Carbon;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Conductor extends Model
{
    protected $table = 'conductores';
    public $timestamps = true;

    protected $appends = ['estado_visual'];

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

    /**
     * Indica si la licencia del conductor ya está vencida
     */
    public function getLicenciaVencidaAttribute(): bool
    {
        if (!$this->fecha_vencimiento_licencia) {
            return false;
        }
        return Carbon::parse($this->fecha_vencimiento_licencia)->isPast();
    }

    /**
     * Estado que debería usarse al mostrar el conductor cuando la licencia está vencida
     */
    public function getEstadoVisualAttribute(): string
    {
        if ($this->estado !== 'activo') {
            return $this->estado;
        }

        return $this->licencia_vencida ? 'inactivo' : 'activo';
    }

    public function empleado(): BelongsTo
    {
        return $this->belongsTo(Empleado::class);
    }

    public function viajes(): HasMany
    {
        return $this->hasMany(Viaje::class);
    }
}
