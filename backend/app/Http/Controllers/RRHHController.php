<?php

namespace App\Http\Controllers;

use App\Models\Empleado;
use App\Models\PermisoLicencia;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class RRHHController extends Controller
{
    /**
     * Alertas de contratos próximos a vencer
     * Retorna empleados con contrato "plazo_fijo" que vencen en los próximos 30 días
     * Filtros: tipo_contrato, estado_empleado, fecha_inicio, fecha_fin, severidad, buscar
     */
    public function alertasContratos(Request $request)
    {
        $hoy = Carbon::now();
        $diasVencimiento = $request->input('dias_vencimiento', 30); // Configurable
        $limite = $hoy->copy()->addDays($diasVencimiento);

        $query = Empleado::with(['user'])
            ->whereNotNull('fecha_termino');

        // Filtro por tipo de contrato
        if ($request->has('tipo_contrato') && $request->tipo_contrato) {
            $query->where('tipo_contrato', $request->tipo_contrato);
        } else {
            // Por defecto solo plazo_fijo
            $query->where('tipo_contrato', 'plazo_fijo');
        }

        // Filtro por estado del empleado
        if ($request->has('estado_empleado') && $request->estado_empleado) {
            $query->where('estado', $request->estado_empleado);
        } else {
            $query->where('estado', 'activo');
        }

        // Filtro por rango de fechas de término
        if ($request->has('fecha_inicio') && $request->fecha_inicio) {
            $query->where('fecha_termino', '>=', $request->fecha_inicio);
        } else {
            $query->where('fecha_termino', '>=', $hoy);
        }

        if ($request->has('fecha_fin') && $request->fecha_fin) {
            $query->where('fecha_termino', '<=', $request->fecha_fin);
        } else {
            $query->where('fecha_termino', '<=', $limite);
        }

        // Búsqueda por nombre/email
        if ($request->has('buscar') && $request->buscar) {
            $buscar = $request->buscar;
            $query->whereHas('user', function($q) use ($buscar) {
                $q->where('nombre', 'LIKE', "%{$buscar}%")
                  ->orWhere('apellido', 'LIKE', "%{$buscar}%")
                  ->orWhere('email', 'LIKE', "%{$buscar}%");
            });
        }

        $empleados = $query->orderBy('fecha_termino', 'asc')->get();

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

        // Filtro por severidad (post-procesamiento)
        if ($request->has('severidad') && $request->severidad) {
            $alertas = $alertas->filter(function($alerta) use ($request) {
                return $alerta['severidad'] === $request->severidad;
            })->values();
        }

        return response()->json([
            'success' => true,
            'data' => $alertas,
            'total' => $alertas->count(),
            'filtros_aplicados' => $request->all(),
        ]);
    }

    /**
     * Ranking de empleados por cantidad de licencias
     * Ordena empleados por cantidad de licencias/permisos tomados
     */
    public function rankingLicencias(Request $request)
    {
        // Parámetros opcionales para filtrar por fecha
        $fechaInicio = $request->input('fecha_inicio');
        $fechaFin = $request->input('fecha_fin');

        $query = DB::table('empleados')
            ->join('users', 'empleados.user_id', '=', 'users.id')
            ->leftJoin('permisos_licencias', function($join) use ($fechaInicio, $fechaFin) {
                $join->on('empleados.id', '=', 'permisos_licencias.empleado_id')
                     ->where('permisos_licencias.estado', '!=', 'rechazado');

                if ($fechaInicio) {
                    $join->where('permisos_licencias.fecha_inicio', '>=', $fechaInicio);
                }
                if ($fechaFin) {
                    $join->where('permisos_licencias.fecha_inicio', '<=', $fechaFin);
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

        $ranking = $query->map(function ($item) {
            // Calcular alerta de rendimiento
            $esPlazofijo = $item->tipo_contrato === 'plazo_fijo';
            $tieneMuchasLicencias = $item->total_licencias >= 3; // Umbral configurable
            $diasExcesivos = $item->total_dias_licencia >= 15; // Umbral configurable

            $alerta_rendimiento = false;
            $motivo_alerta = [];

            if ($esPlazofijo && $tieneMuchasLicencias) {
                $alerta_rendimiento = true;
                $motivo_alerta[] = 'Alta cantidad de licencias para contrato plazo fijo';
            }

            if ($diasExcesivos) {
                $alerta_rendimiento = true;
                $motivo_alerta[] = "Excede {$item->total_dias_licencia} días de licencia";
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
                'accion_sugerida' => $alerta_rendimiento ? 'Evaluar renovación de contrato' : null,
            ];
        });

        return response()->json([
            'success' => true,
            'data' => $ranking,
            'total' => $ranking->count(),
        ]);
    }

    /**
     * Resumen de contratos por tipo
     * Retorna conteo de empleados por tipo de contrato
     * Filtros: estado_empleado, fecha_inicio, fecha_fin
     */
    public function resumenContratos(Request $request)
    {
        $query = Empleado::query();

        // Filtro por estado del empleado
        if ($request->has('estado_empleado') && $request->estado_empleado) {
            $query->where('estado', $request->estado_empleado);
        } else {
            $query->where('estado', '!=', 'terminado');
        }

        // Filtro por rango de fechas de contratación
        if ($request->has('fecha_inicio') && $request->fecha_inicio) {
            $query->where('fecha_contratacion', '>=', $request->fecha_inicio);
        }

        if ($request->has('fecha_fin') && $request->fecha_fin) {
            $query->where('fecha_contratacion', '<=', $request->fecha_fin);
        }

        $resumen = $query->select('tipo_contrato', DB::raw('COUNT(*) as total'))
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

        // Contratos que vencen en 30 días (o rango personalizado)
        $hoy = Carbon::now();
        $diasVencimiento = $request->input('dias_vencimiento', 30);
        $limite = $hoy->copy()->addDays($diasVencimiento);

        $vencenProximo = Empleado::where('tipo_contrato', 'plazo_fijo')
            ->where('estado', 'activo')
            ->whereNotNull('fecha_termino')
            ->whereBetween('fecha_termino', [$hoy, $limite])
            ->count();

        $estadisticas['vencen_proximo_mes'] = $vencenProximo;

        return response()->json([
            'success' => true,
            'data' => $estadisticas,
            'filtros_aplicados' => $request->all(),
        ]);
    }

    /**
     * Empleados con alto riesgo de no renovación
     * Cruza datos de contratos próximos a vencer + muchas licencias
     * Filtros: dias_vencimiento, min_licencias, tipo_contrato, estado_empleado
     */
    public function empleadosAltoRiesgo(Request $request)
    {
        $hoy = Carbon::now();
        $diasVencimiento = $request->input('dias_vencimiento', 60);
        $minLicencias = $request->input('min_licencias', 3);
        $limite = $hoy->copy()->addDays($diasVencimiento);

        $query = DB::table('empleados')
            ->join('users', 'empleados.user_id', '=', 'users.id')
            ->leftJoin('permisos_licencias', function($join) use ($request) {
                $join->on('empleados.id', '=', 'permisos_licencias.empleado_id')
                     ->where('permisos_licencias.estado', '!=', 'rechazado');

                // Filtro por tipo de licencia
                if ($request->has('tipo_licencia') && $request->tipo_licencia) {
                    $join->where('permisos_licencias.tipo', $request->tipo_licencia);
                }

                // Filtro por rango de fechas de licencias
                if ($request->has('fecha_inicio') && $request->fecha_inicio) {
                    $join->where('permisos_licencias.fecha_inicio', '>=', $request->fecha_inicio);
                }

                if ($request->has('fecha_fin') && $request->fecha_fin) {
                    $join->where('permisos_licencias.fecha_inicio', '<=', $request->fecha_fin);
                }
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
            ->whereNotNull('empleados.fecha_termino')
            ->whereBetween('empleados.fecha_termino', [$hoy, $limite]);

        // Filtro por tipo de contrato
        if ($request->has('tipo_contrato') && $request->tipo_contrato) {
            $query->where('empleados.tipo_contrato', $request->tipo_contrato);
        } else {
            $query->where('empleados.tipo_contrato', 'plazo_fijo');
        }

        // Filtro por estado del empleado
        if ($request->has('estado_empleado') && $request->estado_empleado) {
            $query->where('empleados.estado', $request->estado_empleado);
        } else {
            $query->where('empleados.estado', 'activo');
        }

        $empleados = $query->groupBy(
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
            ->havingRaw("COUNT(permisos_licencias.id) >= {$minLicencias}")
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
            'filtros_aplicados' => $request->all(),
        ]);
    }
}