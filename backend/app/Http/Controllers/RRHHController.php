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
     * Helper para convertir parámetros mes/año a fechas
     * Si se proporcionan mes/año, convierte a fecha_inicio y fecha_fin del mes
     */
    private function procesarFiltrosFecha(Request $request)
    {
        $fechaInicio = null;
        $fechaFin = null;

        // Si se envía mes y año, convertir a rango de fechas
        if ($request->has('mes') && $request->has('anio')) {
            $mes = $request->mes;
            $anio = $request->anio;

            // Primer día del mes
            $fechaInicio = Carbon::createFromDate($anio, $mes, 1)->startOfDay()->format('Y-m-d');
            // Último día del mes
            $fechaFin = Carbon::createFromDate($anio, $mes, 1)->endOfMonth()->endOfDay()->format('Y-m-d');
        } else {
            // Si no hay mes/año, usar fecha_inicio y fecha_fin directamente
            $fechaInicio = $request->input('fecha_inicio');
            $fechaFin = $request->input('fecha_fin');
        }

        return ['fecha_inicio' => $fechaInicio, 'fecha_fin' => $fechaFin];
    }

    /**
     * Alertas de contratos próximos a vencer
     * Retorna empleados con contrato "plazo_fijo" que vencen en los próximos 30 días
     *
     * Parámetros opcionales:
     * - mes: filtrar por mes específico
     * - anio: filtrar por año específico
     */
    public function alertasContratos(Request $request)
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
     *
     * Parámetros opcionales:
     * - mes: filtrar por mes específico
     * - anio: filtrar por año específico
     */
    public function rankingLicencias(Request $request)
    {
        // Procesar filtros de fecha (mes/año o fecha_inicio/fecha_fin)
        $fechas = $this->procesarFiltrosFecha($request);
        $fechaInicio = $fechas['fecha_inicio'];
        $fechaFin = $fechas['fecha_fin'];

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
     */
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
     *
     * Parámetros opcionales:
     * - mes: filtrar licencias por mes específico
     * - anio: filtrar licencias por año específico
     */
    public function empleadosAltoRiesgo(Request $request)
    {
        // Procesar filtros de fecha para licencias
        $fechas = $this->procesarFiltrosFecha($request);
        $fechaInicio = $fechas['fecha_inicio'];
        $fechaFin = $fechas['fecha_fin'];

        $hoy = Carbon::now();
        $limite = $hoy->copy()->addDays(60); // 60 días de anticipación

        $empleados = DB::table('empleados')
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
}
