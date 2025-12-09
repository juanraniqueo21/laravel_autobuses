<?php

namespace App\Http\Controllers;

use App\Models\Reporte;
use App\Models\Empleado;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\DB;

class ReporteController extends Controller
{
    /**
     * Listar todos los reportes
     */
    public function index(Request $request)
    {
        $user = $request->user();
        $rolId = $user->rol_id;

        $query = Reporte::with(['empleado.user', 'revisor', 'bus', 'ruta']);

        // Si no es Admin/Gerente/RRHH, solo ve sus propios reportes
        if (!in_array($rolId, [1, 2, 6])) {
            $empleado = Empleado::where('user_id', $user->id)->first();
            if (!$empleado) {
                return response()->json(['message' => 'No se encontr贸 empleado asociado'], 404);
            }
            $query->where('empleado_id', $empleado->id);
        }

        // Filtros
        if ($request->has('empleado_id')) $query->where('empleado_id', $request->empleado_id);
        if ($request->has('estado')) $query->where('estado', $request->estado);
        if ($request->has('tipo')) $query->where('tipo', $request->tipo);
        if ($request->has('fecha_desde')) $query->where('fecha_incidente', '>=', $request->fecha_desde);
        if ($request->has('fecha_hasta')) $query->where('fecha_incidente', '<=', $request->fecha_hasta);
        // B煤squeda simple
        if ($request->has('search')) {
            $search = $request->search;
            $query->where('titulo', 'like', "%{$search}%");
        }

        $reportes = $query->orderBy('created_at', 'desc')->get();

        return response()->json($reportes);
    }

    /**
     * Obtener reportes del empleado autenticado
     */
    public function misReportes(Request $request)
    {
        $user = $request->user();
        $empleado = Empleado::where('user_id', $user->id)->first();

        if (!$empleado) {
            return response()->json(['message' => 'No se encontr贸 empleado asociado'], 404);
        }

        $reportes = Reporte::with(['revisor', 'bus', 'ruta'])
            ->where('empleado_id', $empleado->id)
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json($reportes);
    }

    /**
     * Mostrar un reporte espec铆fico
     */
    public function show(Request $request, $id)
    {
        $user = $request->user();
        $reporte = Reporte::with(['empleado.user', 'revisor', 'bus', 'ruta'])->find($id);

        if (!$reporte) {
            return response()->json(['message' => 'Reporte no encontrado'], 404);
        }

        // Verificar permisos
        if (!in_array($user->rol_id, [1, 2, 6])) {
            $empleado = Empleado::where('user_id', $user->id)->first();
            if (!$empleado || $reporte->empleado_id != $empleado->id) {
                return response()->json(['message' => 'No autorizado'], 403);
            }
        }

        return response()->json($reporte);
    }

    /**
     * Crear un nuevo reporte
     */
    public function store(Request $request)
    {
        $user = $request->user();

        // 馃煝 FIX: AUTO-DETECTAR EMPLEADO ID
        // Si el frontend no env铆a 'empleado_id', lo buscamos nosotros
        if (!$request->has('empleado_id') || !$request->empleado_id) {
            $empleado = Empleado::where('user_id', $user->id)->first();
            if ($empleado) {
                $request->merge(['empleado_id' => $empleado->id]);
            }
        }

        // Validaci贸n
        $validator = Validator::make($request->all(), [
            'empleado_id' => 'required|exists:empleados,id',
            'tipo' => 'required|string',
            'fecha_incidente' => 'required|date',
            'hora_incidente' => 'nullable',
            'titulo' => 'required|string|max:200',
            'descripcion' => 'required|string|min:5',
            'documento' => 'nullable|file|mimes:pdf,jpg,jpeg,png|max:5120',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        // Seguridad extra: verificar que sea SU propio ID si no es admin
        if (in_array($user->rol_id, [3, 4, 5])) {
            $empleadoPropio = Empleado::where('user_id', $user->id)->first();
            if (!$empleadoPropio || $empleadoPropio->id != $request->empleado_id) {
                return response()->json(['message' => 'No puedes crear reportes para otros'], 403);
            }
        }

        DB::beginTransaction();

        try {
            $reporte = new Reporte();
            $reporte->empleado_id = $request->empleado_id;
            $reporte->tipo = $request->tipo;
            $reporte->fecha_incidente = $request->fecha_incidente;
            $reporte->hora_incidente = $request->hora_incidente;
            $reporte->titulo = $request->titulo;
            $reporte->descripcion = $request->descripcion;
            $reporte->ubicacion = $request->ubicacion;
            $reporte->bus_id = $request->bus_id; // Puede ser null
            $reporte->ruta_id = $request->ruta_id; // Puede ser null
            $reporte->gravedad = $request->gravedad ?? 'baja';
            $reporte->estado = 'pendiente';

            // Archivo adjunto
            if ($request->hasFile('documento')) {
                $file = $request->file('documento');
                $nombreOriginal = $file->getClientOriginalName();
                $nombreArchivo = $request->empleado_id . '_' . time() . '_' . $nombreOriginal;
                $ruta = $file->storeAs('reportes', $nombreArchivo, 'public');
                
                $reporte->ruta_documento = $ruta;
                $reporte->nombre_documento = $nombreOriginal;
            }

            $reporte->save();
            $reporte->load(['empleado.user', 'bus', 'ruta']);

            DB::commit();

            return response()->json([
                'message' => 'Reporte creado exitosamente',
                'reporte' => $reporte
            ], 201);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'Error al crear el reporte',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Actualizar un reporte
     */
    public function update(Request $request, $id)
    {
        $user = $request->user();
        $reporte = Reporte::find($id);

        if (!$reporte) {
            return response()->json(['message' => 'Reporte no encontrado'], 404);
        }

        if ($reporte->estado !== 'pendiente') {
            return response()->json(['message' => 'Solo se pueden editar reportes pendientes'], 422);
        }

        // Validaci贸n de permisos
        if (in_array($user->rol_id, [3, 4, 5])) {
            $empleado = Empleado::where('user_id', $user->id)->first();
            if (!$empleado || $reporte->empleado_id != $empleado->id) {
                return response()->json(['message' => 'No autorizado'], 403);
            }
        }

        // Update logic simplificada...
        $reporte->fill($request->except(['documento', 'empleado_id']));

        if ($request->hasFile('documento')) {
            if ($reporte->ruta_documento) Storage::disk('public')->delete($reporte->ruta_documento);
            
            $file = $request->file('documento');
            $nombreOriginal = $file->getClientOriginalName();
            $ruta = $file->storeAs('reportes', $reporte->empleado_id . '_' . time() . '_' . $nombreOriginal, 'public');
            
            $reporte->ruta_documento = $ruta;
            $reporte->nombre_documento = $nombreOriginal;
        }

        $reporte->save();
        return response()->json(['message' => 'Reporte actualizado', 'reporte' => $reporte]);
    }

    // M茅todos de aprobaci贸n/rechazo
    public function aprobar(Request $request, $id) {
        $reporte = Reporte::findOrFail($id);
        $reporte->update([
            'estado' => 'aprobado',
            'revisado_por' => $request->user()->id,
            'fecha_revision' => now(),
            'observaciones_revision' => $request->observaciones_revision
        ]);
        return response()->json(['message' => 'Aprobado']);
    }

    public function rechazar(Request $request, $id) {
        $request->validate(['observaciones_revision' => 'required']);
        $reporte = Reporte::findOrFail($id);
        $reporte->update([
            'estado' => 'rechazado',
            'revisado_por' => $request->user()->id,
            'fecha_revision' => now(),
            'observaciones_revision' => $request->observaciones_revision
        ]);
        return response()->json(['message' => 'Rechazado']);
    }

    public function destroy($id) {
        $reporte = Reporte::findOrFail($id);
        if($reporte->ruta_documento) Storage::disk('public')->delete($reporte->ruta_documento);
        $reporte->delete();
        return response()->json(['message' => 'Eliminado']);
    }

    public function descargarDocumento($id) {
        $reporte = Reporte::findOrFail($id);
        if(!$reporte->ruta_documento) return response()->json(['error' => 'No hay archivo'], 404);
        return response()->download(storage_path('app/public/' . $reporte->ruta_documento), $reporte->nombre_documento);
    }

    // ============================================
    // ANÁLISIS GERENCIAL - BUSINESS INTELLIGENCE
    // ============================================

    /**
     * Análisis de rentabilidad por tipo de servicio
     * Calcula ingresos, gastos, ganancia y margen por cada tipo de bus
     *
     * Parámetros opcionales:
     * - fecha_inicio: filtrar desde fecha (YYYY-MM-DD)
     * - fecha_fin: filtrar hasta fecha (YYYY-MM-DD)
     */
    public function rentabilidadPorTipoServicio(Request $request)
    {
        $query = DB::table('viajes')
            ->join('asignaciones_turno', 'viajes.asignacion_turno_id', '=', 'asignaciones_turno.id')
            ->join('buses', 'asignaciones_turno.bus_id', '=', 'buses.id')
            ->where('viajes.estado', 'completado');

        // Filtros de fecha
        if ($request->has('fecha_inicio')) {
            $query->where('viajes.fecha_hora_salida', '>=', $request->fecha_inicio);
        }
        if ($request->has('fecha_fin')) {
            $query->where('viajes.fecha_hora_salida', '<=', $request->fecha_fin);
        }

        $resultados = $query
            ->select(
                'buses.tipo_servicio',
                DB::raw('COUNT(viajes.id) as total_viajes'),
                DB::raw('SUM(viajes.pasajeros_transportados) as total_pasajeros'),
                DB::raw('SUM(viajes.dinero_recaudado) as total_ingresos'),
                DB::raw('SUM(viajes.costo_total) as total_gastos'),
                DB::raw('SUM(viajes.dinero_recaudado - viajes.costo_total) as ganancia_neta'),
                DB::raw('ROUND(AVG((viajes.pasajeros_transportados * 100.0) / buses.capacidad_pasajeros), 2) as tasa_ocupacion_promedio'),
                DB::raw('AVG(buses.capacidad_pasajeros) as capacidad_promedio')
            )
            ->groupBy('buses.tipo_servicio')
            ->get();

        // Calcular margen de ganancia % y formatear
        $analisis = $resultados->map(function ($item) {
            $margen = $item->total_ingresos > 0
                ? round(($item->ganancia_neta / $item->total_ingresos) * 100, 2)
                : 0;

            return [
                'tipo_servicio' => ucfirst($item->tipo_servicio),
                'total_viajes' => (int) $item->total_viajes,
                'total_pasajeros' => (int) $item->total_pasajeros,
                'total_ingresos' => (int) $item->total_ingresos,
                'total_gastos' => (int) $item->total_gastos,
                'ganancia_neta' => (int) $item->ganancia_neta,
                'margen_porcentaje' => $margen,
                'tasa_ocupacion_promedio' => (float) $item->tasa_ocupacion_promedio,
                'capacidad_promedio' => (float) $item->capacidad_promedio,
            ];
        });

        return response()->json($analisis);
    }

    /**
     * Análisis de ocupación por tipo de servicio
     * Muestra tasas de ocupación (pasajeros vs capacidad)
     *
     * Parámetros opcionales:
     * - fecha_inicio: filtrar desde fecha
     * - fecha_fin: filtrar hasta fecha
     */
    public function ocupacionPorTipoServicio(Request $request)
    {
        $query = DB::table('viajes')
            ->join('asignaciones_turno', 'viajes.asignacion_turno_id', '=', 'asignaciones_turno.id')
            ->join('buses', 'asignaciones_turno.bus_id', '=', 'buses.id')
            ->where('viajes.estado', 'completado');

        // Filtros de fecha
        if ($request->has('fecha_inicio')) {
            $query->where('viajes.fecha_hora_salida', '>=', $request->fecha_inicio);
        }
        if ($request->has('fecha_fin')) {
            $query->where('viajes.fecha_hora_salida', '<=', $request->fecha_fin);
        }

        $resultados = $query
            ->select(
                'buses.tipo_servicio',
                DB::raw('COUNT(viajes.id) as total_viajes'),
                DB::raw('ROUND(AVG((viajes.pasajeros_transportados * 100.0) / buses.capacidad_pasajeros), 2) as tasa_ocupacion_promedio'),
                DB::raw('ROUND(MAX((viajes.pasajeros_transportados * 100.0) / buses.capacidad_pasajeros), 2) as tasa_ocupacion_maxima'),
                DB::raw('ROUND(MIN((viajes.pasajeros_transportados * 100.0) / buses.capacidad_pasajeros), 2) as tasa_ocupacion_minima'),
                DB::raw('ROUND(AVG(viajes.pasajeros_transportados), 2) as pasajeros_promedio'),
                DB::raw('ROUND(AVG(buses.capacidad_pasajeros), 2) as capacidad_promedio')
            )
            ->groupBy('buses.tipo_servicio')
            ->get();

        $analisis = $resultados->map(function ($item) {
            return [
                'tipo_servicio' => ucfirst($item->tipo_servicio),
                'total_viajes' => (int) $item->total_viajes,
                'tasa_ocupacion_promedio' => (float) $item->tasa_ocupacion_promedio,
                'tasa_ocupacion_maxima' => (float) $item->tasa_ocupacion_maxima,
                'tasa_ocupacion_minima' => (float) $item->tasa_ocupacion_minima,
                'pasajeros_promedio' => (float) $item->pasajeros_promedio,
                'capacidad_promedio' => (float) $item->capacidad_promedio,
            ];
        });

        return response()->json($analisis);
    }

    /**
     * Resumen ejecutivo con KPIs principales
     * Muestra métricas clave del negocio para la gerencia
     *
     * Parámetros opcionales:
     * - fecha_inicio: filtrar desde fecha
     * - fecha_fin: filtrar hasta fecha
     */
    public function resumenEjecutivo(Request $request)
    {
        $query = DB::table('viajes')
            ->where('viajes.estado', 'completado');

        // Filtros de fecha
        if ($request->has('fecha_inicio')) {
            $query->where('viajes.fecha_hora_salida', '>=', $request->fecha_inicio);
        }
        if ($request->has('fecha_fin')) {
            $query->where('viajes.fecha_hora_salida', '<=', $request->fecha_fin);
        }

        // KPIs totales
        $totales = $query
            ->select(
                DB::raw('COUNT(*) as total_viajes'),
                DB::raw('SUM(pasajeros_transportados) as total_pasajeros'),
                DB::raw('SUM(dinero_recaudado) as total_ingresos'),
                DB::raw('SUM(costo_total) as total_gastos'),
                DB::raw('SUM(dinero_recaudado - costo_total) as ganancia_neta'),
                DB::raw('AVG(dinero_recaudado) as ingreso_promedio_viaje'),
                DB::raw('AVG(pasajeros_transportados) as pasajeros_promedio_viaje')
            )
            ->first();

        // Margen de ganancia %
        $margen = $totales->total_ingresos > 0
            ? round(($totales->ganancia_neta / $totales->total_ingresos) * 100, 2)
            : 0;

        // Viajes con alerta (diferencia > 10%)
        $viajesConAlerta = DB::table('viajes')
            ->where('viajes.estado', 'completado')
            ->where('requiere_revision', true);

        if ($request->has('fecha_inicio')) {
            $viajesConAlerta->where('fecha_hora_salida', '>=', $request->fecha_inicio);
        }
        if ($request->has('fecha_fin')) {
            $viajesConAlerta->where('fecha_hora_salida', '<=', $request->fecha_fin);
        }

        $totalViajesConAlerta = $viajesConAlerta->count();

        // Viajes deficitarios (costo > ingreso)
        $viajesDeficitarios = DB::table('viajes')
            ->where('viajes.estado', 'completado')
            ->whereRaw('costo_total > dinero_recaudado');

        if ($request->has('fecha_inicio')) {
            $viajesDeficitarios->where('fecha_hora_salida', '>=', $request->fecha_inicio);
        }
        if ($request->has('fecha_fin')) {
            $viajesDeficitarios->where('fecha_hora_salida', '<=', $request->fecha_fin);
        }

        $totalViajesDeficitarios = $viajesDeficitarios->count();
        $perdidaTotalDeficitarios = $viajesDeficitarios->sum(DB::raw('costo_total - dinero_recaudado'));

        $resumen = [
            // KPIs principales
            'total_viajes' => (int) $totales->total_viajes,
            'total_pasajeros' => (int) $totales->total_pasajeros,
            'total_ingresos' => (int) $totales->total_ingresos,
            'total_gastos' => (int) $totales->total_gastos,
            'ganancia_neta' => (int) $totales->ganancia_neta,
            'margen_porcentaje' => $margen,

            // Promedios
            'ingreso_promedio_viaje' => round($totales->ingreso_promedio_viaje, 0),
            'pasajeros_promedio_viaje' => round($totales->pasajeros_promedio_viaje, 2),

            // Alertas
            'viajes_con_alerta' => $totalViajesConAlerta,
            'viajes_deficitarios' => $totalViajesDeficitarios,
            'perdida_total_deficitarios' => (int) $perdidaTotalDeficitarios,
        ];

        return response()->json($resumen);
    }

    // ============================================
    // ANÁLISIS DE MANTENIMIENTOS
    // ============================================

    /**
     * Buses con más mantenimientos
     * Top 10 buses que han requerido más mantenimientos
     *
     * Parámetros opcionales:
     * - fecha_inicio: filtrar desde fecha
     * - fecha_fin: filtrar hasta fecha
     * - tipo_mantenimiento: 'preventivo' o 'correctivo'
     */
    public function busesConMasMantenimientos(Request $request)
    {
        $query = DB::table('mantenimientos')
            ->join('buses', 'mantenimientos.bus_id', '=', 'buses.id')
            ->select(
                'buses.id',
                'buses.patente',
                'buses.marca',
                'buses.modelo',
                'buses.tipo_servicio',
                'buses.estado as estado_bus',
                DB::raw('COUNT(mantenimientos.id) as total_mantenimientos'),
                DB::raw("SUM(CASE WHEN mantenimientos.tipo_mantenimiento = 'preventivo' THEN 1 ELSE 0 END) as preventivos"),
                DB::raw("SUM(CASE WHEN mantenimientos.tipo_mantenimiento = 'correctivo' THEN 1 ELSE 0 END) as correctivos"),
                DB::raw("SUM(CASE WHEN mantenimientos.estado = 'en_proceso' THEN 1 ELSE 0 END) as en_proceso"),
                DB::raw('COALESCE(SUM(mantenimientos.costo_total), 0) as costo_total_mantenimientos')
            );

        // Filtros de fecha
        if ($request->has('fecha_inicio')) {
            $query->where('mantenimientos.fecha_inicio', '>=', $request->fecha_inicio);
        }
        if ($request->has('fecha_fin')) {
            $query->where('mantenimientos.fecha_inicio', '<=', $request->fecha_fin);
        }
        if ($request->has('tipo_mantenimiento')) {
            $query->where('mantenimientos.tipo_mantenimiento', $request->tipo_mantenimiento);
        }

        $resultados = $query
            ->groupBy('buses.id', 'buses.patente', 'buses.marca', 'buses.modelo', 'buses.tipo_servicio', 'buses.estado')
            ->orderByDesc('total_mantenimientos')
            ->limit(10)
            ->get();

        $analisis = $resultados->map(function ($item) {
            return [
                'bus_id' => $item->id,
                'patente' => $item->patente,
                'marca' => $item->marca,
                'modelo' => $item->modelo,
                'tipo_servicio' => ucfirst($item->tipo_servicio),
                'estado_bus' => $item->estado_bus,
                'total_mantenimientos' => (int) $item->total_mantenimientos,
                'preventivos' => (int) $item->preventivos,
                'correctivos' => (int) $item->correctivos,
                'en_proceso' => (int) $item->en_proceso,
                'costo_total' => (int) $item->costo_total_mantenimientos,
            ];
        });

        return response()->json($analisis);
    }

    /**
     * Tipos de fallas más comunes
     * Análisis de las descripciones de mantenimientos correctivos
     *
     * Parámetros opcionales:
     * - fecha_inicio: filtrar desde fecha
     * - fecha_fin: filtrar hasta fecha
     */
    public function tiposFallasMasComunes(Request $request)
    {
        $query = DB::table('mantenimientos')
            ->where('tipo_mantenimiento', 'correctivo')
            ->whereNotNull('descripcion');

        // Filtros de fecha
        if ($request->has('fecha_inicio')) {
            $query->where('fecha_inicio', '>=', $request->fecha_inicio);
        }
        if ($request->has('fecha_fin')) {
            $query->where('fecha_inicio', '<=', $request->fecha_fin);
        }

        $resultados = $query
            ->select(
                'descripcion',
                DB::raw('COUNT(*) as cantidad'),
                DB::raw('COALESCE(AVG(costo_total), 0) as costo_promedio'),
                DB::raw('COALESCE(MIN(costo_total), 0) as costo_minimo'),
                DB::raw('COALESCE(MAX(costo_total), 0) as costo_maximo')
            )
            ->groupBy('descripcion')
            ->orderByDesc('cantidad')
            ->get();

        $analisis = $resultados->map(function ($item) {
            return [
                'tipo_falla' => $item->descripcion,
                'cantidad' => (int) $item->cantidad,
                'costo_promedio' => (int) $item->costo_promedio,
                'costo_minimo' => (int) $item->costo_minimo,
                'costo_maximo' => (int) $item->costo_maximo,
            ];
        });

        return response()->json($analisis);
    }

    /**
     * Costos de mantenimiento por bus
     * Análisis detallado de costos de mantenimiento
     *
     * Parámetros opcionales:
     * - fecha_inicio: filtrar desde fecha
     * - fecha_fin: filtrar hasta fecha
     */
    public function costosMantenimientoPorBus(Request $request)
    {
        $query = DB::table('mantenimientos')
            ->join('buses', 'mantenimientos.bus_id', '=', 'buses.id')
            ->whereNotNull('mantenimientos.costo_total')
            ->where('mantenimientos.estado', 'completado');

        // Filtros de fecha
        if ($request->has('fecha_inicio')) {
            $query->where('mantenimientos.fecha_inicio', '>=', $request->fecha_inicio);
        }
        if ($request->has('fecha_fin')) {
            $query->where('mantenimientos.fecha_inicio', '<=', $request->fecha_fin);
        }

        $resultados = $query
            ->select(
                'buses.id',
                'buses.patente',
                'buses.marca',
                'buses.modelo',
                'buses.tipo_servicio',
                'buses.anio as anio_fabricacion',
                DB::raw('COUNT(mantenimientos.id) as total_mantenimientos'),
                DB::raw('SUM(mantenimientos.costo_total) as costo_total'),
                DB::raw('AVG(mantenimientos.costo_total) as costo_promedio'),
                DB::raw('MAX(mantenimientos.costo_total) as costo_maximo')
            )
            ->groupBy('buses.id', 'buses.patente', 'buses.marca', 'buses.modelo', 'buses.tipo_servicio', 'buses.anio')
            ->orderByDesc('costo_total')
            ->get();

        $analisis = $resultados->map(function ($item) {
            $edadBus = now()->year - $item->anio_fabricacion;

            return [
                'bus_id' => $item->id,
                'patente' => $item->patente,
                'marca' => $item->marca,
                'modelo' => $item->modelo,
                'tipo_servicio' => ucfirst($item->tipo_servicio),
                'edad_anios' => $edadBus,
                'total_mantenimientos' => (int) $item->total_mantenimientos,
                'costo_total' => (int) $item->costo_total,
                'costo_promedio' => (int) $item->costo_promedio,
                'costo_maximo' => (int) $item->costo_maximo,
            ];
        });

        return response()->json($analisis);
    }

    /**
     * Buses disponibles para activación de emergencia
     * Buses en mantenimiento que podrían activarse en caso de urgencia
     * Se consideran activables los mantenimientos preventivos o correctivos menores
     */
    public function busesDisponiblesEmergencia(Request $request)
    {
        $hoy = now()->format('Y-m-d');

        // Buses actualmente en mantenimiento
        $busesEnMantenimiento = DB::table('mantenimientos')
            ->join('buses', 'mantenimientos.bus_id', '=', 'buses.id')
            ->leftJoin('mecanicos', 'mantenimientos.mecanico_id', '=', 'mecanicos.id')
            ->leftJoin('empleados', 'mecanicos.empleado_id', '=', 'empleados.id')
            ->leftJoin('users', 'empleados.user_id', '=', 'users.id')
            ->where('mantenimientos.estado', 'en_proceso')
            ->where('mantenimientos.fecha_inicio', '<=', $hoy)
            ->where(function($query) use ($hoy) {
                $query->whereNull('mantenimientos.fecha_termino')
                      ->orWhere('mantenimientos.fecha_termino', '>=', $hoy);
            })
            ->select(
                'buses.id as bus_id',
                'buses.patente',
                'buses.marca',
                'buses.modelo',
                'buses.tipo_servicio',
                'buses.capacidad_pasajeros',
                'mantenimientos.id as mantenimiento_id',
                'mantenimientos.tipo_mantenimiento',
                'mantenimientos.descripcion',
                'mantenimientos.fecha_inicio',
                'mantenimientos.fecha_termino',
                DB::raw("CONCAT(users.nombre, ' ', users.apellido) as mecanico_asignado")
            )
            ->get();

        // Clasificar por prioridad de activación
        $analisis = $busesEnMantenimiento->map(function ($item) {
            $esPreventivo = $item->tipo_mantenimiento === 'preventivo';
            $descripcionLower = strtolower($item->descripcion ?? '');

            // Determinar si es activable en emergencia
            $esMantenimientoMenor = $esPreventivo ||
                str_contains($descripcionLower, 'cambio de aceite') ||
                str_contains($descripcionLower, 'filtros') ||
                str_contains($descripcionLower, 'revisión') ||
                str_contains($descripcionLower, 'inspección') ||
                str_contains($descripcionLower, 'alineación') ||
                str_contains($descripcionLower, 'neumáticos');

            // Determinar prioridad
            if ($esPreventivo) {
                $prioridad = 'baja';
                $activable = true;
            } elseif ($esMantenimientoMenor) {
                $prioridad = 'media';
                $activable = true;
            } else {
                $prioridad = 'alta';
                $activable = false;
            }

            $diasEnMantenimiento = now()->diffInDays($item->fecha_inicio);

            return [
                'bus_id' => $item->bus_id,
                'patente' => $item->patente,
                'marca' => $item->marca,
                'modelo' => $item->modelo,
                'tipo_servicio' => ucfirst($item->tipo_servicio),
                'capacidad_pasajeros' => $item->capacidad_pasajeros,
                'mantenimiento_id' => $item->mantenimiento_id,
                'tipo_mantenimiento' => ucfirst($item->tipo_mantenimiento),
                'descripcion' => $item->descripcion,
                'fecha_inicio' => $item->fecha_inicio,
                'fecha_termino_estimada' => $item->fecha_termino,
                'dias_en_mantenimiento' => $diasEnMantenimiento,
                'mecanico_asignado' => $item->mecanico_asignado,
                'prioridad_mantenimiento' => $prioridad,
                'activable_emergencia' => $activable,
            ];
        });

        // Ordenar: primero los activables, luego por prioridad
        $analisis = $analisis->sortBy([
            ['activable_emergencia', 'desc'],
            ['prioridad_mantenimiento', 'asc'],
        ])->values();

        return response()->json($analisis);
    }
}