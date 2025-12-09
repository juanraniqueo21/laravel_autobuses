<?php

namespace App\Http\Controllers;

use App\Models\Bus;
use App\Models\Conductor;
use App\Models\Asistente;
use App\Models\Mantenimiento;
use App\Models\Viaje;
use App\Models\PermisoLicencia;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class AlertasInteligentesController extends Controller
{
    /**
     * Obtener todas las alertas del sistema
     * Sistema inteligente de detección de problemas potenciales
     */
    public function obtenerAlertas(Request $request)
    {
        $alertas = [];
        $hoy = Carbon::now();

        // ============================================
        // 1. ALERTAS DE BUSES
        // ============================================

        // Buses con documentos próximos a vencer (30 días)
        $busesDocumentosVencen = Bus::where(function ($query) use ($hoy) {
            $query->whereBetween('vencimiento_soap', [$hoy, $hoy->copy()->addDays(30)])
                ->orWhereBetween('proxima_revision_tecnica', [$hoy, $hoy->copy()->addDays(30)])
                ->orWhereBetween('vencimiento_poliza', [$hoy, $hoy->copy()->addDays(30)]);
        })->get();

        foreach ($busesDocumentosVencen as $bus) {
            if ($bus->vencimiento_soap && $bus->vencimiento_soap->lte($hoy->copy()->addDays(30))) {
                $dias = $hoy->diffInDays($bus->vencimiento_soap);
                $alertas[] = [
                    'tipo' => 'documentos',
                    'severidad' => $dias <= 7 ? 'critica' : 'alta',
                    'categoria' => 'Bus',
                    'titulo' => "SOAP próximo a vencer - Bus {$bus->patente}",
                    'mensaje' => "El SOAP del bus {$bus->patente} vence en {$dias} días ({$bus->vencimiento_soap->format('d/m/Y')})",
                    'accion_sugerida' => 'Renovar SOAP antes de su vencimiento',
                    'entidad_id' => $bus->id,
                    'entidad_tipo' => 'bus',
                ];
            }

            if ($bus->proxima_revision_tecnica && $bus->proxima_revision_tecnica->lte($hoy->copy()->addDays(30))) {
                $dias = $hoy->diffInDays($bus->proxima_revision_tecnica);
                $alertas[] = [
                    'tipo' => 'documentos',
                    'severidad' => $dias <= 7 ? 'critica' : 'alta',
                    'categoria' => 'Bus',
                    'titulo' => "Revisión Técnica próxima - Bus {$bus->patente}",
                    'mensaje' => "La revisión técnica del bus {$bus->patente} vence en {$dias} días ({$bus->proxima_revision_tecnica->format('d/m/Y')})",
                    'accion_sugerida' => 'Programar revisión técnica',
                    'entidad_id' => $bus->id,
                    'entidad_tipo' => 'bus',
                ];
            }
        }

        // Buses con mantenimientos frecuentes (más de 4 en últimos 60 días)
        $busesProblematicos = DB::table('mantenimientos')
            ->select('bus_id', DB::raw('COUNT(*) as total_mantenimientos'))
            ->where('fecha_inicio', '>=', $hoy->copy()->subDays(60))
            ->groupBy('bus_id')
            ->having('total_mantenimientos', '>', 4)
            ->get();

        foreach ($busesProblematicos as $busData) {
            $bus = Bus::find($busData->bus_id);
            if ($bus) {
                $alertas[] = [
                    'tipo' => 'mantenimiento_excesivo',
                    'severidad' => 'media',
                    'categoria' => 'Bus',
                    'titulo' => "Bus con mantenimientos frecuentes - {$bus->patente}",
                    'mensaje' => "El bus {$bus->patente} ha tenido {$busData->total_mantenimientos} mantenimientos en los últimos 60 días",
                    'accion_sugerida' => 'Considerar reemplazo o inspección profunda',
                    'entidad_id' => $bus->id,
                    'entidad_tipo' => 'bus',
                ];
            }
        }

        // Buses con alto costo de mantenimiento (>$1.500.000 en últimos 90 días)
        $busesAltoCosto = DB::table('mantenimientos')
            ->select('bus_id', DB::raw('SUM(costo_total) as costo_total_90dias'))
            ->where('fecha_inicio', '>=', $hoy->copy()->subDays(90))
            ->whereNotNull('costo_total')
            ->groupBy('bus_id')
            ->havingRaw('SUM(costo_total) > 1500000')
            ->get();

        foreach ($busesAltoCosto as $busData) {
            $bus = Bus::find($busData->bus_id);
            if ($bus) {
                $alertas[] = [
                    'tipo' => 'costo_elevado',
                    'severidad' => 'alta',
                    'categoria' => 'Bus',
                    'titulo' => "Costos de mantenimiento elevados - {$bus->patente}",
                    'mensaje' => "El bus {$bus->patente} ha generado $" . number_format($busData->costo_total_90dias, 0, ',', '.') . " en mantenimientos en los últimos 90 días",
                    'accion_sugerida' => 'Evaluar rentabilidad del bus',
                    'entidad_id' => $bus->id,
                    'entidad_tipo' => 'bus',
                    'costo' => (int)$busData->costo_total_90dias,
                ];
            }
        }

        // ============================================
        // 2. ALERTAS DE CONDUCTORES
        // ============================================

        // Conductores con licencia próxima a vencer
        $conductoresLicenciaVence = Conductor::with('empleado.user')
            ->whereBetween('fecha_vencimiento_licencia', [$hoy, $hoy->copy()->addDays(60)])
            ->get();

        foreach ($conductoresLicenciaVence as $conductor) {
            $dias = $hoy->diffInDays($conductor->fecha_vencimiento_licencia);
            $alertas[] = [
                'tipo' => 'licencia_conductor',
                'severidad' => $dias <= 15 ? 'critica' : 'media',
                'categoria' => 'Conductor',
                'titulo' => "Licencia de conducir próxima a vencer",
                'mensaje' => "La licencia de {$conductor->empleado->user->nombre} {$conductor->empleado->user->apellido} vence en {$dias} días ({$conductor->fecha_vencimiento_licencia->format('d/m/Y')})",
                'accion_sugerida' => 'Solicitar renovación de licencia',
                'entidad_id' => $conductor->id,
                'entidad_tipo' => 'conductor',
            ];
        }

        // Conductores con examen ocupacional vencido o próximo
        $conductoresExamenVence = Conductor::with('empleado.user')
            ->whereNotNull('fecha_examen_ocupacional')
            ->where(function ($query) use ($hoy) {
                // Exámenes mayores a 1 año
                $query->where('fecha_examen_ocupacional', '<=', $hoy->copy()->subYear());
            })
            ->get();

        foreach ($conductoresExamenVence as $conductor) {
            $meses = $hoy->diffInMonths($conductor->fecha_examen_ocupacional);
            $alertas[] = [
                'tipo' => 'examen_ocupacional',
                'severidad' => $meses >= 18 ? 'alta' : 'media',
                'categoria' => 'Conductor',
                'titulo' => "Examen ocupacional desactualizado",
                'mensaje' => "El examen ocupacional de {$conductor->empleado->user->nombre} {$conductor->empleado->user->apellido} tiene {$meses} meses de antigüedad",
                'accion_sugerida' => 'Programar nuevo examen ocupacional',
                'entidad_id' => $conductor->id,
                'entidad_tipo' => 'conductor',
            ];
        }

        // ============================================
        // 3. ALERTAS DE RENDIMIENTO
        // ============================================

        // Rutas deficitarias (más pérdidas que ganancias en últimos 30 días)
        $rutasDeficitarias = DB::table('viajes')
            ->select('ruta_id', DB::raw('SUM(dinero_recaudado - costo_total) as ganancia_neta'), DB::raw('COUNT(*) as total_viajes'))
            ->join('asignaciones_turno', 'viajes.asignacion_turno_id', '=', 'asignaciones_turno.id')
            ->where('viajes.estado', 'completado')
            ->where('viajes.fecha_hora_salida', '>=', $hoy->copy()->subDays(30))
            ->groupBy('ruta_id')
            ->havingRaw('SUM(dinero_recaudado - costo_total) < 0')
            ->get();

        foreach ($rutasDeficitarias as $rutaData) {
            $ruta = \App\Models\Ruta::find($rutaData->ruta_id);
            if ($ruta) {
                $alertas[] = [
                    'tipo' => 'ruta_deficitaria',
                    'severidad' => 'alta',
                    'categoria' => 'Operaciones',
                    'titulo' => "Ruta con pérdidas - {$ruta->nombre_ruta}",
                    'mensaje' => "La ruta {$ruta->nombre_ruta} ha generado pérdidas de $" . number_format(abs($rutaData->ganancia_neta), 0, ',', '.') . " en los últimos 30 días ({$rutaData->total_viajes} viajes)",
                    'accion_sugerida' => 'Revisar tarifas o considerar suspender ruta',
                    'entidad_id' => $ruta->id,
                    'entidad_tipo' => 'ruta',
                    'perdida' => (int)abs($rutaData->ganancia_neta),
                ];
            }
        }

        // Viajes con alta tasa de cancelación (>20%)
        $viajesCancelados = DB::table('asignaciones_turno')
            ->select('ruta_id', DB::raw('COUNT(*) as total'), DB::raw('SUM(CASE WHEN estado = "cancelado" THEN 1 ELSE 0 END) as cancelados'))
            ->where('fecha_turno', '>=', $hoy->copy()->subDays(30))
            ->groupBy('ruta_id')
            ->havingRaw('(SUM(CASE WHEN estado = "cancelado" THEN 1 ELSE 0 END) * 100.0 / COUNT(*)) > 20')
            ->get();

        foreach ($viajesCancelados as $viajeData) {
            $ruta = \App\Models\Ruta::find($viajeData->ruta_id);
            if ($ruta) {
                $tasaCancelacion = round(($viajeData->cancelados / $viajeData->total) * 100, 1);
                $alertas[] = [
                    'tipo' => 'alta_cancelacion',
                    'severidad' => 'media',
                    'categoria' => 'Operaciones',
                    'titulo' => "Alta tasa de cancelación - {$ruta->nombre_ruta}",
                    'mensaje' => "La ruta {$ruta->nombre_ruta} tiene {$tasaCancelacion}% de cancelaciones ({$viajeData->cancelados} de {$viajeData->total} viajes)",
                    'accion_sugerida' => 'Investigar causas de cancelaciones',
                    'entidad_id' => $ruta->id,
                    'entidad_tipo' => 'ruta',
                ];
            }
        }

        // ============================================
        // 4. PREDICCIONES Y RECOMENDACIONES
        // ============================================

        // Buses que probablemente necesitarán mantenimiento pronto (basado en km y tiempo)
        $busesMantenimientoProximo = Bus::where('estado', 'operativo')
            ->where(function ($query) use ($hoy) {
                // Último mantenimiento hace más de 90 días
                $query->where('fecha_ultimo_mantenimiento', '<=', $hoy->copy()->subDays(90))
                    ->orWhereNull('fecha_ultimo_mantenimiento');
            })
            ->get();

        foreach ($busesMantenimientoProximo as $bus) {
            $diasSinMantenimiento = $bus->fecha_ultimo_mantenimiento ? $hoy->diffInDays($bus->fecha_ultimo_mantenimiento) : 999;
            $alertas[] = [
                'tipo' => 'prediccion_mantenimiento',
                'severidad' => 'baja',
                'categoria' => 'Predicción',
                'titulo' => "Mantenimiento preventivo recomendado - {$bus->patente}",
                'mensaje' => "El bus {$bus->patente} no ha tenido mantenimiento en {$diasSinMantenimiento} días. Se recomienda programar revisión preventiva.",
                'accion_sugerida' => 'Programar mantenimiento preventivo',
                'entidad_id' => $bus->id,
                'entidad_tipo' => 'bus',
            ];
        }

        // ============================================
        // ORDENAR POR SEVERIDAD
        // ============================================
        $ordenSeveridad = ['critica' => 1, 'alta' => 2, 'media' => 3, 'baja' => 4];
        usort($alertas, function ($a, $b) use ($ordenSeveridad) {
            return ($ordenSeveridad[$a['severidad']] ?? 999) <=> ($ordenSeveridad[$b['severidad']] ?? 999);
        });

        return response()->json([
            'total' => count($alertas),
            'criticas' => count(array_filter($alertas, fn($a) => $a['severidad'] === 'critica')),
            'altas' => count(array_filter($alertas, fn($a) => $a['severidad'] === 'alta')),
            'medias' => count(array_filter($alertas, fn($a) => $a['severidad'] === 'media')),
            'bajas' => count(array_filter($alertas, fn($a) => $a['severidad'] === 'baja')),
            'alertas' => $alertas,
        ]);
    }

    /**
     * Obtener estadísticas predictivas
     */
    public function predicciones(Request $request)
    {
        $hoy = Carbon::now();

        return response()->json([
            'costos_proximos_30dias' => $this->predecirCostosMantenimiento(),
            'demanda_por_ruta' => $this->predecirDemandaRutas(),
            'rentabilidad_esperada' => $this->calcularRentabilidadEsperada(),
        ]);
    }

    private function predecirCostosMantenimiento()
    {
        // Promedio de costos de mantenimiento en últimos 90 días
        $promedio90dias = Mantenimiento::where('fecha_inicio', '>=', Carbon::now()->subDays(90))
            ->whereNotNull('costo_total')
            ->avg('costo_total');

        // Proyección para próximos 30 días
        return [
            'costo_promedio_mensual' => (int)$promedio90dias,
            'proyeccion_30_dias' => (int)($promedio90dias * (30 / 90) * Bus::where('estado', 'operativo')->count()),
        ];
    }

    private function predecirDemandaRutas()
    {
        // Top 5 rutas con mayor ocupación promedio
        return DB::table('viajes')
            ->join('asignaciones_turno', 'viajes.asignacion_turno_id', '=', 'asignaciones_turno.id')
            ->join('rutas', 'asignaciones_turno.ruta_id', '=', 'rutas.id')
            ->join('buses', 'asignaciones_turno.bus_id', '=', 'buses.id')
            ->select(
                'rutas.id',
                'rutas.nombre_ruta',
                DB::raw('AVG((viajes.pasajeros_transportados * 100.0) / buses.capacidad_pasajeros) as ocupacion_promedio'),
                DB::raw('COUNT(*) as total_viajes')
            )
            ->where('viajes.estado', 'completado')
            ->where('viajes.fecha_hora_salida', '>=', Carbon::now()->subDays(30))
            ->groupBy('rutas.id', 'rutas.nombre_ruta')
            ->orderByDesc('ocupacion_promedio')
            ->limit(5)
            ->get();
    }

    private function calcularRentabilidadEsperada()
    {
        $datos = DB::table('viajes')
            ->where('estado', 'completado')
            ->where('fecha_hora_salida', '>=', Carbon::now()->subDays(30))
            ->select(
                DB::raw('SUM(dinero_recaudado) as ingresos_30dias'),
                DB::raw('SUM(costo_total) as gastos_30dias'),
                DB::raw('SUM(dinero_recaudado - costo_total) as ganancia_30dias')
            )
            ->first();

        return [
            'ingresos_ultimos_30dias' => (int)($datos->ingresos_30dias ?? 0),
            'gastos_ultimos_30dias' => (int)($datos->gastos_30dias ?? 0),
            'ganancia_ultimos_30dias' => (int)($datos->ganancia_30dias ?? 0),
            'proyeccion_mes_siguiente' => (int)(($datos->ganancia_30dias ?? 0) * 1.05), // 5% de crecimiento estimado
        ];
    }
}
