<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Conductor extends Model
{
    protected $table = 'conductores';
    public $timestamps = true;

    protected $fillable = [
        'empleado_id',
        'numero_licencia',
        'clase_licencia',
        'fecha_vencimiento_licencia',
        'puntos_licencia',
        'estado',
        // Nuevos campos
        'anios_experiencia',
        'fecha_primera_licencia',
        'estado_licencia',
        'observaciones_licencia',
        'cantidad_infracciones',
        'cantidad_accidentes',
        'historial_sanciones',
        'fecha_ultima_revision_medica',
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
        'fecha_ultima_revision_medica' => 'date',
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
}