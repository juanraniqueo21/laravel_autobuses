<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Carbon\Carbon;

class Reporte extends Model
{
    use HasFactory;

    protected $table = 'reportes';

    // ✅ CORRECCIÓN 1: El fillable debe coincidir con la migración y el controlador
    protected $fillable = [
        'empleado_id',
        'tipo',             // Antes: tipo_reporte
        'estado',
        'fecha_incidente',  // Antes: fecha_inicio
        'hora_incidente',
        'titulo',           // Faltaba
        'descripcion',
        'ubicacion',        // Faltaba
        'bus_id',           // Faltaba (crucial para mecánica)
        'ruta_id',          // Faltaba (crucial para operaciones)
        'gravedad',         // Faltaba
        'ruta_documento',   // Antes: documento_adjunto
        'nombre_documento', // Faltaba
        'revisado_por',
        'fecha_revision',
        'observaciones_revision'
    ];

    protected $casts = [
        'fecha_incidente' => 'date',
        'fecha_revision' => 'datetime',
        // 'hora_incidente' no se casta a datetime para mantener el formato H:i simple
    ];

    protected $appends = [
        'tipo_label',
        'estado_badge',
        'gravedad_label'
    ];

    // ============================================
    // RELACIONES
    // ============================================

    public function empleado()
    {
        return $this->belongsTo(Empleado::class, 'empleado_id');
    }

    public function revisor()
    {
        return $this->belongsTo(User::class, 'revisado_por');
    }

    // ✅ CORRECCIÓN 2: Agregamos relaciones con Bus y Ruta
    public function bus()
    {
        return $this->belongsTo(Bus::class, 'bus_id');
    }

    public function ruta()
    {
        return $this->belongsTo(Ruta::class, 'ruta_id');
    }

    // ============================================
    // ACCESSORS (GETTERS PARA FRONTEND)
    // ============================================

    /**
     * Etiqueta legible del tipo de reporte
     * Sincronizado con los selects del Frontend
     */
    public function getTipoLabelAttribute()
    {
        $labels = [
            'ausencia_enfermedad' => 'Ausencia por Enfermedad',
            'ausencia_personal' => 'Ausencia Personal',
            'incidente_ruta' => 'Incidente en Ruta',
            'problema_mecanico' => 'Problema Mecánico',
            'accidente_transito' => 'Accidente de Tránsito',
            'queja_pasajero' => 'Queja de Pasajero',
            'observacion_seguridad' => 'Observación de Seguridad',
            'otro' => 'Otro',
        ];

        return $labels[$this->tipo] ?? ucfirst(str_replace('_', ' ', $this->tipo));
    }

    /**
     * Badge de estado (útil si quieres renderizar badges desde backend)
     */
    public function getEstadoBadgeAttribute()
    {
        $badges = [
            'pendiente' => 'warning',
            'aprobado' => 'success',
            'rechazado' => 'danger',
        ];

        return $badges[$this->estado] ?? 'secondary';
    }

    /**
     * Etiqueta de gravedad
     */
    public function getGravedadLabelAttribute()
    {
        return ucfirst($this->gravedad);
    }

    // ============================================
    // SCOPES (FILTROS)
    // ============================================

    public function scopePendientes($query)
    {
        return $query->where('estado', 'pendiente');
    }

    public function scopePorEmpleado($query, $empleadoId)
    {
        return $query->where('empleado_id', $empleadoId);
    }

    public function scopePorTipo($query, $tipo)
    {
        return $query->where('tipo', $tipo);
    }

    public function scopeRecientes($query)
    {
        return $query->orderBy('fecha_incidente', 'desc');
    }
}