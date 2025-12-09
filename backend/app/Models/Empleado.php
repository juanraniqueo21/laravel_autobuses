<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;
use App\Models\User;

class Empleado extends Model
{
    protected $table = 'empleados';
    public $timestamps = true;
    
    protected $fillable = [
        'user_id',
        'foto',
        'numero_empleado',
        'numero_funcional',
        'fecha_contratacion',
        'fecha_termino',
        'motivo_termino',         // ← CAMBIO: nuevo campo agregado
        'observaciones_termino',  // ← CAMBIO: nuevo campo agregado
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
    // Dentro de la clase Empleado
    public function liquidaciones()
    {
        return $this->hasMany(Liquidacion::class, 'empleado_id');
    }

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
    // AUTO-GENERACIÓN DE NÚMEROS (NUEVO)
    // ============================================

    public static function generarNumeroEmpleado()
    { 
        // obtener el ultimo numero de empleado
        $ultimoEmpleado = self::where('numero_empleado', 'LIKE', 'E-%')
            ->orderBy('numero_empleado', 'desc')
            ->first();
        if ($ultimoEmpleado) {
            // se extrae el numero ""E-0001" -> 0001
            $partes = explode('-', $ultimoEmpleado->numero_empleado);
            $numero = intval(end($partes)) + 1;
        } else {
            $numero = 1;
    }
    //formato: E-0001
        return sprintf('E-%04d', $numero);
    }
    /**
     * Generar numero_funcional (dinámico según rol)
     * Formato: C-0001, A-0001, M-0001, G-0001, R-0001, ADM-0001
     */
    public static function generarNumeroFuncional($rolId)
    {
        // determinar prefijo segun rol
        $prefijos = self::obtenerPrefijoPorRol($rolId);
        // obtener el ultimo numero funcional con ese prefijo
        $ultimoFuncional = self::where('numero_funcional', 'LIKE', "$prefijos-%")
            ->orderBy('numero_funcional', 'desc')
            ->first();
            if ($ultimoFuncional) {
                // extraer el numero: "C-0001" -> 0001
                $partes = explode('-', $ultimoFuncional->numero_funcional);
                $numero = intval(end($partes)) + 1;
            } else {
                $numero = 1;
            }    
        //formato: C-0001, A-0001, M-0001, G-0001, R-0001, ADM-0001
        return sprintf('%s-%04d', $prefijos, $numero);

    }
    /**
     * Obtener prefijo según rol_id del usuario
     */
    public static function obtenerPrefijoPorRol($rolId)
    {
        $prefijos = [
            1 => 'ADM', // Administrador
            2 => 'G',   // Gerente
            3 => 'C',   // Conductor
            4 => 'M',   // Mecánico
            5 => 'A',   // Asistente
            6 => 'R',   // Recursos Humanos
        ];
        return $prefijos[$rolId] ?? 'E';// E por defecto(empleado general)
    }
    /**
     * boot method - auto-generar numeros al crear empleado y sincronizar estados
     */
    protected static function boot()
    {
        parent::boot();

        static::creating(function($empleado){
            // solo auto-genera si los campos estan vacios
            if (empty($empleado->numero_empleado)) {
                $empleado->numero_empleado = self::generarNumeroEmpleado();
            }
            if (empty($empleado->numero_funcional)) {
                //obtener rol del usuario
                $user = User::find($empleado->user_id);
                if ($user) {
                    $empleado->numero_funcional = self::generarNumeroFuncional($user->rol_id);
                }
            }
        });

        // ============================================
        // SINCRONIZACIÓN AUTOMÁTICA DE ESTADOS
        // ============================================
        /**
         * Cuando se actualiza el estado de un empleado,
         * sincronizar automáticamente con Conductor, Asistente y Mecánico
         */
        static::updated(function($empleado){
            // Solo sincronizar si el campo 'estado' fue modificado
            if ($empleado->wasChanged('estado')) {
                $nuevoEstado = $empleado->estado;

                // Sincronizar con Conductor (si existe)
                if ($empleado->conductor) {
                    $empleado->conductor->update(['estado' => $nuevoEstado]);
                }

                // Sincronizar con Asistente (si existe)
                if ($empleado->asistente) {
                    $empleado->asistente->update(['estado' => $nuevoEstado]);
                }

                // Sincronizar con Mecánico (si existe)
                if ($empleado->mecanico) {
                    $empleado->mecanico->update(['estado' => $nuevoEstado]);
                }

                \Log::info("Estado sincronizado para empleado #{$empleado->id}: {$nuevoEstado}");
            }
        });
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
