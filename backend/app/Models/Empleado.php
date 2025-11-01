<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Empleado extends Model
{
    protected $table = 'empleados';
    public $timestamps = true;
    
    protected $fillable = [
        'user_id',
        'foto',
        'numero_empleado',
        'fecha_contratacion',
        'fecha_termino',
        'tipo_contrato',
        'salario_base',
        'afp_id',
        'tipo_fonasa',           // ← CAMBIO: fonasa → tipo_fonasa
        'isapre_id',             // ← CAMBIO: isapre_nombre → isapre_id
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
        'salario_base' => 'integer',
        'afp_id' => 'integer',
        'isapre_id' => 'integer',
        'user_id' => 'integer',
    ];

    // ============================================
    // RELACIONES
    // ============================================

    /**
     * Relación: Empleado pertenece a un Usuario
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Relación: Empleado pertenece a un AFP
     */
    public function afp(): BelongsTo
    {
        return $this->belongsTo(Afp::class, 'afp_id');
    }

    /**
     * Relación: Empleado pertenece a una Isapre
     */
    public function isapre(): BelongsTo
    {
        return $this->belongsTo(Isapre::class, 'isapre_id');
    }

    /**
     * Relación: Empleado puede tener un Conductor
     */
    public function conductor(): HasOne
    {
        return $this->hasOne(Conductor::class);
    }

    /**
     * Relación: Empleado puede tener un Asistente
     */
    public function asistente(): HasOne
    {
        return $this->hasOne(Asistente::class);
    }

    /**
     * Relación: Empleado puede tener un Mecánico
     */
    public function mecanico(): HasOne
    {
        return $this->hasOne(Mecanico::class);
    }

    // ============================================
    // ACCEADORES (Getters)
    // ============================================

    /**
     * Obtener nombre completo del usuario
     */
    public function getNombreCompletoAttribute()
    {
        return $this->user ? $this->user->nombre . ' ' . $this->user->apellido : 'N/A';
    }

    /**
     * Obtener nombre AFP
     */
    public function getNombreAfpAttribute()
    {
        return $this->afp ? $this->afp->nombre : 'N/A';
    }

    /**
     * Obtener nombre Isapre
     */
    public function getNombreIsapreAttribute()
    {
        return $this->isapre ? $this->isapre->nombre : 'N/A';
    }

    /**
     * Formatear teléfono personal chileno
     */
    public function getPhoneFormattedAttribute()
    {
        if (!$this->telefono_personal) {
            return null;
        }

        $phone = preg_replace('/\D/', '', $this->telefono_personal);
        
        if (strlen($phone) === 9 && substr($phone, 0, 1) === '9') {
            return '+56 ' . substr($phone, 0, 1) . ' ' . substr($phone, 1, 4) . ' ' . substr($phone, 5);
        }
        
        return $this->telefono_personal;
    }

    /**
     * Formatear salario en CLP
     */
    public function getSalarioFormattedAttribute()
    {
        return '$' . number_format($this->salario_base, 0, ',', '.');
    }

    /**
     * Obtener descripción del tramo FONASA
     */
    public function getDescripcionFonasaAttribute()
    {
        $descripciones = [
            'A' => 'Personas de escasos recursos',
            'B' => 'Ingresos ≤ $529.000',
            'C' => 'Ingresos $529.001 - $772.340',
            'D' => 'Ingresos > $772.341',
        ];
        
        return $descripciones[$this->tipo_fonasa] ?? 'N/A';
    }

    // ============================================
    // SCOPES
    // ============================================

    /**
     * Scope: Filtrar empleados activos
     */
    public function scopeActivos($query)
    {
        return $query->where('estado', 'activo');
    }

    /**
     * Scope: Filtrar por estado
     */
    public function scopeByEstado($query, $estado)
    {
        return $query->where('estado', $estado);
    }

    /**
     * Scope: Filtrar por AFP
     */
    public function scopeByAfp($query, $afpId)
    {
        return $query->where('afp_id', $afpId);
    }

    /**
     * Scope: Filtrar por Isapre
     */
    public function scopeByIsapre($query, $isapreId)
    {
        return $query->where('isapre_id', $isapreId);
    }

    /**
     * Scope: Filtrar por tramo FONASA
     */
    public function scopeByTramoFonasa($query, $tramo)
    {
        return $query->where('tipo_fonasa', $tramo);
    }
}