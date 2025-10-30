<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Viaje extends Model
{
    protected $table = 'viajes';
    public $timestamps = true;

    protected $fillable = [
        'bus_id',
        'conductor_id',
        'asistente_id',
        'ruta_id',
        'fecha_hora_salida',
        'fecha_hora_llegada',
        'pasajeros_transportados',
        'combustible_gastado',
        'kilometraje_inicial',
        'kilometraje_final',
        'estado',
        'observaciones',
        'incidentes',
    ];

    protected $casts = [
        'fecha_hora_salida' => 'datetime',
        'fecha_hora_llegada' => 'datetime',
        'pasajeros_transportados' => 'integer',
        'combustible_gastado' => 'decimal:2',
        'kilometraje_inicial' => 'integer',
        'kilometraje_final' => 'integer',
        'bus_id' => 'integer',
        'conductor_id' => 'integer',
        'asistente_id' => 'integer',
        'ruta_id' => 'integer',
    ];

    public function bus(): BelongsTo
    {
        return $this->belongsTo(Bus::class);
    }

    public function conductor(): BelongsTo
    {
        return $this->belongsTo(Conductor::class);
    }

    public function asistente(): BelongsTo
    {
        return $this->belongsTo(Asistente::class);
    }

    public function ruta(): BelongsTo
    {
        return $this->belongsTo(Ruta::class);
    }
}