<?php

namespace App\Http\Controllers;

use App\Models\Liquidacion;
use App\Models\Empleado;
use App\Models\Viaje;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;
use Barryvdh\DomPDF\Facade\Pdf;

class LiquidacionController extends Controller
{
    // ==========================================
    // PARÁMETROS ECONÓMICOS CHILE (PROYECCIÓN DIC 2025)
    // ==========================================
    const SUELDO_MINIMO       = 529000;
    const TOPE_GRATIFICACION  = 209396; // 4.75 * IMM / 12
    const VALOR_UTM           = 69260;  // Proyección para cálculo de Impuesto a la Renta
    
    public function __construct()
    {
        $this->middleware('auth:api');
    }

    /**
     * Obtener todas las liquidaciones con filtros
     */
    public function index(Request $request)
    {
        $user = Auth::user();
        // Permisos: Admin(1), Gerente(2), RRHH(6)
        if (!in_array($user->rol_id, [1, 2, 6])) {
            return response()->json(['error' => 'No autorizado'], 403);
        }

        $query = Liquidacion::with(['empleado.user']);

        if ($request->has('empleado_id')) {
            $query->where('empleado_id', $request->empleado_id);
        }
        if ($request->has('estado')) {
            $query->where('estado', $request->estado);
        }
        if ($request->has('mes') && $request->has('anio')) {
            $query->whereMonth('periodo_desde', $request->mes)
                  ->whereYear('periodo_desde', $request->anio);
        }

        return response()->json($query->orderBy('created_at', 'desc')->get());
    }

    /**
     * Mostrar una liquidación específica
     */
    public function show($id)
    {
        $liquidacion = Liquidacion::with(['empleado.user', 'empleado.afp', 'empleado.isapre'])
            ->findOrFail($id);

        return response()->json($liquidacion);
    }

    /**
     * Endpoint para SIMULAR la liquidación (sin guardar en BD)
     * Usado por el frontend para mostrar la "Previsualización"
     */
    public function calcularLiquidacion(Request $request)
    {
        $user = Auth::user();
        if (!in_array($user->rol_id, [1, 6])) {
            return response()->json(['error' => 'No tiene permisos'], 403);
        }

        $validated = $request->validate([
            'empleado_id'   => 'required|exists:empleados,id',
            'periodo_desde' => 'required|date',
            'periodo_hasta' => 'required|date|after_or_equal:periodo_desde',
        ]);

        $empleado = Empleado::with(['afp', 'isapre', 'user', 'conductor'])
            ->findOrFail($validated['empleado_id']);

        // Llamamos al motor interno de cálculo
        $calculo = $this->calcularLiquidacionInterno(
            $empleado,
            $validated['periodo_desde'],
            $validated['periodo_hasta']
        );

        return response()->json($calculo);
    }

    /**
     * Guarda una nueva liquidación calculando los montos en el BACKEND (Seguridad)
     */
    public function store(Request $request)
    {
        $user = Auth::user();
        if (!in_array($user->rol_id, [1, 6])) {
            return response()->json(['error' => 'No autorizado'], 403);
        }

        // Validar solo datos base, los montos los calculamos nosotros
        $validated = $request->validate([
            'empleado_id'   => 'required|exists:empleados,id',
            'periodo_desde' => 'required|date',
            'periodo_hasta' => 'required|date|after_or_equal:periodo_desde',
            'estado'        => 'nullable|string',
            'observaciones' => 'nullable|string',
        ]);

        $empleado = Empleado::with(['afp', 'isapre', 'user', 'conductor'])
            ->findOrFail($validated['empleado_id']);

        // RECALCULAR TODO EN EL BACKEND PARA EVITAR FRAUDE
        $calculo    = $this->calcularLiquidacionInterno(
            $empleado,
            $validated['periodo_desde'],
            $validated['periodo_hasta']
        );
        
        $haberes    = $calculo['haberes'];
        $descuentos = $calculo['descuentos'];
        $totales    = $calculo['totales'];

        DB::beginTransaction();

        try {
            $comprobante = Liquidacion::generarNumeroComprobante();

            $liquidacion = Liquidacion::create([
                'empleado_id'          => $validated['empleado_id'],
                'periodo_desde'        => $validated['periodo_desde'],
                'periodo_hasta'        => $validated['periodo_hasta'],
                'numero_comprobante'   => $comprobante,
                'estado'               => $validated['estado'] ?? 'procesada',

                // Haberes
                'sueldo_base'          => $haberes['sueldo_base'],
                // Sumamos gratificación + bono producción en "bonificaciones"
                'bonificaciones'       => ($haberes['gratificacion'] ?? 0) + ($haberes['bono_produccion'] ?? 0),
                'horas_extras_valor'   => 0, 

                // Descuentos (Guardamos los valores reales calculados)
                'descuento_afp'              => $descuentos['afp']['monto'] ?? 0,
                'descuento_isapre'           => $descuentos['salud']['monto'] ?? 0,
                'descuento_seguro_desempleo' => $descuentos['cesantia']['monto'] ?? 0,
                'descuento_impuesto_renta'   => $descuentos['impuesto']['monto'] ?? 0, // <--- AQUÍ SE GUARDA EL IMPUESTO ÚNICO

                // Totales
                'sueldo_liquido'       => $totales['sueldo_liquido'] ?? 0,
                'observaciones'        => $validated['observaciones'] ?? null,
            ]);

            DB::commit();

            return response()->json([
                'message' => 'Liquidación generada exitosamente',
                'data'    => $liquidacion,
                'calculo' => $calculo, // Retornamos el detalle para mostrar en frontend
            ], 201);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['error' => 'Error al guardar liquidación: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Actualizar liquidación (permite edición manual posterior)
     */
    public function update(Request $request, $id)
    {
        $user = Auth::user();
        if (!in_array($user->rol_id, [1, 6])) {
            return response()->json(['error' => 'No autorizado'], 403);
        }

        $liquidacion = Liquidacion::findOrFail($id);

        if ($liquidacion->estado === 'pagada') {
            return response()->json(['error' => 'No se puede editar una liquidación pagada'], 400);
        }

        $liquidacion->update($request->only([
            'periodo_desde', 'periodo_hasta', 'sueldo_base',
            'bonificaciones', 'descuento_afp', 'descuento_isapre',
            'descuento_seguro_desempleo', 'descuento_impuesto_renta',
            'sueldo_liquido', 'estado', 'observaciones'
        ]));

        return response()->json([
            'message' => 'Actualizada correctamente',
            'data'    => $liquidacion
        ]);
    }

    /**
     * Eliminar liquidación
     */
    public function destroy($id)
    {
        $user = Auth::user();
        if (!in_array($user->rol_id, [1, 6])) {
            return response()->json(['error' => 'No autorizado'], 403);
        }
          
        Liquidacion::destroy($id);

        return response()->json(['message' => 'Eliminado correctamente']);
    }

    /**
     * Exportar liquidación a PDF
     */
    public function exportarPDF($id)
    {
        $user = Auth::user();
        if (!in_array($user->rol_id, [1, 2, 6])) {
            return response()->json(['error' => 'No autorizado'], 403);
        }

        $liquidacion = Liquidacion::with(['empleado.user', 'empleado.afp', 'empleado.isapre'])
            ->findOrFail($id);

        $pdf = Pdf::loadView('liquidaciones.pdf', compact('liquidacion'))
            ->setPaper('letter', 'portrait');

        $filename = 'liquidacion_' . $liquidacion->numero_comprobante . '_' . 
                    $liquidacion->empleado->user->rut . '.pdf';

        return $pdf->download($filename);
    }

    /**
     * Estadísticas de liquidaciones (Dashboard)
     */
    public function estadisticas(Request $request)
    {
        $user = Auth::user();
        if (!in_array($user->rol_id, [1, 2, 6])) {
            return response()->json(['error' => 'No autorizado'], 403);
        }

        $mesActual  = now()->month;
        $anioActual = now()->year;

        $stats = [
            'total_liquidaciones'      => Liquidacion::count(),
            'liquidaciones_mes'        => Liquidacion::whereMonth('periodo_desde', $mesActual)
                ->whereYear('periodo_desde', $anioActual)
                ->count(),
            'liquidaciones_pagadas'    => Liquidacion::where('estado', 'pagada')->count(),
            'liquidaciones_pendientes' => Liquidacion::whereIn('estado', ['borrador', 'procesada'])->count(),
            'monto_total_pagado_mes'   => Liquidacion::where('estado', 'pagada')
                ->whereMonth('fecha_pago', $mesActual)
                ->whereYear('fecha_pago', $anioActual)
                ->sum('sueldo_liquido'),
        ];

        return response()->json($stats);
    }

    // ==========================================================
    // 🧠 MOTOR REAL DE CÁLCULO (LÓGICA INGENIERIL, LEGAL Y TRIBUTARIA)
    // Este método centraliza la inteligencia del negocio.
    // ==========================================================
    private function calcularLiquidacionInterno(Empleado $empleado, string $desde, string $hasta): array
    {
        $sueldoBase = $empleado->salario_base;

        $warnings = [];
        if ($sueldoBase < self::SUELDO_MINIMO) {
            $warnings[] = 'El sueldo base está bajo el mínimo legal ($' . number_format(self::SUELDO_MINIMO,0,',','.') . ').';
        }

        // ----------------------------------------------------
        // 1. PRODUCTIVIDAD (Gestión de Flota)
        // ----------------------------------------------------
        $bonoProductividad = 0;
        $viajesRealizados  = 0;
        $recaudacionTotal  = 0;
        $detalleProduccion = "Sueldo Fijo / Administrativo";

        if ($empleado->conductor) {
            $conductorId = $empleado->conductor->id;

            // Buscamos viajes completados en el periodo
            $viajes = Viaje::where('conductor_id', $conductorId)
                ->whereBetween('fecha_hora_salida', [$desde, $hasta])
                ->where('estado', 'completado')
                ->get();

            $viajesRealizados = $viajes->count();
            $recaudacionTotal = $viajes->sum('dinero_recaudado'); 

            if ($recaudacionTotal > 0) {
                // Lógica A: 5% de comisión sobre lo recaudado
                $bonoProductividad = intval($recaudacionTotal * 0.05);
                $detalleProduccion = "Comisión 5% sobre $" . number_format($recaudacionTotal, 0, ',', '.');
            } elseif ($viajesRealizados > 0) {
                // Lógica B (Fallback): $5.000 por vuelta si no hay monto recaudado registrado
                $bonoProductividad = $viajesRealizados * 5000;
                $detalleProduccion = "Bono por vuelta ($5.000 x $viajesRealizados viajes)";
            } else {
                $detalleProduccion = "Sin viajes completados en el periodo.";
            }
        }

        // ----------------------------------------------------
        // 2. GRATIFICACIÓN LEGAL (Cumplimiento Normativo Art 50)
        // ----------------------------------------------------
        $gratificacion = intval($sueldoBase * 0.25);
        if ($gratificacion > self::TOPE_GRATIFICACION) {
            $gratificacion = self::TOPE_GRATIFICACION;
        }

        // ----------------------------------------------------
        // 3. SUELDO IMPONIBLE TOTAL
        // ----------------------------------------------------
        $sueldoImponible = $sueldoBase + $gratificacion + $bonoProductividad;

        // ----------------------------------------------------
        // 4. DESCUENTOS PREVISIONALES
        // ----------------------------------------------------

        // --- AFP ---
        $descuentoAfp       = 0;
        $nombreAfp          = 'Sin AFP';
        $porcentajeAfpTotal = 0;

        if ($empleado->afp) {
            $porcentajeComision = floatval($empleado->afp->porcentaje_descuento); 
            // CORRECCIÓN CRÍTICA: Sumamos el 10% obligatorio a la comisión de la AFP
            $porcentajeAfpTotal = 10.0 + $porcentajeComision; 
            $descuentoAfp       = intval($sueldoImponible * ($porcentajeAfpTotal / 100));
            $nombreAfp          = $empleado->afp->nombre;
        }

        // --- SALUD (7% Mínimo) ---
        $descuentoIsapre  = 0;
        $nombreSalud      = 'Sin previsión';
        $porcentajeSalud  = 0;

        if ($empleado->isapre_id || $empleado->tipo_fonasa) {
            $porcentajeSalud = 7.0;
            $descuentoIsapre = intval($sueldoImponible * 0.07);

            if ($empleado->isapre_id && $empleado->isapre) {
                $nombreSalud = $empleado->isapre->nombre;
            } else {
                $nombreSalud = 'Fonasa ' . ($empleado->tipo_fonasa ?? '');
            }
        }

        // --- SEGURO CESANTÍA (0.6%) ---
        $descuentoCesantia = 0;
        // Asumimos contrato indefinido (0.6% cargo trabajador)
        $descuentoCesantia = intval($sueldoImponible * 0.006);

        $totalPrevisional = $descuentoAfp + $descuentoIsapre + $descuentoCesantia;

        // ----------------------------------------------------
        // 5. CÁLCULO IMPUESTO ÚNICO (SEGÚN TABLA SII)
        // ----------------------------------------------------
        $sueldoTributable = $sueldoImponible - $totalPrevisional;
        $impuestoRenta = 0;
        
        // Tabla Simplificada Diciembre 2025 (Tramo 1: Exento hasta 13.5 UTM)
        $topeExento = 13.5 * self::VALOR_UTM; 
        
        if ($sueldoTributable > $topeExento) {
            // Factor 0.04 para el segundo tramo
            $montoAfecto = $sueldoTributable - $topeExento;
            $impuestoRenta = intval($montoAfecto * 0.04);
        }

        // ----------------------------------------------------
        // 6. TOTALES FINALES
        // ----------------------------------------------------
        $totalHaberes    = $sueldoImponible; // Sumar aquí movilización/colación si los tienes en BD
        $totalDescuentos = $totalPrevisional + $impuestoRenta;
        $sueldoLiquido   = $totalHaberes - $totalDescuentos;

        return [
            'empleado_info' => [
                'id'     => $empleado->id,
                'nombre' => $empleado->user->nombre . ' ' . $empleado->user->apellido,
                'rut'    => $empleado->user->rut,
                'cargo'  => $empleado->conductor ? 'Conductor' : 'Administrativo',
                'afp'    => $nombreAfp,
                'salud'  => $nombreSalud,
            ],
            'haberes' => [
                'sueldo_base'     => $sueldoBase,
                'gratificacion'   => $gratificacion,
                'bono_produccion' => $bonoProductividad,
                'total_imponible' => $totalHaberes,
            ],
            'descuentos' => [
                'afp' => [
                    'nombre' => $nombreAfp,
                    'tasa'   => $porcentajeAfpTotal,
                    'monto'  => $descuentoAfp,
                ],
                'salud' => [
                    'nombre' => $nombreSalud,
                    'tasa'   => $porcentajeSalud,
                    'monto'  => $descuentoIsapre,
                ],
                'cesantia' => [
                    'nombre' => 'Seguro Cesantía (AFC)',
                    'tasa'   => 0.6,
                    'monto'  => $descuentoCesantia,
                ],
                'impuesto' => [
                    'nombre' => 'Impuesto Único (SII)',
                    'monto'  => $impuestoRenta
                ],
                'total' => $totalDescuentos,
            ],
            'totales' => [
                'sueldo_liquido' => $sueldoLiquido,
            ],
            'kpi_produccion' => [
                'viajes_mes'  => $viajesRealizados,
                'recaudacion' => $recaudacionTotal,
                'detalle'     => $detalleProduccion,
            ],
            'warnings' => $warnings,
            'mensaje' => sprintf(
                'Líquido a Pagar: $%s (Incl. Impuesto $%s)',
                number_format($sueldoLiquido, 0, ',', '.'),
                number_format($impuestoRenta, 0, ',', '.')
            ),
        ];
    }
}