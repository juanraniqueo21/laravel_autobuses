<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Mecanico extends Model
{
    protected $table = 'mecanicos';
    public $timestamps = true;

    protected $fillable = [
        'empleado_id',
        'numero_certificacion',
        'especialidad',
        'fecha_certificacion',
        'estado',
        'fecha_examen_ocupacional',
        'observaciones',
    ];

    protected $casts = [
        'fecha_certificacion' => 'date',
        'fecha_examen_ocupacional' => 'date',
        'empleado_id' => 'integer',
        'especialidad' => 'array', // <--- ESTO ES VITAL
    ];

    public function empleado(): BelongsTo
    {
        return $this->belongsTo(Empleado::class);
    }
}