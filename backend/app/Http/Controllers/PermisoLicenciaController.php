<?php

namespace App\Http\Controllers;

use App\Models\PermisoLicencia;
use App\Models\Empleado;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;
use Carbon\Carbon;

class PermisoLicenciaController extends Controller
{
    /**
     * Listar todas las licencias (con filtros opcionales)
     */
    public function index(Request $request)
    {
        // Verificar permisos (1=Admin, 2=Manager, 6=RRHH)
        $user = $request->user();
        if (!in_array($user->rol_id, [1, 2, 6])) {
            return response()->json(['message' => 'No autorizado'], 403);
        }

        $query = PermisoLicencia::with(['empleado', 'aprobador', 'rechazador']);

        // Filtros opcionales
        if ($request->has('empleado_id')) {
            $query->where('empleado_id', $request->empleado_id);
        }

        if ($request->has('estado')) {
            $query->where('estado', $request->estado);
        }

        if ($request->has('tipo')) {
            $query->where('tipo', $request->tipo);
        }

        if ($request->has('fecha_desde')) {
            $query->where('fecha_inicio', '>=', $request->fecha_desde);
        }

        if ($request->has('fecha_hasta')) {
            $query->where('fecha_termino', '<=', $request->fecha_hasta);
        }

        // Ordenar por más recientes primero
        $licencias = $query->orderBy('created_at', 'desc')->get();

        return response()->json($licencias);
    }

    /**
     * Obtener licencias del empleado autenticado
     * Acceso: Conductor (sus propias licencias)
     */
    public function misLicencias(Request $request)
    {
        $user = $request->user();

        // Obtener el empleado asociado al usuario
        $empleado = Empleado::where('user_id', $user->id)->first();

        if (!$empleado) {
            return response()->json(['message' => 'No se encontró empleado asociado'], 404);
        }

        $licencias = PermisoLicencia::with(['aprobador', 'rechazador'])
            ->where('empleado_id', $empleado->id)
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json($licencias);
    }

    /**
     * Crear una nueva solicitud de licencia
     * Acceso: Conductor (para sí mismo), RRHH (para cualquiera)
     */
    public function store(Request $request)
    {
        $user = $request->user();

        // Validación
        $validator = Validator::make($request->all(), [
            'empleado_id' => 'required|exists:empleados,id',
            'tipo' => 'required|in:permiso,vacaciones,licencia_medica,licencia_maternidad,licencia_paternidad',
            'fecha_inicio' => 'required|date',
            'fecha_termino' => 'required|date|after_or_equal:fecha_inicio',
            'motivo' => 'nullable|string',
            'observaciones' => 'nullable|string',
            'archivo_pdf' => 'nullable|file|mimes:pdf|max:5120', // Máx 5MB
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        // Verificar que el usuario puede crear licencia para este empleado
        // 3=Conductor, 4=Mecánico, 5=Asistente solo pueden crear para sí mismos
        // MODIFICACION: Agregado el 4 al array
        if (in_array($user->rol_id, [3, 4, 5])) {
            $empleado = Empleado::where('user_id', $user->id)->first();
            if (!$empleado || $empleado->id != $request->empleado_id) {
                return response()->json(['message' => 'Solo puedes crear licencias para ti mismo'], 403);
            }
        }

        // Calcular días totales
        $fechaInicio = Carbon::parse($request->fecha_inicio);
        $fechaTermino = Carbon::parse($request->fecha_termino);
        $diasTotales = $fechaInicio->diffInDays($fechaTermino) + 1; // +1 para incluir ambos días

        // Verificar conflictos de fechas
        $modelo = new PermisoLicencia();
        if ($modelo->tieneConflicto($request->empleado_id, $request->fecha_inicio, $request->fecha_termino)) {
            return response()->json([
                'message' => 'El empleado ya tiene una licencia/permiso en ese rango de fechas'
            ], 422);
        }

        // Crear la licencia
        $licencia = new PermisoLicencia();
        $licencia->empleado_id = $request->empleado_id;
        $licencia->tipo = $request->tipo;
        $licencia->fecha_inicio = $request->fecha_inicio;
        $licencia->fecha_termino = $request->fecha_termino;
        $licencia->dias_totales = $diasTotales;
        $licencia->estado = 'solicitado';
        $licencia->motivo = $request->motivo;
        $licencia->observaciones = $request->observaciones;

        // Manejar archivo PDF si existe
        if ($request->hasFile('archivo_pdf')) {
            $file = $request->file('archivo_pdf');
            $nombreOriginal = $file->getClientOriginalName();
            
            // Crear nombre único: empleado_id_timestamp_nombre.pdf
            $nombreArchivo = $request->empleado_id . '_' . time() . '_' . $nombreOriginal;
            
            // Guardar en storage/app/public/licencias
            $ruta = $file->storeAs('licencias', $nombreArchivo, 'public');
            
            $licencia->ruta_archivo = $ruta;
            $licencia->nombre_archivo = $nombreOriginal;
        }

        $licencia->save();

        // Cargar relaciones para la respuesta
        $licencia->load('empleado');

        return response()->json([
            'message' => 'Licencia creada exitosamente',
            'licencia' => $licencia
        ], 201);
    }

    /**
     * Mostrar una licencia específica
     */
    public function show(Request $request, $id)
    {
        $user = $request->user();
        $licencia = PermisoLicencia::with(['empleado', 'aprobador', 'rechazador'])->find($id);

        if (!$licencia) {
            return response()->json(['message' => 'Licencia no encontrada'], 404);
        }

        // Verificar permisos: Admin/Manager/RRHH ven todo, Conductor/Asistente solo las suyas
        // 3=Conductor, 4=Mecánico, 5=Asistente
        // MODIFICACION: Agregado el 4 al array
        if (in_array($user->rol_id, [3, 4, 5])) {
            $empleado = Empleado::where('user_id', $user->id)->first();
            if (!$empleado || $licencia->empleado_id != $empleado->id) {
                return response()->json(['message' => 'No autorizado'], 403);
            }
        }

        return response()->json($licencia);
    }

    /**
     * Actualizar una licencia (solo si está en estado "solicitado")
     */
    public function update(Request $request, $id)
    {
        $user = $request->user();
        $licencia = PermisoLicencia::find($id);

        if (!$licencia) {
            return response()->json(['message' => 'Licencia no encontrada'], 404);
        }

        // Solo se pueden editar licencias en estado "solicitado"
        if ($licencia->estado !== 'solicitado') {
            return response()->json(['message' => 'Solo se pueden editar licencias en estado "solicitado"'], 422);
        }

        // Verificar permisos
        // 3=Conductor, 4=Mecánico, 5=Asistente solo pueden editar las suyas
        // MODIFICACION: Agregado el 4 al array
        if (in_array($user->rol_id, [3, 4, 5])) {
            $empleado = Empleado::where('user_id', $user->id)->first();
            if (!$empleado || $licencia->empleado_id != $empleado->id) {
                return response()->json(['message' => 'No autorizado'], 403);
            }
        }

        // Validación
        $validator = Validator::make($request->all(), [
            'tipo' => 'sometimes|in:permiso,vacaciones,licencia_medica,licencia_maternidad,licencia_paternidad',
            'fecha_inicio' => 'sometimes|date',
            'fecha_termino' => 'sometimes|date|after_or_equal:fecha_inicio',
            'motivo' => 'nullable|string',
            'observaciones' => 'nullable|string',
            'archivo_pdf' => 'nullable|file|mimes:pdf|max:5120',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        // Actualizar campos
        if ($request->has('tipo')) {
            $licencia->tipo = $request->tipo;
        }

        if ($request->has('fecha_inicio')) {
            $licencia->fecha_inicio = $request->fecha_inicio;
        }

        if ($request->has('fecha_termino')) {
            $licencia->fecha_termino = $request->fecha_termino;
        }

        // Recalcular días si cambió alguna fecha
        if ($request->has('fecha_inicio') || $request->has('fecha_termino')) {
            $fechaInicio = Carbon::parse($licencia->fecha_inicio);
            $fechaTermino = Carbon::parse($licencia->fecha_termino);
            $licencia->dias_totales = $fechaInicio->diffInDays($fechaTermino) + 1;

            // Verificar conflictos (excluyendo esta licencia)
            $modelo = new PermisoLicencia();
            if ($modelo->tieneConflicto($licencia->empleado_id, $licencia->fecha_inicio, $licencia->fecha_termino, $id)) {
                return response()->json([
                    'message' => 'Las nuevas fechas generan conflicto con otra licencia existente'
                ], 422);
            }
        }

        if ($request->has('motivo')) {
            $licencia->motivo = $request->motivo;
        }

        if ($request->has('observaciones')) {
            $licencia->observaciones = $request->observaciones;
        }

        // Actualizar archivo PDF si viene uno nuevo
        if ($request->hasFile('archivo_pdf')) {
            // Eliminar archivo anterior si existe
            if ($licencia->ruta_archivo) {
                Storage::disk('public')->delete($licencia->ruta_archivo);
            }

            $file = $request->file('archivo_pdf');
            $nombreOriginal = $file->getClientOriginalName();
            $nombreArchivo = $licencia->empleado_id . '_' . time() . '_' . $nombreOriginal;
            $ruta = $file->storeAs('licencias', $nombreArchivo, 'public');
            
            $licencia->ruta_archivo = $ruta;
            $licencia->nombre_archivo = $nombreOriginal;
        }

        $licencia->save();
        $licencia->load('empleado');

        return response()->json([
            'message' => 'Licencia actualizada exitosamente',
            'licencia' => $licencia
        ]);
    }

    /**
     * Aprobar una licencia
     * Acceso: Administrador, Manager, RRHH
     */
    public function aprobar(Request $request, $id)
    {
        $user = $request->user();

        // 1=Admin, 2=Manager, 6=RRHH
        if (!in_array($user->rol_id, [1, 2, 6])) {
            return response()->json(['message' => 'No autorizado'], 403);
        }

        $licencia = PermisoLicencia::find($id);

        if (!$licencia) {
            return response()->json(['message' => 'Licencia no encontrada'], 404);
        }

        if ($licencia->estado !== 'solicitado') {
            return response()->json(['message' => 'Solo se pueden aprobar licencias en estado "solicitado"'], 422);
        }

        $licencia->estado = 'aprobado';
        $licencia->aprobado_por = $user->id;
        $licencia->fecha_respuesta = now();
        $licencia->save();

        $this->marcarEmpleadoEnLicencia($licencia->empleado_id);

        $licencia->load(['empleado', 'aprobador']);

        return response()->json([
            'message' => 'Licencia aprobada exitosamente. El empleado ha sido marcado como "en licencia".',
            'licencia' => $licencia
        ]);
    }

    /**
     * Rechazar una licencia
     * Acceso: Administrador, Manager, RRHH
     */
    public function rechazar(Request $request, $id)
    {
        $user = $request->user();

        // 1=Admin, 2=Manager, 6=RRHH
        if (!in_array($user->rol_id, [1, 2, 6])) {
            return response()->json(['message' => 'No autorizado'], 403);
        }

        $validator = Validator::make($request->all(), [
            'motivo_rechazo' => 'required|string|min:10',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $licencia = PermisoLicencia::find($id);

        if (!$licencia) {
            return response()->json(['message' => 'Licencia no encontrada'], 404);
        }

        if ($licencia->estado !== 'solicitado') {
            return response()->json(['message' => 'Solo se pueden rechazar licencias en estado "solicitado"'], 422);
        }

        $licencia->estado = 'rechazado';
        $licencia->rechazado_por = $user->id;
        $licencia->motivo_rechazo = $request->motivo_rechazo;
        $licencia->fecha_respuesta = now();
        $licencia->save();

        $licencia->load(['empleado', 'rechazador']);

        return response()->json([
            'message' => 'Licencia rechazada',
            'licencia' => $licencia
        ]);
    }

    public function ausenciasActivas(Request $request)
    {
        $fecha = Carbon::now()->toDateString();

        $count = PermisoLicencia::where('estado', 'aprobado')
            ->activasEnRango($fecha, $fecha)
            ->count();

        return response()->json(['count' => $count]);
    }

    /**
     * Eliminar una licencia (solo en estado "solicitado")
     */
    public function destroy(Request $request, $id)
    {
        $user = $request->user();
        $licencia = PermisoLicencia::find($id);

        if (!$licencia) {
            return response()->json(['message' => 'Licencia no encontrada'], 404);
        }

        // Solo RRHH/Admin pueden eliminar (1=Admin, 6=RRHH)
        if (!in_array($user->rol_id, [1, 6])) {
            return response()->json(['message' => 'No autorizado'], 403);
        }

        if ($licencia->estado !== 'solicitado') {
            return response()->json(['message' => 'Solo se pueden eliminar licencias en estado "solicitado"'], 422);
        }

        // Eliminar archivo si existe
        if ($licencia->ruta_archivo) {
            Storage::disk('public')->delete($licencia->ruta_archivo);
        }

        $licencia->delete();

        return response()->json(['message' => 'Licencia eliminada exitosamente']);
    }

    /**
     * Descargar el PDF de la licencia
     */
    public function descargarPdf($id)
    {
        $licencia = PermisoLicencia::find($id);

        if (!$licencia || !$licencia->ruta_archivo) {
            return response()->json(['message' => 'Archivo no encontrado'], 404);
        }

        $rutaCompleta = storage_path('app/public/' . $licencia->ruta_archivo);

        if (!file_exists($rutaCompleta)) {
            return response()->json(['message' => 'Archivo no existe en el servidor'], 404);
        }

        return response()->download($rutaCompleta, $licencia->nombre_archivo);
    }

    private function marcarEmpleadoEnLicencia($empleadoId)
    {
        $empleado = Empleado::find($empleadoId);
        if ($empleado) {
            $empleado->estado = 'licencia';
            $empleado->save();
        }
    }
}
