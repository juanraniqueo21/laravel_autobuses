<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Asistente extends Model
{
    protected $table = 'asistentes';
    public $timestamps = true;

    protected $fillable = [
        'empleado_id',
        'fecha_inicio',
        'estado',
        'fecha_examen_ocupacional',
        
    ];

    protected $casts = [
        'fecha_inicio' => 'date',
        'empleado_id' => 'integer',
        'fecha_examen_ocupacional' => 'date',
    ];

    public function empleado(): BelongsTo
    {
        return $this->belongsTo(Empleado::class);
    }

    public function viajes(): HasMany
    {
        return $this->hasMany(Viaje::class, 'asistente_id');
    }
}