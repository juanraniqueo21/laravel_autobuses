<?php

namespace App\Http\Controllers;

use App\Models\Bus;
use App\Models\Viaje;
use App\Models\AsignacionTurno;
use App\Models\Mantenimiento;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;
use Barryvdh\DomPDF\Facade\Pdf;

class ReportController extends Controller
{
    /**
     * Obtener estadísticas generales de logística
     * GET /api/reports/logistica
     */
    public function logistica(Request $request)
    {
        try {
            $mes = $request->query('mes', now()->month);
            $anio = $request->query('anio', now()->year);

            // Rango de fechas del mes
            $fechaInicio = Carbon::createFromDate($anio, $mes, 1)->startOfDay();
            $fechaFin = $fechaInicio->copy()->endOfMonth();

            // --- BUSES ---
            $totalBuses = Bus::count();
            $busesOperativos = Bus::where('estado', 'operativo')->count();
            $busesEnMantenimiento = Bus::where('estado', 'mantenimiento')->count();
            $busesDesmantelados = Bus::where('estado', 'desmantelado')->count();

            // --- TURNOS ---
            $totalTurnos = AsignacionTurno::whereBetween('fecha_turno', [$fechaInicio, $fechaFin])->count();
            $turnosCompletados = AsignacionTurno::whereBetween('fecha_turno', [$fechaInicio, $fechaFin])
                ->where('estado', 'completado')
                ->count();
            $turnosProgramados = AsignacionTurno::whereBetween('fecha_turno', [$fechaInicio, $fechaFin])
                ->where('estado', 'programado')
                ->count();
            $turnosCancelados = AsignacionTurno::whereBetween('fecha_turno', [$fechaInicio, $fechaFin])
                ->where('estado', 'cancelado')
                ->count();

            // --- VIAJES ---
            $totalViajes = Viaje::whereBetween('fecha_hora_salida', [$fechaInicio, $fechaFin])->count();
            $viajesCompletados = Viaje::whereBetween('fecha_hora_salida', [$fechaInicio, $fechaFin])
                ->where('estado', 'completado')
                ->count();
            $viajesProgramados = Viaje::whereBetween('fecha_hora_salida', [$fechaInicio, $fechaFin])
                ->where('estado', 'programado')
                ->count();
            $viajesCancelados = Viaje::whereBetween('fecha_hora_salida', [$fechaInicio, $fechaFin])
                ->where('estado', 'cancelado')
                ->count();

            // --- MANTENIMIENTOS ---
            $totalMantenimientos = Mantenimiento::whereBetween('fecha_inicio', [$fechaInicio, $fechaFin])->count();
            $mantenimientosCompletados = Mantenimiento::whereBetween('fecha_inicio', [$fechaInicio, $fechaFin])
                ->where('estado', 'completado')
                ->count();

            // Tasa de eficiencia
            $tasaEficiencia = $totalViajes > 0 ? round(($viajesCompletados / $totalViajes) * 100, 2) : 0;

            return response()->json([
                'success' => true,
                'data' => [
                    'periodo' => [
                        'mes' => $mes,
                        'anio' => $anio,
                        'fecha_inicio' => $fechaInicio->format('Y-m-d'),
                        'fecha_fin' => $fechaFin->format('Y-m-d'),
                    ],
                    'buses' => [
                        'total' => $totalBuses,
                        'operativos' => $busesOperativos,
                        'en_mantenimiento' => $busesEnMantenimiento,
                        'desmantelados' => $busesDesmantelados,
                    ],
                    'turnos' => [
                        'total' => $totalTurnos,
                        'completados' => $turnosCompletados,
                        'programados' => $turnosProgramados,
                        'cancelados' => $turnosCancelados,
                    ],
                    'viajes' => [
                        'total' => $totalViajes,
                        'completados' => $viajesCompletados,
                        'programados' => $viajesProgramados,
                        'cancelados' => $viajesCancelados,
                    ],
                    'mantenimientos' => [
                        'total' => $totalMantenimientos,
                        'completados' => $mantenimientosCompletados,
                    ],
                    'eficiencia' => $tasaEficiencia,
                ],
            ]);
        } catch (\Exception $e) {
            \Log::error('Error en logistica(): ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Error al obtener estadísticas: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Obtener datos para gráfico de viajes por día
     * GET /api/reports/viajes-por-dia
     */
    public function viajesPorDia(Request $request)
    {
        try {
            $mes = $request->query('mes', now()->month);
            $anio = $request->query('anio', now()->year);

            $fechaInicio = Carbon::createFromDate($anio, $mes, 1)->startOfDay();
            $fechaFin = $fechaInicio->copy()->endOfMonth();

            // Agrupar viajes por día
            $viajes = Viaje::select(
                DB::raw('DATE(fecha_hora_salida) as fecha'),
                DB::raw('COUNT(*) as total'),
                DB::raw("SUM(CASE WHEN estado = 'completado' THEN 1 ELSE 0 END) as completados"),
                DB::raw("SUM(CASE WHEN estado = 'programado' THEN 1 ELSE 0 END) as programados"),
                DB::raw("SUM(CASE WHEN estado = 'cancelado' THEN 1 ELSE 0 END) as cancelados")
            )
            ->whereBetween('fecha_hora_salida', [$fechaInicio, $fechaFin])
            ->groupBy(DB::raw('DATE(fecha_hora_salida)'))
            ->orderBy('fecha')
            ->get();

            $datos = $viajes->map(function ($item) {
                return [
                    'fecha' => Carbon::parse($item->fecha)->format('d/m'),
                    'dia' => Carbon::parse($item->fecha)->format('d'),
                    'total' => $item->total,
                    'completados' => $item->completados ?? 0,
                    'programados' => $item->programados ?? 0,
                    'cancelados' => $item->cancelados ?? 0,
                ];
            });

            return response()->json([
                'success' => true,
                'data' => $datos,
            ]);
        } catch (\Exception $e) {
            \Log::error('Error en viajesPorDia(): ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Error al obtener viajes por día: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Obtener datos para gráfico de estado de buses
     * GET /api/reports/estado-buses
     */
    public function estadoBuses(Request $request)
    {
        try {
            $datos = [
                [
                    'name' => 'Operativos',
                    'value' => Bus::where('estado', 'operativo')->count(),
                    'color' => '#10b981',
                ],
                [
                    'name' => 'En Mantenimiento',
                    'value' => Bus::where('estado', 'mantenimiento')->count(),
                    'color' => '#f59e0b',
                ],
                [
                    'name' => 'Desmantelados',
                    'value' => Bus::where('estado', 'desmantelado')->count(),
                    'color' => '#ef4444',
                ],
            ];

            return response()->json([
                'success' => true,
                'data' => $datos,
            ]);
        } catch (\Exception $e) {
            \Log::error('Error en estadoBuses(): ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Error al obtener estado de buses: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Obtener datos para gráfico de rutas más activas
     * GET /api/reports/rutas-activas
     */
    public function rutasActivas(Request $request)
    {
        try {
            $mes = $request->query('mes', now()->month);
            $anio = $request->query('anio', now()->year);

            $fechaInicio = Carbon::createFromDate($anio, $mes, 1)->startOfDay();
            $fechaFin = $fechaInicio->copy()->endOfMonth();

            $datos = Viaje::select(
                'ruta_id',
                DB::raw('COUNT(*) as total_viajes'),
                DB::raw("SUM(CASE WHEN estado = 'completado' THEN 1 ELSE 0 END) as completados")
            )
            ->whereBetween('fecha_hora_salida', [$fechaInicio, $fechaFin])
            ->with('ruta:id,nombre_ruta')
            ->groupBy('ruta_id')
            ->orderByDesc('total_viajes')
            ->limit(10)
            ->get()
            ->map(function ($item) {
                return [
                    'ruta' => $item->ruta?->nombre_ruta ?? 'Desconocida',
                    'total_viajes' => $item->total_viajes,
                    'completados' => $item->completados ?? 0,
                ];
            });

            return response()->json([
                'success' => true,
                'data' => $datos,
            ]);
        } catch (\Exception $e) {
            \Log::error('Error en rutasActivas(): ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Error al obtener rutas activas: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Obtener datos para gráfico de ocupación de buses
     * GET /api/reports/ocupacion-buses
     * 
     * CORREGIDO: Usa JOIN con asignaciones_turno porque viajes NO tiene bus_id directo
     */
    public function ocupacionBuses(Request $request)
    {
        try {
            $mes = $request->query('mes', now()->month);
            $anio = $request->query('anio', now()->year);

            $fechaInicio = Carbon::createFromDate($anio, $mes, 1)->startOfDay();
            $fechaFin = $fechaInicio->copy()->endOfMonth();

            // Ocupación por bus (a través de turnos)
            $datos = Bus::select(
                'buses.id',
                'buses.patente',
                DB::raw('COUNT(viajes.id) as total_viajes')
            )
            ->join('asignaciones_turno', 'buses.id', '=', 'asignaciones_turno.bus_id')
            ->join('viajes', 'asignaciones_turno.id', '=', 'viajes.asignacion_turno_id')
            ->whereBetween('viajes.fecha_hora_salida', [$fechaInicio, $fechaFin])
            ->where('viajes.estado', 'completado')
            ->where('buses.estado', 'operativo')
            ->groupBy('buses.id', 'buses.patente')
            ->orderByDesc('total_viajes')
            ->limit(10)
            ->get()
            ->map(function ($item) {
                return [
                    'patente' => $item->patente,
                    'viajes' => $item->total_viajes,
                ];
            });

            return response()->json([
                'success' => true,
                'data' => $datos,
            ]);
        } catch (\Exception $e) {
            \Log::error('Error en ocupacionBuses(): ' . $e->getMessage());
            \Log::error($e->getTraceAsString());
            return response()->json([
                'success' => false,
                'message' => 'Error al obtener ocupación de buses: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
 * Exportar reporte mensual a PDF
 * GET /api/reports/exportar-pdf
 */
public function exportarPDF(Request $request)
{
    try {
        $mes = $request->query('mes', now()->month);
        $anio = $request->query('anio', now()->year);

        // Obtener estadísticas
        $fechaInicio = Carbon::createFromDate($anio, $mes, 1)->startOfDay();
        $fechaFin = $fechaInicio->copy()->endOfMonth();

        $stats = [
            'periodo' => [
                'mes' => $mes,
                'anio' => $anio,
                'nombre_mes' => Carbon::createFromDate($anio, $mes, 1)->locale('es')->isoFormat('MMMM'),
            ],
            'buses' => [
                'total' => Bus::count(),
                'operativos' => Bus::where('estado', 'operativo')->count(),
                'en_mantenimiento' => Bus::where('estado', 'mantenimiento')->count(),
            ],
            'viajes' => [
                'total' => Viaje::whereBetween('fecha_hora_salida', [$fechaInicio, $fechaFin])->count(),
                'completados' => Viaje::whereBetween('fecha_hora_salida', [$fechaInicio, $fechaFin])
                    ->where('estado', 'completado')->count(),
                'cancelados' => Viaje::whereBetween('fecha_hora_salida', [$fechaInicio, $fechaFin])
                    ->where('estado', 'cancelado')->count(),
            ],
            'turnos' => [
                'total' => AsignacionTurno::whereBetween('fecha_turno', [$fechaInicio, $fechaFin])->count(),
                'completados' => AsignacionTurno::whereBetween('fecha_turno', [$fechaInicio, $fechaFin])
                    ->where('estado', 'completado')->count(),
            ],
            'mantenimientos' => [
                'total' => Mantenimiento::whereBetween('fecha_inicio', [$fechaInicio, $fechaFin])->count(),
                'completados' => Mantenimiento::whereBetween('fecha_inicio', [$fechaInicio, $fechaFin])
                    ->where('estado', 'completado')->count(),
            ],
        ];

        // CORREGIDO: Usar setPaper con orientación directamente
        $pdf = Pdf::loadView('reports.logistica', ['stats' => $stats])
            ->setPaper('a4', 'portrait'); // Orientación como segundo parámetro

        return $pdf->download("Reporte_Logistica_{$anio}_{$mes}.pdf");

    } catch (\Exception $e) {
        \Log::error('Error en exportarPDF(): ' . $e->getMessage());
        \Log::error($e->getTraceAsString());
        
        return response()->json([
            'success' => false,
            'message' => 'Error al generar PDF: ' . $e->getMessage(),
        ], 500);
    }
}
}