<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class RutaParada extends Model
{
    protected $table = 'rutas_paradas';

    protected $fillable = [
        'ruta_id',
        'orden',
        'ciudad',
        'es_origen',
        'es_destino',
        'distancia_desde_anterior_km',
        'tiempo_desde_anterior_min',
        // --- AGREGA ESTAS DOS LÍNEAS PARA QUE GUARDEN LAS HORAS ---
        'hora_llegada',
        'hora_salida',
        // ----------------------------------------------------------
        'tarifa_adulto',
        'tarifa_estudiante',
        'tarifa_tercera_edad',
        'observaciones',
    ];

    protected $casts = [
        'ruta_id' => 'integer',
        'orden' => 'integer',
        'es_origen' => 'boolean',
        'es_destino' => 'boolean',
        'distancia_desde_anterior_km' => 'decimal:2',
        'tiempo_desde_anterior_min' => 'integer',
        'tarifa_adulto' => 'integer',
        'tarifa_estudiante' => 'integer',
        'tarifa_tercera_edad' => 'integer',
    ];

    public function ruta(): BelongsTo
    {
        return $this->belongsTo(Ruta::class);
    }
}