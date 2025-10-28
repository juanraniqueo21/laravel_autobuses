<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Bus extends Model
{
    protected $table = 'buses';
    public $timestamps = true;
    protected $fillable = ['patente', 'marca', 'modelo', 'anio', 'capacidad', 'estado', 'proximaRevision'];
}
