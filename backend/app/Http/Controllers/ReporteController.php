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
            $fechaInicio = \Carbon\Carbon::createFromDate($anio, $mes, 1)->startOfDay()->format('Y-m-d');
            // Último día del mes
            $fechaFin = \Carbon\Carbon::createFromDate($anio, $mes, 1)->endOfMonth()->endOfDay()->format('Y-m-d');
        } else {
            // Si no hay mes/año, usar fecha_inicio y fecha_fin directamente
            $fechaInicio = $request->input('fecha_inicio');
            $fechaFin = $request->input('fecha_fin');
        }

        return ['fecha_inicio' => $fechaInicio, 'fecha_fin' => $fechaFin];
    }

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
        // Procesar filtros de fecha (mes/año o fecha_inicio/fecha_fin)
        $fechas = $this->procesarFiltrosFecha($request);

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
        if ($fechas['fecha_inicio']) {
            $query->where('mantenimientos.fecha_inicio', '>=', $fechas['fecha_inicio']);
        }
        if ($fechas['fecha_fin']) {
            $query->where('mantenimientos.fecha_inicio', '<=', $fechas['fecha_fin']);
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
                'id' => $item->id, // Agregado id
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
                'costo_total_mantenimientos' => (int) $item->costo_total_mantenimientos, // Corregido nombre del campo
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
        // Procesar filtros de fecha (mes/año o fecha_inicio/fecha_fin)
        $fechas = $this->procesarFiltrosFecha($request);

        $query = DB::table('mantenimientos')
            ->where('tipo_mantenimiento', 'correctivo')
            ->whereNotNull('descripcion');

        // Filtros de fecha
        if ($fechas['fecha_inicio']) {
            $query->where('fecha_inicio', '>=', $fechas['fecha_inicio']);
        }
        if ($fechas['fecha_fin']) {
            $query->where('fecha_inicio', '<=', $fechas['fecha_fin']);
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
        // Procesar filtros de fecha (mes/año o fecha_inicio/fecha_fin)
        $fechas = $this->procesarFiltrosFecha($request);

        $query = DB::table('mantenimientos')
            ->join('buses', 'mantenimientos.bus_id', '=', 'buses.id')
            ->whereNotNull('mantenimientos.costo_total')
            ->where('mantenimientos.estado', 'completado');

        // Filtros de fecha
        if ($fechas['fecha_inicio']) {
            $query->where('mantenimientos.fecha_inicio', '>=', $fechas['fecha_inicio']);
        }
        if ($fechas['fecha_fin']) {
            $query->where('mantenimientos.fecha_inicio', '<=', $fechas['fecha_fin']);
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
                'id' => $item->id, // Agregado para consistencia
                'bus_id' => $item->id,
                'patente' => $item->patente,
                'marca' => $item->marca,
                'modelo' => $item->modelo,
                'tipo_servicio' => ucfirst($item->tipo_servicio),
                'edad_anios' => $edadBus,
                'total_mantenimientos' => (int) $item->total_mantenimientos,
                'costo_total_mantenimiento' => (int) $item->costo_total, // Nombre corregido para frontend
                'costo_promedio_mantenimiento' => (int) $item->costo_promedio, // Nombre corregido para frontend
                'costo_maximo' => (int) $item->costo_maximo,
            ];
        });

        return response()->json($analisis);
    }

    /**
     * Buses disponibles para activación de emergencia
     * Buses en mantenimiento que podrían activarse en caso de urgencia
     * Se consideran activables los mantenimientos preventivos o correctivos menores
     *
     * Parámetros opcionales:
     * - mes: filtrar por mes específico
     * - anio: filtrar por año específico
     */
    public function busesDisponiblesEmergencia(Request $request)
    {
        // Procesar filtros de fecha (mes/año o fecha_inicio/fecha_fin)
        $fechas = $this->procesarFiltrosFecha($request);
        $hoy = now()->format('Y-m-d');

        // Query base para buses en mantenimiento
        $query = DB::table('mantenimientos')
            ->join('buses', 'mantenimientos.bus_id', '=', 'buses.id')
            ->leftJoin('mecanicos', 'mantenimientos.mecanico_id', '=', 'mecanicos.id')
            ->leftJoin('empleados', 'mecanicos.empleado_id', '=', 'empleados.id')
            ->leftJoin('users', 'empleados.user_id', '=', 'users.id')
            ->where('mantenimientos.estado', 'en_proceso');

        // Si hay filtros de fecha, aplicarlos al periodo del mantenimiento
        if ($fechas['fecha_inicio'] && $fechas['fecha_fin']) {
            // Buses que estuvieron en mantenimiento durante el periodo filtrado
            $query->where('mantenimientos.fecha_inicio', '<=', $fechas['fecha_fin'])
                  ->where(function($q) use ($fechas) {
                      $q->whereNull('mantenimientos.fecha_termino')
                        ->orWhere('mantenimientos.fecha_termino', '>=', $fechas['fecha_inicio']);
                  });
        } else {
            // Sin filtros: mostrar estado actual (buses actualmente en mantenimiento)
            $query->where('mantenimientos.fecha_inicio', '<=', $hoy)
                  ->where(function($q) use ($hoy) {
                      $q->whereNull('mantenimientos.fecha_termino')
                        ->orWhere('mantenimientos.fecha_termino', '>=', $hoy);
                  });
        }

        $busesEnMantenimiento = $query->select(
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

            // Calcular días de duración del mantenimiento
            $fechaInicio = \Carbon\Carbon::parse($item->fecha_inicio);

            if ($item->fecha_termino) {
                // Si hay fecha de término, calcular duración total del mantenimiento
                $fechaTermino = \Carbon\Carbon::parse($item->fecha_termino);
                $diasEnMantenimiento = (int) $fechaInicio->diffInDays($fechaTermino, false);
                // Agregar 1 para contar ambos días (inicio y fin inclusive)
                $diasEnMantenimiento = abs($diasEnMantenimiento) + 1;
            } else {
                // Si no hay fecha de término, calcular días desde el inicio hasta hoy
                $diasEnMantenimiento = (int) $fechaInicio->diffInDays(now(), false);
                $diasEnMantenimiento = max(0, $diasEnMantenimiento);
            }

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

    /**
     * Dashboard Operativo - Alertas Categorizadas
     * Retorna alertas operativas categorizadas por: finanzas, operación, seguridad
     *
     * Parámetros opcionales:
     * - fecha_inicio: filtrar desde fecha
     * - fecha_fin: filtrar hasta fecha
     */
    public function dashboardOperativo(Request $request)
    {
        // Procesar filtros de fecha
        $fechas = $this->procesarFiltrosFecha($request);
        $fechaInicio = $fechas['fecha_inicio'];
        $fechaFin = $fechas['fecha_fin'];
        $hoy = now()->format('Y-m-d');

        $alertas = [];

        // 1. ALERTAS DE FINANZAS: Mantenimientos costosos
        $mantenimientosCostosos = DB::table('mantenimientos')
            ->join('buses', 'mantenimientos.bus_id', '=', 'buses.id')
            ->select('mantenimientos.*', 'buses.patente', 'buses.marca', 'buses.modelo')
            ->where('mantenimientos.costo_total', '>', 500000); // Más de $500k

        if ($fechaInicio) {
            $mantenimientosCostosos->where('mantenimientos.fecha_inicio', '>=', $fechaInicio);
        }
        if ($fechaFin) {
            $mantenimientosCostosos->where('mantenimientos.fecha_inicio', '<=', $fechaFin);
        }

        $mantenimientosCostosos = $mantenimientosCostosos->orderByDesc('mantenimientos.costo_total')
            ->limit(5)
            ->get();

        foreach ($mantenimientosCostosos as $mant) {
            $nivel = $mant->costo_total > 1000000 ? 'critico' : 'alto';
            $alertas[] = [
                'titulo' => 'Costo Alto',
                'mensaje' => "Mantenimiento en bus {$mant->patente} ({$mant->marca} {$mant->modelo}): {$mant->descripcion}",
                'categoria' => 'finanzas',
                'nivel' => $nivel,
                'fecha' => \Carbon\Carbon::parse($mant->fecha_inicio)->format('d-m-Y'),
                'monto' => (int) $mant->costo_total,
                'monto_formateado' => '$' . number_format($mant->costo_total, 0, ',', '.'),
                'bus' => $mant->patente,
                'accion_recomendada' => 'Revisar justificación y buscar alternativas de costo'
            ];
        }

        // 2. ALERTAS DE OPERACIÓN: Buses en mantenimiento prolongado
        $mantProlongados = DB::table('mantenimientos')
            ->join('buses', 'mantenimientos.bus_id', '=', 'buses.id')
            ->select('mantenimientos.*', 'buses.patente', 'buses.marca')
            ->where('mantenimientos.estado', 'en_proceso')
            ->where('mantenimientos.fecha_inicio', '<=', now()->subDays(7)->format('Y-m-d'))
            ->get();

        foreach ($mantProlongados as $mant) {
            $diasTranscurridos = (int) \Carbon\Carbon::parse($mant->fecha_inicio)->diffInDays(now());
            $alertas[] = [
                'titulo' => 'Mantenimiento Prolongado',
                'mensaje' => "Bus {$mant->patente} lleva {$diasTranscurridos} días en mantenimiento: {$mant->descripcion}",
                'categoria' => 'operacion',
                'nivel' => $diasTranscurridos > 14 ? 'critico' : 'alto',
                'fecha' => \Carbon\Carbon::parse($mant->fecha_inicio)->format('d-m-Y'),
                'bus' => $mant->patente,
                'accion_recomendada' => 'Verificar estado y priorizar finalización'
            ];
        }

        // 3. ALERTAS DE SEGURIDAD: SOAP próximos a vencer o vencidos
        $busesSOAP = DB::table('buses')
            ->select('id', 'patente', 'marca', 'modelo', 'vencimiento_soap')
            ->whereNotNull('vencimiento_soap')
            ->get();

        foreach ($busesSOAP as $bus) {
            $vencimiento = \Carbon\Carbon::parse($bus->vencimiento_soap);
            $diasRestantes = (int) now()->diffInDays($vencimiento, false);

            if ($diasRestantes < 0) {
                $alertas[] = [
                    'titulo' => 'SOAP VENCIDO',
                    'mensaje' => "Bus {$bus->patente} ({$bus->marca} {$bus->modelo}) tiene SOAP vencido hace " . abs($diasRestantes) . " días",
                    'categoria' => 'seguridad',
                    'nivel' => 'critico',
                    'fecha' => $vencimiento->format('d-m-Y'),
                    'bus' => $bus->patente,
                    'accion_recomendada' => 'Renovar SOAP inmediatamente y no operar el bus'
                ];
            } elseif ($diasRestantes <= 30) {
                $alertas[] = [
                    'titulo' => 'SOAP por Vencer',
                    'mensaje' => "Bus {$bus->patente} tiene SOAP que vence en {$diasRestantes} días",
                    'categoria' => 'seguridad',
                    'nivel' => $diasRestantes <= 7 ? 'alto' : 'medio',
                    'fecha' => $vencimiento->format('d-m-Y'),
                    'bus' => $bus->patente,
                    'accion_recomendada' => 'Programar renovación de SOAP'
                ];
            }
        }

        // 4. ALERTAS DE SEGURIDAD: Licencias de conducir próximas a vencer
        $conductores = DB::table('conductores')
            ->join('empleados', 'conductores.empleado_id', '=', 'empleados.id')
            ->join('users', 'empleados.user_id', '=', 'users.id')
            ->select('conductores.id', 'conductores.fecha_vencimiento_licencia', 'users.nombre', 'users.apellido')
            ->whereNotNull('conductores.fecha_vencimiento_licencia')
            ->where('empleados.estado', 'activo')
            ->get();

        foreach ($conductores as $conductor) {
            $vencimiento = \Carbon\Carbon::parse($conductor->fecha_vencimiento_licencia);
            $diasRestantes = (int) now()->diffInDays($vencimiento, false);
            $nombreCompleto = "{$conductor->nombre} {$conductor->apellido}";

            if ($diasRestantes < 0) {
                $alertas[] = [
                    'titulo' => 'Licencia VENCIDA',
                    'mensaje' => "Conductor {$nombreCompleto} tiene licencia vencida hace " . abs($diasRestantes) . " días",
                    'categoria' => 'seguridad',
                    'nivel' => 'critico',
                    'fecha' => $vencimiento->format('d-m-Y'),
                    'accion_recomendada' => 'Suspender conducción hasta renovación de licencia'
                ];
            } elseif ($diasRestantes <= 30) {
                $alertas[] = [
                    'titulo' => 'Licencia por Vencer',
                    'mensaje' => "Conductor {$nombreCompleto} tiene licencia que vence en {$diasRestantes} días",
                    'categoria' => 'seguridad',
                    'nivel' => $diasRestantes <= 7 ? 'alto' : 'medio',
                    'fecha' => $vencimiento->format('d-m-Y'),
                    'accion_recomendada' => 'Programar renovación de licencia'
                ];
            }
        }

        // 5. ALERTAS DE OPERACIÓN: Rutas sin viajes recientes
        if ($fechaInicio && $fechaFin) {
            $rutasSinViajes = DB::table('rutas')
                ->leftJoin('viajes', function($join) use ($fechaInicio, $fechaFin) {
                    $join->on('rutas.id', '=', 'viajes.ruta_id')
                         ->whereBetween('viajes.fecha_viaje', [$fechaInicio, $fechaFin]);
                })
                ->select('rutas.id', 'rutas.nombre', 'rutas.origen', 'rutas.destino', DB::raw('COUNT(viajes.id) as total_viajes'))
                ->where('rutas.estado', 'activa')
                ->groupBy('rutas.id', 'rutas.nombre', 'rutas.origen', 'rutas.destino')
                ->having('total_viajes', '=', 0)
                ->get();

            foreach ($rutasSinViajes as $ruta) {
                $alertas[] = [
                    'titulo' => 'Ruta Inactiva',
                    'mensaje' => "Ruta {$ruta->nombre} ({$ruta->origen} - {$ruta->destino}) no tiene viajes en el periodo seleccionado",
                    'categoria' => 'operacion',
                    'nivel' => 'medio',
                    'fecha' => now()->format('d-m-Y'),
                    'ruta' => $ruta->nombre,
                    'accion_recomendada' => 'Evaluar demanda y considerar desactivación temporal'
                ];
            }
        }

        // Ordenar alertas: críticas primero
        usort($alertas, function($a, $b) {
            $prioridad = ['critico' => 0, 'alto' => 1, 'medio' => 2, 'bajo' => 3];
            return ($prioridad[$a['nivel']] ?? 4) - ($prioridad[$b['nivel']] ?? 4);
        });

        return response()->json([
            'success' => true,
            'alertas' => $alertas,
            'total' => count($alertas),
        ]);
    }

    /**
     * Puntualidad y SLA
     * Retorna métricas de cumplimiento de horarios y nivel de servicio
     *
     * Parámetros opcionales:
     * - fecha_inicio: filtrar desde fecha
     * - fecha_fin: filtrar hasta fecha
     */
    public function puntualidadSLA(Request $request)
    {
        // Procesar filtros de fecha
        $fechas = $this->procesarFiltrosFecha($request);
        $fechaInicio = $fechas['fecha_inicio'] ?? now()->subDays(30)->format('Y-m-d');
        $fechaFin = $fechas['fecha_fin'] ?? now()->format('Y-m-d');

        // Viajes en el periodo
        $viajes = DB::table('viajes')
            ->whereBetween('fecha_viaje', [$fechaInicio, $fechaFin])
            ->select('id', 'estado', 'hora_salida_programada', 'hora_salida_real', 'hora_llegada_programada', 'hora_llegada_real')
            ->get();

        $totalViajes = $viajes->count();
        $viajesCompletados = $viajes->where('estado', 'completado')->count();
        $viajesCancelados = $viajes->where('estado', 'cancelado')->count();

        // Calcular puntualidad (viajes que salieron a tiempo)
        $viajesPuntuales = 0;
        foreach ($viajes->where('estado', 'completado') as $viaje) {
            if ($viaje->hora_salida_real && $viaje->hora_salida_programada) {
                $programada = \Carbon\Carbon::parse($viaje->hora_salida_programada);
                $real = \Carbon\Carbon::parse($viaje->hora_salida_real);
                $diferencia = $real->diffInMinutes($programada, false);

                // Considerar "puntual" si sale dentro de los 10 minutos de retraso
                if ($diferencia >= -10) {
                    $viajesPuntuales++;
                }
            }
        }

        $porcentajePuntualidad = $viajesCompletados > 0 ? round(($viajesPuntuales / $viajesCompletados) * 100, 1) : 0;
        $porcentajeCompletados = $totalViajes > 0 ? round(($viajesCompletados / $totalViajes) * 100, 1) : 0;
        $porcentajeCancelados = $totalViajes > 0 ? round(($viajesCancelados / $totalViajes) * 100, 1) : 0;

        return response()->json([
            'success' => true,
            'data' => [
                'total_viajes' => $totalViajes,
                'viajes_completados' => $viajesCompletados,
                'viajes_cancelados' => $viajesCancelados,
                'viajes_puntuales' => $viajesPuntuales,
                'porcentaje_puntualidad' => $porcentajePuntualidad,
                'porcentaje_completados' => $porcentajeCompletados,
                'porcentaje_cancelados' => $porcentajeCancelados,
                'periodo' => [
                    'inicio' => $fechaInicio,
                    'fin' => $fechaFin,
                ],
            ],
        ]);
    }

    /**
     * Alertas de Mantenimiento
     * Retorna alertas para cambios de aceite, revisiones técnicas y mantenimientos prolongados
     *
     * Parámetros opcionales:
     * - mes: filtrar por mes específico
     * - anio: filtrar por año específico
     */
    public function mantenimientoAlertas(Request $request)
    {
        $alertas = [];
        $hoy = now();

        // Obtener todos los buses activos
        $buses = DB::table('buses')
            ->select('id', 'patente', 'marca', 'modelo', 'kilometraje_actual', 'kilometraje_ultimo_cambio_aceite', 'fecha_ultima_revision_tecnica')
            ->where('estado', '!=', 'dado_de_baja')
            ->get();

        foreach ($buses as $bus) {
            // ALERTA: Cambio de aceite (cada 5000 km)
            if ($bus->kilometraje_actual && $bus->kilometraje_ultimo_cambio_aceite !== null) {
                $kmDesdeUltimoCambio = $bus->kilometraje_actual - $bus->kilometraje_ultimo_cambio_aceite;

                if ($kmDesdeUltimoCambio >= 5000) {
                    $alertas[] = [
                        'tipo' => 'cambio_aceite',
                        'bus_id' => $bus->id,
                        'patente' => $bus->patente,
                        'marca' => $bus->marca,
                        'modelo' => $bus->modelo,
                        'nivel' => 'critico',
                        'mensaje' => "Bus {$bus->patente} necesita cambio de aceite urgente",
                        'detalle' => "Km desde último cambio: " . number_format($kmDesdeUltimoCambio, 0, ',', '.') . " km (límite: 5,000 km)",
                        'km_desde_ultimo_cambio' => (int) $kmDesdeUltimoCambio,
                    ];
                } elseif ($kmDesdeUltimoCambio >= 4500) {
                    $alertas[] = [
                        'tipo' => 'cambio_aceite',
                        'bus_id' => $bus->id,
                        'patente' => $bus->patente,
                        'marca' => $bus->marca,
                        'modelo' => $bus->modelo,
                        'nivel' => 'medio',
                        'mensaje' => "Bus {$bus->patente} próximo a cambio de aceite",
                        'detalle' => "Km desde último cambio: " . number_format($kmDesdeUltimoCambio, 0, ',', '.') . " km (límite: 5,000 km)",
                        'km_desde_ultimo_cambio' => (int) $kmDesdeUltimoCambio,
                    ];
                }
            }

            // ALERTA: Revisión técnica próxima a vencer (cada 6 meses)
            if ($bus->fecha_ultima_revision_tecnica) {
                $ultimaRevision = \Carbon\Carbon::parse($bus->fecha_ultima_revision_tecnica);
                $proximaRevision = $ultimaRevision->copy()->addMonths(6);
                $diasRestantes = (int) $hoy->diffInDays($proximaRevision, false);

                if ($diasRestantes < 0) {
                    $alertas[] = [
                        'tipo' => 'revision_tecnica',
                        'bus_id' => $bus->id,
                        'patente' => $bus->patente,
                        'marca' => $bus->marca,
                        'modelo' => $bus->modelo,
                        'nivel' => 'critico',
                        'mensaje' => "Bus {$bus->patente} tiene revisión técnica VENCIDA",
                        'detalle' => "Vencida hace " . abs($diasRestantes) . " días (última revisión: " . $ultimaRevision->format('d-m-Y') . ")",
                        'dias_restantes' => $diasRestantes,
                        'fecha_vencimiento' => $proximaRevision->format('d-m-Y'),
                    ];
                } elseif ($diasRestantes <= 15) {
                    $alertas[] = [
                        'tipo' => 'revision_tecnica',
                        'bus_id' => $bus->id,
                        'patente' => $bus->patente,
                        'marca' => $bus->marca,
                        'modelo' => $bus->modelo,
                        'nivel' => 'medio',
                        'mensaje' => "Bus {$bus->patente} próximo a vencimiento de revisión técnica",
                        'detalle' => "Vence en {$diasRestantes} días",
                        'dias_restantes' => $diasRestantes,
                        'fecha_vencimiento' => $proximaRevision->format('d-m-Y'),
                    ];
                }
            }
        }

        // ALERTA: Mantenimientos prolongados
        $mantenimientosProlongados = DB::table('mantenimientos')
            ->join('buses', 'mantenimientos.bus_id', '=', 'buses.id')
            ->whereIn('mantenimientos.estado', ['en_proceso', 'pendiente'])
            ->select(
                'mantenimientos.id',
                'mantenimientos.descripcion',
                'mantenimientos.fecha_inicio',
                'buses.id as bus_id',
                'buses.patente',
                'buses.marca',
                'buses.modelo'
            )
            ->get();

        foreach ($mantenimientosProlongados as $mant) {
            $diasDesdeInicio = (int) \Carbon\Carbon::parse($mant->fecha_inicio)->diffInDays($hoy);

            if ($diasDesdeInicio >= 7) {
                $alertas[] = [
                    'tipo' => 'mantenimiento',
                    'bus_id' => $mant->bus_id,
                    'patente' => $mant->patente,
                    'marca' => $mant->marca,
                    'modelo' => $mant->modelo,
                    'nivel' => 'critico',
                    'mensaje' => "Bus {$mant->patente} lleva {$diasDesdeInicio} días en mantenimiento",
                    'detalle' => "{$mant->descripcion}",
                ];
            } elseif ($diasDesdeInicio >= 3) {
                $alertas[] = [
                    'tipo' => 'mantenimiento',
                    'bus_id' => $mant->bus_id,
                    'patente' => $mant->patente,
                    'marca' => $mant->marca,
                    'modelo' => $mant->modelo,
                    'nivel' => 'medio',
                    'mensaje' => "Bus {$mant->patente} en mantenimiento por {$diasDesdeInicio} días",
                    'detalle' => "{$mant->descripcion}",
                ];
            }
        }

        // Contar por tipo
        $porTipo = [
            'cambio_aceite' => count(array_filter($alertas, fn($a) => $a['tipo'] === 'cambio_aceite')),
            'revision_tecnica' => count(array_filter($alertas, fn($a) => $a['tipo'] === 'revision_tecnica')),
            'mantenimiento' => count(array_filter($alertas, fn($a) => $a['tipo'] === 'mantenimiento')),
        ];

        return response()->json([
            'success' => true,
            'alertas' => $alertas,
            'total' => count($alertas),
            'por_tipo' => $porTipo,
        ]);
    }

    /**
     * Análisis Top de Mantenimientos
     * Retorna top buses con más fallas, top modelos con fallas, y rutas críticas
     *
     * Parámetros opcionales:
     * - mes: filtrar por mes específico
     * - anio: filtrar por año específico
     */
    public function mantenimientoTops(Request $request)
    {
        // Procesar filtros de fecha
        $fechas = $this->procesarFiltrosFecha($request);
        $fechaInicio = $fechas['fecha_inicio'];
        $fechaFin = $fechas['fecha_fin'];

        // TOP BUSES CON MÁS FALLAS (mantenimientos correctivos)
        $queryTopBuses = DB::table('mantenimientos')
            ->join('buses', 'mantenimientos.bus_id', '=', 'buses.id')
            ->where('mantenimientos.tipo_mantenimiento', 'correctivo');

        if ($fechaInicio) {
            $queryTopBuses->where('mantenimientos.fecha_inicio', '>=', $fechaInicio);
        }
        if ($fechaFin) {
            $queryTopBuses->where('mantenimientos.fecha_inicio', '<=', $fechaFin);
        }

        $topBusesFallas = $queryTopBuses
            ->select(
                'buses.id',
                'buses.patente',
                'buses.marca',
                'buses.modelo',
                DB::raw('COUNT(mantenimientos.id) as total_fallas'),
                DB::raw('COALESCE(SUM(mantenimientos.costo_total), 0) as costo_total')
            )
            ->groupBy('buses.id', 'buses.patente', 'buses.marca', 'buses.modelo')
            ->orderByDesc('total_fallas')
            ->limit(10)
            ->get()
            ->map(function ($item) {
                return [
                    'bus_id' => $item->id,
                    'patente' => $item->patente,
                    'marca_modelo' => "{$item->marca} {$item->modelo}",
                    'total_fallas' => (int) $item->total_fallas,
                    'costo_total' => (int) $item->costo_total,
                ];
            });

        // TOP MODELOS CON MÁS FALLAS
        $queryTopModelos = DB::table('mantenimientos')
            ->join('buses', 'mantenimientos.bus_id', '=', 'buses.id')
            ->where('mantenimientos.tipo_mantenimiento', 'correctivo');

        if ($fechaInicio) {
            $queryTopModelos->where('mantenimientos.fecha_inicio', '>=', $fechaInicio);
        }
        if ($fechaFin) {
            $queryTopModelos->where('mantenimientos.fecha_inicio', '<=', $fechaFin);
        }

        $topModelosFallas = $queryTopModelos
            ->select(
                'buses.marca',
                'buses.modelo',
                DB::raw('COUNT(mantenimientos.id) as total_fallas'),
                DB::raw('COUNT(DISTINCT buses.id) as total_buses')
            )
            ->groupBy('buses.marca', 'buses.modelo')
            ->orderByDesc('total_fallas')
            ->limit(10)
            ->get()
            ->map(function ($item) {
                return [
                    'marca_modelo' => "{$item->marca} {$item->modelo}",
                    'total_fallas' => (int) $item->total_fallas,
                    'total_buses' => (int) $item->total_buses,
                ];
            });

        // RUTAS CRÍTICAS (rutas con más reportes de incidentes)
        $queryRutasCriticas = DB::table('reportes')
            ->join('rutas', 'reportes.ruta_id', '=', 'rutas.id')
            ->whereNotNull('reportes.ruta_id')
            ->where('reportes.tipo', '!=', 'general');

        if ($fechaInicio) {
            $queryRutasCriticas->where('reportes.fecha_incidente', '>=', $fechaInicio);
        }
        if ($fechaFin) {
            $queryRutasCriticas->where('reportes.fecha_incidente', '<=', $fechaFin);
        }

        $rutasCriticas = $queryRutasCriticas
            ->select(
                'rutas.id',
                'rutas.nombre',
                'rutas.origen',
                'rutas.destino',
                DB::raw('COUNT(reportes.id) as total_incidentes'),
                DB::raw("SUM(CASE WHEN reportes.gravedad = 'alta' THEN 1 ELSE 0 END) as incidentes_graves")
            )
            ->groupBy('rutas.id', 'rutas.nombre', 'rutas.origen', 'rutas.destino')
            ->orderByDesc('total_incidentes')
            ->limit(5)
            ->get()
            ->map(function ($item) {
                return [
                    'ruta_id' => $item->id,
                    'nombre' => $item->nombre,
                    'origen' => $item->origen,
                    'destino' => $item->destino,
                    'total_incidentes' => (int) $item->total_incidentes,
                    'incidentes_graves' => (int) $item->incidentes_graves,
                ];
            });

        return response()->json([
            'success' => true,
            'top_buses_fallas' => $topBusesFallas,
            'top_modelos_fallas' => $topModelosFallas,
            'rutas_criticas' => $rutasCriticas,
        ]);
    }
}