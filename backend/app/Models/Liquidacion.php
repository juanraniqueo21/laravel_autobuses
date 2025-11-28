<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Liquidacion extends Model
{
    use HasFactory;

    protected $table = 'liquidaciones';

    protected $fillable = [
        'empleado_id',
        'periodo_desde',
        'periodo_hasta',
        'sueldo_base',
        'descuento_afp',
        'descuento_isapre',
        'descuento_impuesto_renta',      // Mantener en BD pero siempre 0
        'descuento_seguro_desempleo',    // Mantener en BD pero siempre 0
        'otros_descuentos',              // Mantener en BD pero siempre 0
        'bonificaciones',
        'horas_extras_valor',
        'sueldo_liquido',
        'estado',
        'fecha_pago',
        'numero_comprobante',
        'observaciones',
    ];

    protected $casts = [
        'periodo_desde' => 'date',
        'periodo_hasta' => 'date',
        'fecha_pago' => 'date',
        'sueldo_base' => 'integer',
        'descuento_afp' => 'integer',
        'descuento_isapre' => 'integer',
        'descuento_impuesto_renta' => 'integer',
        'descuento_seguro_desempleo' => 'integer',
        'otros_descuentos' => 'integer',
        'bonificaciones' => 'integer',
        'horas_extras_valor' => 'integer',
        'sueldo_liquido' => 'integer',
    ];

    // ============================================
    // RELACIONES
    // ============================================

    public function empleado()
    {
        return $this->belongsTo(Empleado::class, 'empleado_id');
    }

    // ============================================
    // SCOPES
    // ============================================

    public function scopePorPeriodo($query, $desde, $hasta)
    {
        return $query->whereBetween('periodo_desde', [$desde, $hasta]);
    }

    public function scopePorEstado($query, $estado)
    {
        return $query->where('estado', $estado);
    }

    public function scopePorEmpleado($query, $empleadoId)
    {
        return $query->where('empleado_id', $empleadoId);
    }

    // ============================================
    // MÉTODOS ESTÁTICOS
    // ============================================

    /**
     * Generar número de comprobante único
     */
    public static function generarNumeroComprobante()
    {
        $anio = date('Y');
        $mes = date('m');
        
        $ultimo = self::where('numero_comprobante', 'like', "LIQ-$anio$mes-%")
            ->orderBy('numero_comprobante', 'desc')
            ->first();

        if ($ultimo) {
            $partes = explode('-', $ultimo->numero_comprobante);
            $numero = intval(end($partes)) + 1;
        } else {
            $numero = 1;
        }

        return sprintf('LIQ-%s%s-%04d', $anio, $mes, $numero);
    }

    /**
     * Calcular descuento AFP
     * @param int $sueldoBase - Sueldo base en CLP
     * @param float $porcentaje - Porcentaje AFP (ej: 10.0 para 10%)
     * @return int - Monto del descuento
     */
    public static function calcularDescuentoAFP($sueldoBase, $porcentaje)
    {
        return intval($sueldoBase * ($porcentaje / 100));
    }

    /**
     * Calcular descuento Isapre/Fonasa (7% legal)
     * @param int $sueldoBase - Sueldo base en CLP
     * @return int - Monto del descuento
     */
    public static function calcularDescuentoIsapre($sueldoBase)
    {
        return intval($sueldoBase * 0.07);
    }

    /**
     * Calcular descuento seguro de desempleo (0.6% trabajador)
     * @param int $sueldoBase - Sueldo base en CLP
     * @return int - Monto del descuento
     * 
     * NOTA: Este método se mantiene por compatibilidad pero ya no se usa en el frontend
     */
    public static function calcularDescuentoSeguroDesempleo($sueldoBase)
    {
        return intval($sueldoBase * 0.006);
    }

    // ============================================
    // ACCESSORS
    // ============================================

    /**
     * Calcular total de haberes
     */
    public function getTotalHaberesAttribute()
    {
        return $this->sueldo_base + $this->bonificaciones + $this->horas_extras_valor;
    }

    /**
     * Calcular total de descuentos
     */
    public function getTotalDescuentosAttribute()
    {
        return $this->descuento_afp + $this->descuento_isapre;
    }

    /**
     * Obtener nombre del empleado
     */
    public function getNombreEmpleadoAttribute()
    {
        if ($this->empleado && $this->empleado->user) {
            return $this->empleado->user->nombre . ' ' . $this->empleado->user->apellido;
        }
        return 'N/A';
    }
}