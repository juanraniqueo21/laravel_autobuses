<?php

namespace App\Http\Controllers;

use App\Models\Liquidacion;
use App\Models\Empleado;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;
use Barryvdh\DomPDF\Facade\Pdf;

class LiquidacionController extends Controller
{
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
        $rolId = $user->rol_id;

        // Validar permisos (Admin=1, Gerente=2, RRHH=6)
        if (!in_array($rolId, [1, 2, 6])) {
            return response()->json(['error' => 'No tiene permisos para ver liquidaciones'], 403);
        }

        $query = Liquidacion::with(['empleado.user']);

        // Filtros opcionales
        if ($request->has('empleado_id')) {
            $query->where('empleado_id', $request->empleado_id);
        }

        if ($request->has('estado')) {
            $query->where('estado', $request->estado);
        }

        if ($request->has('periodo_desde') && $request->has('periodo_hasta')) {
            $query->porPeriodo($request->periodo_desde, $request->periodo_hasta);
        }

        if ($request->has('anio')) {
            $query->whereYear('periodo_desde', $request->anio);
        }

        if ($request->has('mes')) {
            $query->whereMonth('periodo_desde', $request->mes);
        }

        $liquidaciones = $query->orderBy('periodo_desde', 'desc')
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json($liquidaciones);
    }

    /**
     * Mostrar una liquidación específica
     */
    public function show($id)
    {
        $user = Auth::user();
        $rolId = $user->rol_id;

        if (!in_array($rolId, [1, 2, 6])) {
            return response()->json(['error' => 'No tiene permisos'], 403);
        }

        $liquidacion = Liquidacion::with(['empleado.user', 'empleado.afp', 'empleado.isapre'])
            ->findOrFail($id);

        return response()->json($liquidacion);
    }

    /**
     * Crear nueva liquidación (solo Admin y RRHH)
     */
    public function store(Request $request)
    {
        $user = Auth::user();
        $rolId = $user->rol_id;

        if (!in_array($rolId, [1, 6])) {
            return response()->json(['error' => 'No tiene permisos para crear liquidaciones'], 403);
        }

        $validated = $request->validate([
            'empleado_id' => 'required|exists:empleados,id',
            'periodo_desde' => 'required|date',
            'periodo_hasta' => 'required|date|after_or_equal:periodo_desde',
            'sueldo_base' => 'required|integer|min:0',
            'descuento_afp' => 'nullable|integer|min:0',
            'descuento_isapre' => 'nullable|integer|min:0',
            'descuento_impuesto_renta' => 'nullable|integer|min:0',
            'descuento_seguro_desempleo' => 'nullable|integer|min:0',
            'otros_descuentos' => 'nullable|integer|min:0',
            'bonificaciones' => 'nullable|integer|min:0',
            'horas_extras_valor' => 'nullable|integer|min:0',
            'estado' => 'nullable|in:borrador,procesada,pagada,cancelada',
            'fecha_pago' => 'nullable|date',
            'observaciones' => 'nullable|string',
        ]);

        DB::beginTransaction();
        try {
            // Calcular sueldo líquido
            $totalHaberes = $validated['sueldo_base'] 
                + ($validated['bonificaciones'] ?? 0) 
                + ($validated['horas_extras_valor'] ?? 0);

            $totalDescuentos = ($validated['descuento_afp'] ?? 0)
                + ($validated['descuento_isapre'] ?? 0)
                + ($validated['descuento_impuesto_renta'] ?? 0)
                + ($validated['descuento_seguro_desempleo'] ?? 0)
                + ($validated['otros_descuentos'] ?? 0);

            $validated['sueldo_liquido'] = $totalHaberes - $totalDescuentos;

            // Generar número de comprobante si está procesada o pagada
            if (in_array($validated['estado'] ?? 'borrador', ['procesada', 'pagada'])) {
                $validated['numero_comprobante'] = Liquidacion::generarNumeroComprobante();
            }

            $liquidacion = Liquidacion::create($validated);

            DB::commit();

            return response()->json([
                'message' => 'Liquidación creada exitosamente',
                'liquidacion' => $liquidacion->load(['empleado.user'])
            ], 201);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['error' => 'Error al crear liquidación: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Actualizar liquidación (solo Admin y RRHH)
     */
    public function update(Request $request, $id)
    {
        $user = Auth::user();
        $rolId = $user->rol_id;

        if (!in_array($rolId, [1, 6])) {
            return response()->json(['error' => 'No tiene permisos para editar liquidaciones'], 403);
        }

        $liquidacion = Liquidacion::findOrFail($id);

        // No permitir editar si ya está pagada
        if ($liquidacion->estado === 'pagada') {
            return response()->json(['error' => 'No se puede editar una liquidación pagada'], 400);
        }

        $validated = $request->validate([
            'periodo_desde' => 'sometimes|date',
            'periodo_hasta' => 'sometimes|date|after_or_equal:periodo_desde',
            'sueldo_base' => 'sometimes|integer|min:0',
            'descuento_afp' => 'nullable|integer|min:0',
            'descuento_isapre' => 'nullable|integer|min:0',
            'descuento_impuesto_renta' => 'nullable|integer|min:0',
            'descuento_seguro_desempleo' => 'nullable|integer|min:0',
            'otros_descuentos' => 'nullable|integer|min:0',
            'bonificaciones' => 'nullable|integer|min:0',
            'horas_extras_valor' => 'nullable|integer|min:0',
            'estado' => 'nullable|in:borrador,procesada,pagada,cancelada',
            'fecha_pago' => 'nullable|date',
            'observaciones' => 'nullable|string',
        ]);

        DB::beginTransaction();
        try {
            // Recalcular sueldo líquido si cambian montos
            if (isset($validated['sueldo_base']) || 
                isset($validated['bonificaciones']) || 
                isset($validated['horas_extras_valor']) ||
                isset($validated['descuento_afp']) ||
                isset($validated['descuento_isapre']) ||
                isset($validated['descuento_impuesto_renta']) ||
                isset($validated['descuento_seguro_desempleo']) ||
                isset($validated['otros_descuentos'])) {
                
                $totalHaberes = ($validated['sueldo_base'] ?? $liquidacion->sueldo_base)
                    + ($validated['bonificaciones'] ?? $liquidacion->bonificaciones)
                    + ($validated['horas_extras_valor'] ?? $liquidacion->horas_extras_valor);

                $totalDescuentos = ($validated['descuento_afp'] ?? $liquidacion->descuento_afp)
                    + ($validated['descuento_isapre'] ?? $liquidacion->descuento_isapre)
                    + ($validated['descuento_impuesto_renta'] ?? $liquidacion->descuento_impuesto_renta)
                    + ($validated['descuento_seguro_desempleo'] ?? $liquidacion->descuento_seguro_desempleo)
                    + ($validated['otros_descuentos'] ?? $liquidacion->otros_descuentos);

                $validated['sueldo_liquido'] = $totalHaberes - $totalDescuentos;
            }

            // Generar comprobante si cambia a procesada/pagada
            if (isset($validated['estado']) && 
                in_array($validated['estado'], ['procesada', 'pagada']) && 
                !$liquidacion->numero_comprobante) {
                $validated['numero_comprobante'] = Liquidacion::generarNumeroComprobante();
            }

            $liquidacion->update($validated);

            DB::commit();

            return response()->json([
                'message' => 'Liquidación actualizada exitosamente',
                'liquidacion' => $liquidacion->load(['empleado.user'])
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['error' => 'Error al actualizar liquidación: ' . $e->getMessage()], 500);
        }
    }

    /**
 * Eliminar liquidación
 * Este método REEMPLAZA al que tienes en LiquidacionController.php
 * 
 * Ubicación: backend/app/Http/Controllers/LiquidacionController.php
 * 
 * Permite eliminar liquidaciones en cualquier estado con permisos de Admin/RRHH
 */
public function destroy($id)
{
    $user = Auth::user();
    $rolId = $user->rol_id;

    // Solo Admin (1) y RRHH (6) pueden eliminar
    if (!in_array($rolId, [1, 6])) {
        return response()->json(['error' => 'No tiene permisos para eliminar liquidaciones'], 403);
    }

    $liquidacion = Liquidacion::with('empleado.user')->find($id);

    if (!$liquidacion) {
        return response()->json(['error' => 'Liquidación no encontrada'], 404);
    }

    try {
        // Guardar información para el log antes de eliminar
        $info = [
            'numero_comprobante' => $liquidacion->numero_comprobante,
            'empleado' => $liquidacion->empleado->user->nombre . ' ' . $liquidacion->empleado->user->apellido,
            'estado' => $liquidacion->estado,
            'monto' => $liquidacion->sueldo_liquido,
            'eliminado_por' => $user->nombre . ' ' . $user->apellido,
            'fecha_eliminacion' => now()->format('Y-m-d H:i:s')
        ];

        $liquidacion->delete();

        return response()->json([
            'success' => true,
            'message' => 'Liquidación eliminada exitosamente',
            'info' => $info
        ]);

    } catch (\Exception $e) {
        return response()->json([
            'error' => 'Error al eliminar liquidación: ' . $e->getMessage()
        ], 500);
    }
}

    /**
     * Exportar liquidación a PDF (Admin, Gerente, RRHH)
     */
    public function exportarPDF($id)
    {
        $user = Auth::user();
        $rolId = $user->rol_id;

        if (!in_array($rolId, [1, 2, 6])) {
            return response()->json(['error' => 'No tiene permisos'], 403);
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
     * Obtener estadísticas de liquidaciones (Dashboard)
     */
    public function estadisticas(Request $request)
    {
        $user = Auth::user();
        $rolId = $user->rol_id;

        if (!in_array($rolId, [1, 2, 6])) {
            return response()->json(['error' => 'No tiene permisos'], 403);
        }

        $mesActual = now()->month;
        $anioActual = now()->year;

        $stats = [
            'total_liquidaciones' => Liquidacion::count(),
            'liquidaciones_mes' => Liquidacion::whereMonth('periodo_desde', $mesActual)
                ->whereYear('periodo_desde', $anioActual)
                ->count(),
            'liquidaciones_pagadas' => Liquidacion::where('estado', 'pagada')->count(),
            'liquidaciones_pendientes' => Liquidacion::whereIn('estado', ['borrador', 'procesada'])->count(),
            'monto_total_pagado_mes' => Liquidacion::where('estado', 'pagada')
                ->whereMonth('fecha_pago', $mesActual)
                ->whereYear('fecha_pago', $anioActual)
                ->sum('sueldo_liquido'),
        ];

        return response()->json($stats);
    }

   /**
 * Calcular liquidación automáticamente basada en empleado
 * Este método REEMPLAZA al que tienes en LiquidacionController.php
 * 
 */
public function calcularLiquidacion(Request $request)
{
    $user = Auth::user();
    $rolId = $user->rol_id;

    // Solo Admin (1) y RRHH (6) pueden calcular
    if (!in_array($rolId, [1, 6])) {
        return response()->json(['error' => 'No tiene permisos'], 403);
    }

    $validated = $request->validate([
        'empleado_id' => 'required|exists:empleados,id',
        'periodo_desde' => 'required|date',
        'periodo_hasta' => 'required|date|after_or_equal:periodo_desde',
    ]);

    // Cargar empleado con relaciones
    $empleado = Empleado::with(['afp', 'isapre', 'user'])->findOrFail($validated['empleado_id']);

    // Sueldo base del empleado
    $sueldoBase = $empleado->salario_base;

    // ============================================
    // CÁLCULO DESCUENTO AFP
    // ============================================
    $descuentoAfp = 0;
    $nombreAfp = 'Sin AFP';
    $porcentajeAfp = 0;

    if ($empleado->afp && $empleado->afp->porcentaje_descuento) {
        $porcentajeAfp = floatval($empleado->afp->porcentaje_descuento);
        $descuentoAfp = intval($sueldoBase * ($porcentajeAfp / 100));
        $nombreAfp = $empleado->afp->nombre;
    }

    // ============================================
    // CÁLCULO DESCUENTO ISAPRE/FONASA
    // ============================================
    $descuentoIsapre = 0;
    $nombreSalud = 'Sin previsión';

    if ($empleado->isapre_id) {
        // Tiene Isapre privada - 7% del sueldo base es el mínimo legal
        $descuentoIsapre = intval($sueldoBase * 0.07);
        $nombreSalud = $empleado->isapre ? $empleado->isapre->nombre : 'Isapre';
    } elseif ($empleado->tipo_fonasa) {
        // Tiene Fonasa - 7% del sueldo base
        $descuentoIsapre = intval($sueldoBase * 0.07);
        $nombreSalud = 'Fonasa ' . $empleado->tipo_fonasa;
    }

    // ============================================
    // CÁLCULO SUELDO LÍQUIDO
    // ============================================
    $totalHaberes = $sueldoBase;
    $totalDescuentos = $descuentoAfp + $descuentoIsapre;
    $sueldoLiquido = $totalHaberes - $totalDescuentos;

    // ============================================
    // RESPUESTA CON DATOS CALCULADOS
    // ============================================
    $calculo = [
        'empleado_info' => [
            'id' => $empleado->id,
            'nombre' => $empleado->user->nombre . ' ' . $empleado->user->apellido,
            'numero_empleado' => $empleado->numero_empleado,
            'afp' => $nombreAfp,
            'isapre' => $nombreSalud,
            'tipo_fonasa' => $empleado->tipo_fonasa
        ],
        'sueldo_base' => $sueldoBase,
        'descuento_afp' => $descuentoAfp,
        'descuento_isapre' => $descuentoIsapre,
        'bonificaciones' => 0,
        'horas_extras_valor' => 0,
        'total_haberes' => $totalHaberes,
        'total_descuentos' => $totalDescuentos,
        'sueldo_liquido' => $sueldoLiquido,
        'detalles' => [
            'afp' => [
                'nombre' => $nombreAfp,
                'porcentaje' => $porcentajeAfp,
                'monto' => $descuentoAfp
            ],
            'salud' => [
                'nombre' => $nombreSalud,
                'porcentaje' => 7.0,
                'monto' => $descuentoIsapre
            ]
        ],
        'mensaje' => sprintf(
            'Cálculo realizado: Sueldo Base $%s | AFP %s (%s%%) $%s | Salud %s (7%%) $%s | Líquido $%s',
            number_format($sueldoBase, 0, ',', '.'),
            $nombreAfp,
            number_format($porcentajeAfp, 1),
            number_format($descuentoAfp, 0, ',', '.'),
            $nombreSalud,
            number_format($descuentoIsapre, 0, ',', '.'),
            number_format($sueldoLiquido, 0, ',', '.')
        )
    ];

    return response()->json($calculo);
}
    
}