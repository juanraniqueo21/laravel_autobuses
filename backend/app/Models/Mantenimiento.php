<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

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

    public function bus(): BelongsTo
    {
        return $this->belongsTo(Bus::class);
    }

    public function mecanico(): BelongsTo
    {
        return $this->belongsTo(Empleado::class, 'mecanico_id');
    }
}