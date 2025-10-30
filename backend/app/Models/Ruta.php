<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Ruta extends Model
{
    protected $table = 'rutas';
    public $timestamps = true;

    protected $fillable = [
        'nombre_ruta',
        'codigo_ruta',
        'punto_salida',
        'punto_destino',
        'distancia_km',
        'tiempo_estimado_minutos',
        'descripcion',
        'paradas',
        'estado',
        'tarifa',
    ];

    protected $casts = [
        'distancia_km' => 'decimal:2',
        'tiempo_estimado_minutos' => 'integer',
        'paradas' => 'json',
        'tarifa' => 'integer',
    ];

    public function viajes(): HasMany
    {
        return $this->hasMany(Viaje::class);
    }
}