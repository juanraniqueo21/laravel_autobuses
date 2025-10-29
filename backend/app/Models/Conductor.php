<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Conductor extends Model
{
    protected $table = 'conductores';
    public $timestamps = true;
    protected $fillable = [
        'empleado_id',
        'numero_licencia',
        'clase_licencia',
        'fecha_vencimiento_licencia',
        'puntos_licencia',
        'estado'
    ];
}