<?php

namespace App\Http\Controllers;

use App\Models\Empleado;
use App\Models\PermisoLicencia;
use App\Models\ReportHistory;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;
use Barryvdh\DomPDF\Facade\Pdf;

class RRHHController extends Controller
{
    private function registrarHistorialReporte(Request $request, string $tipo, string $archivo, array $extras = [])
    {
        $mes = $request->input('mes', Carbon::now()->month);
        $anio = $request->input('anio', Carbon::now()->year);

        ReportHistory::create([
            'tipo' => $tipo,
            'mes' => (int) $mes,
            'anio' => (int) $anio,
            'filtros' => array_merge([
                'mes' => (int) $mes,
                'anio' => (int) $anio,
            ], array_filter($extras, fn ($value) => $value !== null && $value !== '')),
            'archivo' => $archivo,
            'user_id' => Auth::id(),
        ]);
    }

    private function generarNotasRRHH(array $resumen, array $comparativa): array
    {
        $notas = [];

        if (($comparativa['licencias_actual'] ?? 0) > ($comparativa['licencias_anterior'] ?? 0)) {
            $notas[] = 'Las licencias aumentaron respecto al mes anterior.';
        } elseif (($comparativa['licencias_actual'] ?? 0) < ($comparativa['licencias_anterior'] ?? 0)) {
            $notas[] = 'Las licencias disminuyeron y se mantiene el control de ausentismo.';
        }

        if (($resumen['total_licencias'] ?? 0) > 0) {
            $promedioDias = ($resumen['total_dias'] ?? 0) / max(1, $resumen['total_licencias']);
            if ($promedioDias > 5) {
                $notas[] = 'Alta duración promedio de licencias por empleado (' . round($promedioDias, 1) . ' días).';
            }
        }

        if (($resumen['medicas'] ?? 0) > ($resumen['administrativas'] ?? 0)) {
            $notas[] = 'Las licencias médicas concentran la mayor parte del ausentismo.';
        } else {
            $notas[] = 'Las licencias administrativas y permisos representan un apoyo operativo relevante.';
        }

        return $notas;
    }

    /**
     * Alertas de contratos próximos a vencer
     * Retorna empleados con contrato "plazo_fijo" que vencen en los próximos 30 días
     */
    public function alertasContratos()
    {
        $hoy = Carbon::now();
        $limite = $hoy->copy()->addDays(30);

        $empleados = Empleado::with(['user'])
            ->where('tipo_contrato', 'plazo_fijo')
            ->where('estado', 'activo')
            ->whereNotNull('fecha_termino')
            ->whereBetween('fecha_termino', [$hoy, $limite])
            ->orderBy('fecha_termino', 'asc')
            ->get();

        $alertas = $empleados->map(function ($empleado) use ($hoy) {
            $diasRestantes = Carbon::parse($empleado->fecha_termino)->diffInDays($hoy);
            $severidad = $diasRestantes <= 7 ? 'critica' : ($diasRestantes <= 15 ? 'alta' : 'media');

            return [
                'id' => $empleado->id,
                'numero_empleado' => $empleado->numero_empleado,
                'nombre' => $empleado->user->nombre ?? 'N/A',
                'apellido' => $empleado->user->apellido ?? 'N/A',
                'email' => $empleado->user->email ?? 'N/A',
                'tipo_contrato' => $empleado->tipo_contrato,
                'fecha_contratacion' => $empleado->fecha_contratacion,
                'fecha_termino' => $empleado->fecha_termino,
                'dias_restantes' => $diasRestantes,
                'severidad' => $severidad,
                'salario_base' => $empleado->salario_base,
            ];
        });

        return response()->json([
            'success' => true,
            'data' => $alertas,
            'total' => $alertas->count(),
        ]);
    }

    /**
     * Ranking de empleados por cantidad de licencias
     * Ordena empleados por cantidad de licencias/permisos tomados
     */
    public function rankingLicencias(Request $request)
    {
        $ranking = $this->obtenerRankingLicenciasData($request);

        return response()->json([
            'success' => true,
            'data' => $ranking,
            'total' => $ranking->count(),
        ]);
    }

    private function obtenerRankingLicenciasData(Request $request)
    {
        $fechaInicio = $request->input('fecha_inicio');
        $fechaFin = $request->input('fecha_fin');
        $mes = $request->input('mes');
        $anio = $request->input('anio');

        if ($mes && $anio) {
            $fechaInicio = Carbon::create($anio, $mes, 1)->startOfMonth()->toDateString();
            $fechaFin = Carbon::create($anio, $mes, 1)->endOfMonth()->toDateString();
        }

        $query = DB::table('empleados')
            ->join('users', 'empleados.user_id', '=', 'users.id')
            ->leftJoin('permisos_licencias', function($join) use ($fechaInicio, $fechaFin) {
                $join->on('empleados.id', '=', 'permisos_licencias.empleado_id')
                     ->where('permisos_licencias.estado', '!=', 'rechazado');

                if ($fechaInicio && $fechaFin) {
                    $join->where(function($query) use ($fechaInicio, $fechaFin) {
                        $query->whereBetween('permisos_licencias.fecha_inicio', [$fechaInicio, $fechaFin])
                              ->orWhereBetween('permisos_licencias.fecha_termino', [$fechaInicio, $fechaFin])
                              ->orWhere(function($q) use ($fechaInicio, $fechaFin) {
                                  $q->where('permisos_licencias.fecha_inicio', '<=', $fechaInicio)
                                    ->where('permisos_licencias.fecha_termino', '>=', $fechaFin);
                              });
                    });
                }
            })
            ->select(
                'empleados.id',
                'empleados.numero_empleado',
                'empleados.tipo_contrato',
                'empleados.fecha_termino',
                'empleados.estado as estado_empleado',
                'users.nombre',
                'users.apellido',
                'users.email',
                DB::raw('COUNT(permisos_licencias.id) as total_licencias'),
                DB::raw('COALESCE(SUM(permisos_licencias.dias_totales), 0) as total_dias_licencia'),
                DB::raw("COUNT(CASE WHEN permisos_licencias.tipo = 'medica' THEN 1 END) as licencias_medicas"),
                DB::raw("COUNT(CASE WHEN permisos_licencias.tipo = 'administrativa' THEN 1 END) as licencias_administrativas"),
                DB::raw("COUNT(CASE WHEN permisos_licencias.tipo = 'permiso' THEN 1 END) as permisos")
            )
            ->where('empleados.estado', '!=', 'terminado')
            ->groupBy(
                'empleados.id',
                'empleados.numero_empleado',
                'empleados.tipo_contrato',
                'empleados.fecha_termino',
                'empleados.estado',
                'users.nombre',
                'users.apellido',
                'users.email'
            )
            ->orderByDesc('total_licencias')
            ->get();

        return $query->map(function ($item) {
            $esPlazofijo = $item->tipo_contrato === 'plazo_fijo';
            $tieneMuchasLicencias = $item->total_licencias >= 3;
            $diasExcesivos = $item->total_dias_licencia >= 15;

            $alerta_rendimiento = false;
            $motivo_alerta = [];

            if ($esPlazofijo && $tieneMuchasLicencias) {
                $alerta_rendimiento = true;
                $motivo_alerta[] = 'Alta cantidad de licencias para contrato plazo fijo';
            }

            if ($diasExcesivos) {
                $alerta_rendimiento = true;
                $motivo_alerta[] = "Excede {$item->total_dias_licencia} d�as de licencia";
            }

            return [
                'id' => $item->id,
                'numero_empleado' => $item->numero_empleado,
                'nombre_completo' => trim($item->nombre . ' ' . $item->apellido),
                'email' => $item->email,
                'tipo_contrato' => $item->tipo_contrato,
                'fecha_termino' => $item->fecha_termino,
                'estado_empleado' => $item->estado_empleado,
                'total_licencias' => (int) $item->total_licencias,
                'total_dias_licencia' => (int) $item->total_dias_licencia,
                'licencias_medicas' => (int) $item->licencias_medicas,
                'licencias_administrativas' => (int) $item->licencias_administrativas,
                'permisos' => (int) $item->permisos,
                'alerta_rendimiento' => $alerta_rendimiento,
                'motivo_alerta' => $motivo_alerta,
                'accion_sugerida' => $alerta_rendimiento ? 'Evaluar renovacion de contrato' : null,
            ];
        });
    }

    private function crearRequestParaMes($mes, $anio)
    {
        return Request::create('/', 'GET', ['mes' => $mes, 'anio' => $anio]);
    }

    private function calcularResumenRRHH($ranking)
    {
        $coleccion = collect($ranking);
        return [
            'total_licencias' => $coleccion->sum('total_licencias'),
            'total_dias' => $coleccion->sum('total_dias_licencia'),
            'medicas' => $coleccion->sum('licencias_medicas'),
            'administrativas' => $coleccion->sum('licencias_administrativas'),
            'permisos' => $coleccion->sum('permisos'),
        ];
    }

    private function obtenerComparativaRRHH(Request $request, $rankingActual)
    {
        $mes = $request->input('mes', Carbon::now()->month);
        $anio = $request->input('anio', Carbon::now()->year);

        $periodoActual = Carbon::create($anio, $mes, 1)->locale('es');
        $periodoAnterior = $periodoActual->copy()->subMonth()->locale('es');

        $rankingAnterior = $this->obtenerRankingLicenciasData(
            $this->crearRequestParaMes($periodoAnterior->month, $periodoAnterior->year)
        );

        return [
            'periodo_actual' => $periodoActual->isoFormat('MMMM YYYY'),
            'periodo_anterior' => $periodoAnterior->isoFormat('MMMM YYYY'),
            'licencias_actual' => collect($rankingActual)->sum('total_licencias'),
            'dias_actual' => collect($rankingActual)->sum('total_dias_licencia'),
            'licencias_anterior' => collect($rankingAnterior)->sum('total_licencias'),
            'dias_anterior' => collect($rankingAnterior)->sum('total_dias_licencia'),
        ];
    }

    private function obtenerAlertasCriticasRRHH($ranking, $limite = 4)
    {
        return collect($ranking)->filter(fn ($item) => $item['alerta_rendimiento'])->take($limite);
    }

    public function rankingLicenciasPdf(Request $request)
    {
        $ranking = $this->obtenerRankingLicenciasData($request);
        $resumen = $this->calcularResumenRRHH($ranking);
        $comparativa = $this->obtenerComparativaRRHH($request, $ranking);
        $alertasCriticas = $this->obtenerAlertasCriticasRRHH($ranking);
        $notas = $this->generarNotasRRHH($resumen, $comparativa);

        $pdf = Pdf::loadView('pdf.rrhh_ranking_licencias', [
            'ranking' => $ranking,
            'resumen' => $resumen,
            'comparativa' => $comparativa,
            'alertasCriticas' => $alertasCriticas,
            'notas' => $notas,
            'filtros' => [
                'mes' => $request->input('mes'),
                'anio' => $request->input('anio'),
            ],
        ])->setPaper('a4', 'landscape');

        $mes = $request->input('mes', Carbon::now()->month);
        $anio = $request->input('anio', Carbon::now()->year);
        $archivoHistorial = sprintf('rrhh-licencias-%04d-%02d.pdf', $anio, $mes);
        $this->registrarHistorialReporte($request, 'rrhh', $archivoHistorial);

        return $pdf->stream('ranking-licencias.pdf');
    }
    public function resumenContratos()
    {
        $resumen = Empleado::select('tipo_contrato', DB::raw('COUNT(*) as total'))
            ->where('estado', '!=', 'terminado')
            ->groupBy('tipo_contrato')
            ->get();

        $estadisticas = [
            'indefinido' => 0,
            'plazo_fijo' => 0,
            'practicante' => 0,
        ];

        foreach ($resumen as $item) {
            $estadisticas[$item->tipo_contrato] = $item->total;
        }

        $estadisticas['total_activos'] = array_sum($estadisticas);

        // Contratos que vencen en 30 días
        $hoy = Carbon::now();
        $limite = $hoy->copy()->addDays(30);
        $vencenProximo = Empleado::where('tipo_contrato', 'plazo_fijo')
            ->where('estado', 'activo')
            ->whereNotNull('fecha_termino')
            ->whereBetween('fecha_termino', [$hoy, $limite])
            ->count();

        $estadisticas['vencen_proximo_mes'] = $vencenProximo;

        return response()->json([
            'success' => true,
            'data' => $estadisticas,
        ]);
    }

    /**
     * Empleados con alto riesgo de no renovación
     * Cruza datos de contratos próximos a vencer + muchas licencias
     */
    public function empleadosAltoRiesgo()
    {
        $hoy = Carbon::now();
        $limite = $hoy->copy()->addDays(60); // 60 días de anticipación

        $empleados = DB::table('empleados')
            ->join('users', 'empleados.user_id', '=', 'users.id')
            ->leftJoin('permisos_licencias', function($join) {
                $join->on('empleados.id', '=', 'permisos_licencias.empleado_id')
                     ->where('permisos_licencias.estado', '!=', 'rechazado');
            })
            ->select(
                'empleados.id',
                'empleados.numero_empleado',
                'empleados.tipo_contrato',
                'empleados.fecha_termino',
                'empleados.fecha_contratacion',
                'empleados.estado',
                'users.nombre',
                'users.apellido',
                'users.email',
                DB::raw('COUNT(permisos_licencias.id) as total_licencias'),
                DB::raw('COALESCE(SUM(permisos_licencias.dias_totales), 0) as total_dias_licencia')
            )
            ->where('empleados.tipo_contrato', 'plazo_fijo')
            ->where('empleados.estado', 'activo')
            ->whereNotNull('empleados.fecha_termino')
            ->whereBetween('empleados.fecha_termino', [$hoy, $limite])
            ->groupBy(
                'empleados.id',
                'empleados.numero_empleado',
                'empleados.tipo_contrato',
                'empleados.fecha_termino',
                'empleados.fecha_contratacion',
                'empleados.estado',
                'users.nombre',
                'users.apellido',
                'users.email'
            )
            ->havingRaw('COUNT(permisos_licencias.id) >= 3') // Al menos 3 licencias
            ->orderBy('empleados.fecha_termino', 'asc')
            ->get();

        $resultado = $empleados->map(function ($item) use ($hoy) {
            $diasRestantes = Carbon::parse($item->fecha_termino)->diffInDays($hoy);

            return [
                'id' => $item->id,
                'numero_empleado' => $item->numero_empleado,
                'nombre_completo' => trim($item->nombre . ' ' . $item->apellido),
                'email' => $item->email,
                'fecha_contratacion' => $item->fecha_contratacion,
                'fecha_termino' => $item->fecha_termino,
                'dias_restantes' => $diasRestantes,
                'total_licencias' => (int) $item->total_licencias,
                'total_dias_licencia' => (int) $item->total_dias_licencia,
                'recomendacion' => 'Evaluar renovación - Alto ausentismo',
                'severidad' => $diasRestantes <= 30 ? 'critica' : 'alta',
            ];
        });

        return response()->json([
            'success' => true,
            'data' => $resultado,
            'total' => $resultado->count(),
        ]);
    }

    /**
     * Obtener evolución temporal de licencias por mes
     * Para gráfico de líneas que muestra tendencias
     */
    public function evolucionLicenciasPorMes(Request $request)
    {
        try {
            $anio = $request->input('anio', date('Y'));
            $mesesAtras = $request->input('meses', 12); // Por defecto últimos 12 meses

            $resultado = [];

            for ($i = $mesesAtras - 1; $i >= 0; $i--) {
                $fecha = Carbon::now()->subMonths($i);
            $mes = $fecha->month;
            $year = $fecha->year;
            $mesTexto = $fecha->copy()->locale('es')->isoFormat('MMM YYYY');

                $inicioMes = Carbon::create($year, $mes, 1)->startOfMonth()->format('Y-m-d');
                $finMes = Carbon::create($year, $mes, 1)->endOfMonth()->format('Y-m-d');

                // Contar licencias que se solapen con este mes
                $licencias = DB::table('permisos_licencias')
                    ->where('estado', '!=', 'rechazado')
                    ->where(function($query) use ($inicioMes, $finMes) {
                        $query->whereBetween('fecha_inicio', [$inicioMes, $finMes])
                              ->orWhereBetween('fecha_termino', [$inicioMes, $finMes])
                              ->orWhere(function($q) use ($inicioMes, $finMes) {
                                  $q->where('fecha_inicio', '<=', $inicioMes)
                                    ->where('fecha_termino', '>=', $finMes);
                              });
                    })
                    ->select(
                        DB::raw('COUNT(id) as total_licencias'),
                        DB::raw('SUM(dias_totales) as total_dias')
                    )
                    ->first();

                // Contar empleados activos en ese mes
                $empleadosActivos = DB::table('empleados')
                    ->where('estado', 'activo')
                    ->where('fecha_contratacion', '<=', $finMes)
                    ->where(function($query) use ($finMes) {
                        $query->whereNull('fecha_termino')
                              ->orWhere('fecha_termino', '>=', $finMes);
                    })
                    ->count();

                $resultado[] = [
                'mes' => $mesTexto,
                    'mes_numero' => $mes,
                    'anio' => $year,
                    'total_licencias' => (int) ($licencias->total_licencias ?? 0),
                    'total_dias' => (int) ($licencias->total_dias ?? 0),
                    'empleados_activos' => $empleadosActivos,
                    'promedio_dias_por_empleado' => $empleadosActivos > 0
                        ? round(($licencias->total_dias ?? 0) / $empleadosActivos, 2)
                        : 0,
                ];
            }

            return response()->json([
                'success' => true,
                'data' => $resultado,
            ]);
        } catch (\Exception $e) {
            \Log::error('Error en evolucionLicenciasPorMes: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Error al obtener evolución de licencias',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
