<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

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
        'estado'
    ];
}
