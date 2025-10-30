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
        'observaciones',
    ];

    protected $casts = [
        'fecha_certificacion' => 'date',
        'empleado_id' => 'integer',
    ];

    public function empleado(): BelongsTo
    {
        return $this->belongsTo(Empleado::class);
    }
}