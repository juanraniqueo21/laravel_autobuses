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
}