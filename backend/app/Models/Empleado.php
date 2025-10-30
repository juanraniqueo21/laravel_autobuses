<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Empleado extends Model
{
    protected $table = 'empleados';
    public $timestamps = true;
    
    protected $fillable = [
        'user_id',
        'numero_empleado',
        'fecha_contratacion',
        'fecha_termino',
        'tipo_contrato',
        'salario_base',
        'afp_id',
        'fonasa',
        'isapre_nombre',
        'numero_seguro_cesantia',
        'estado',
        'ciudad',
        'direccion',
        'telefono_personal',
        'fecha_nacimiento',
        'genero',
        'contacto_emergencia_nombre',
        'contacto_emergencia_telefono',
        'contacto_emergencia_relacion',
        'banco',
        'tipo_cuenta',
        'numero_cuenta',
    ];

    protected $casts = [
        'fecha_contratacion' => 'date',
        'fecha_termino' => 'date',
        'fecha_nacimiento' => 'date',
        'fonasa' => 'boolean',
        'salario_base' => 'integer',
        'afp_id' => 'integer',
        'user_id' => 'integer',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function conductor(): HasOne
    {
        return $this->hasOne(Conductor::class);
    }

    public function asistente(): HasOne
    {
        return $this->hasOne(Asistente::class);
    }

    public function mecanico(): HasOne
    {
        return $this->hasOne(Mecanico::class);
    }
}