<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOneThrough;
use App\Models\User;
use App\Models\Empleado;

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

    /**
     * Relación directa con User a través de Empleado
     */
    public function user(): HasOneThrough
    {
        return $this->hasOneThrough(
            User::class,
            Empleado::class,
            'id', // Foreign key on empleados table
            'id', // Foreign key on users table
            'empleado_id', // Local key on mecanicos table
            'user_id' // Local key on empleados table
        );
    }
}