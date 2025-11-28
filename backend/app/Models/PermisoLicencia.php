<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PermisoLicencia extends Model
{
    use HasFactory;

    protected $table = 'permisos_licencias';

    protected $fillable = [
        'empleado_id',
        'tipo',
        'fecha_inicio',
        'fecha_termino',
        'dias_totales',
        'estado',
        'motivo',
        'ruta_archivo',
        'nombre_archivo',
        'aprobado_por',
        'fecha_respuesta',
        'rechazado_por',
        'motivo_rechazo',
        'observaciones',
    ];

    protected $casts = [
        'fecha_inicio' => 'date',
        'fecha_termino' => 'date',
        'fecha_respuesta' => 'datetime',
        'dias_totales' => 'integer',
    ];

    // ✅ AGREGAR ESTO: Valores por defecto
    protected $attributes = [
        'estado' => 'solicitado',
    ];

    // Relación con Empleado
    public function empleado()
    {
        return $this->belongsTo(Empleado::class, 'empleado_id');
    }

    // Relación con usuario que aprobó
    public function aprobador()
    {
        return $this->belongsTo(User::class, 'aprobado_por');
    }

    // Relación con usuario que rechazó
    public function rechazador()
    {
        return $this->belongsTo(User::class, 'rechazado_por');
    }

    // Scope para filtrar por empleado
    public function scopeDeEmpleado($query, $empleadoId)
    {
        return $query->where('empleado_id', $empleadoId);
    }

    // Scope para filtrar por estado
    public function scopeEstado($query, $estado)
    {
        return $query->where('estado', $estado);
    }

    // Scope para obtener licencias activas en un rango de fechas
    public function scopeActivasEnRango($query, $fechaInicio, $fechaTermino)
    {
        return $query->where('estado', '!=', 'rechazado')
            ->where(function ($q) use ($fechaInicio, $fechaTermino) {
                $q->whereBetween('fecha_inicio', [$fechaInicio, $fechaTermino])
                  ->orWhereBetween('fecha_termino', [$fechaInicio, $fechaTermino])
                  ->orWhere(function ($q2) use ($fechaInicio, $fechaTermino) {
                      $q2->where('fecha_inicio', '<=', $fechaInicio)
                         ->where('fecha_termino', '>=', $fechaTermino);
                  });
            });
    }

    // Método para verificar si hay conflicto de fechas
    public function tieneConflicto($empleadoId, $fechaInicio, $fechaTermino, $excluirId = null)
    {
        $query = self::where('empleado_id', $empleadoId)
            ->where('estado', '!=', 'rechazado')
            ->activasEnRango($fechaInicio, $fechaTermino);

        if ($excluirId) {
            $query->where('id', '!=', $excluirId);
        }

        return $query->exists();
    }
}