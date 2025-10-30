<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Bus extends Model
{
    protected $table = 'buses';
    public $timestamps = true;

    protected $fillable = [
        'patente',
        'patente_verificador',
        'marca',
        'modelo',
        'anio',
        'numero_serie',
        'numero_motor',
        'capacidad_pasajeros',
        'fecha_adquisicion',
        'estado',
        'proxima_revision_tecnica',
        'ultima_revision_tecnica',
        'documento_revision_tecnica',
        'vencimiento_seguro',
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
        'vencimiento_seguro' => 'date',
        'anio' => 'integer',
        'capacidad_pasajeros' => 'integer',
        'kilometraje_original' => 'integer',
        'kilometraje_actual' => 'integer',
    ];

    public function viajes(): HasMany
    {
        return $this->hasMany(Viaje::class);
    }
}