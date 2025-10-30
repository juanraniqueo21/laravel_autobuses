<?php

namespace App\Http\Controllers;

use App\Models\Conductor;
use Illuminate\Http\Request;

class ConductorController extends Controller
{
    public function index()
    {
        $conductores = Conductor::with('empleado.user')->get();
        return response()->json($conductores);
    }

    public function show($id)
    {
        $conductor = Conductor::with('empleado')->find($id);
        if (!$conductor) {
            return response()->json(['error' => 'Conductor no encontrado'], 404);
        }
        return response()->json($conductor);
    }

    public function store(Request $request)
    {
        $conductor = Conductor::create([
            'empleado_id' => $request->empleado_id,
            'numero_licencia' => $request->numero_licencia,
            'clase_licencia' => $request->clase_licencia,
            'fecha_vencimiento_licencia' => $request->fecha_vencimiento_licencia,
            'fecha_emision_licencia' => $request->fecha_emision_licencia,
            'puntos_licencia' => $request->puntos_licencia ?? 0,
            'estado' => $request->estado ?? 'activo',
            // Nuevos campos
            'anios_experiencia' => $request->anios_experiencia ?? 0,
            'fecha_primera_licencia' => $request->fecha_primera_licencia,
            'estado_licencia' => $request->estado_licencia ?? 'vigente',
            'observaciones_licencia' => $request->observaciones_licencia,
            'cantidad_infracciones' => $request->cantidad_infracciones ?? 0,
            'cantidad_accidentes' => $request->cantidad_accidentes ?? 0,
            'historial_sanciones' => $request->historial_sanciones,
            'fecha_ultima_revision_medica' => $request->fecha_ultima_revision_medica,
            'apto_conducir' => $request->apto_conducir ?? true,
            'certificado_rcp' => $request->certificado_rcp ?? false,
            'vencimiento_rcp' => $request->vencimiento_rcp,
            'certificado_defensa' => $request->certificado_defensa ?? false,
            'vencimiento_defensa' => $request->vencimiento_defensa,
        ]);
        return response()->json($conductor, 201);
    }

    public function update(Request $request, $id)
    {
        $conductor = Conductor::find($id);
        if (!$conductor) {
            return response()->json(['error' => 'Conductor no encontrado'], 404);
        }

        $conductor->update([
            'empleado_id' => $request->empleado_id ?? $conductor->empleado_id,
            'numero_licencia' => $request->numero_licencia ?? $conductor->numero_licencia,
            'clase_licencia' => $request->clase_licencia ?? $conductor->clase_licencia,
            'fecha_vencimiento_licencia' => $request->fecha_vencimiento_licencia ?? $conductor->fecha_vencimiento_licencia,
            'fecha_emision_licencia' => $request->fecha_emision_licencia ?? $conductor->fecha_emision_licencia,
            'puntos_licencia' => $request->puntos_licencia ?? $conductor->puntos_licencia,
            'estado' => $request->estado ?? $conductor->estado,
            // Nuevos campos
            'anios_experiencia' => $request->anios_experiencia ?? $conductor->anios_experiencia,
            'fecha_primera_licencia' => $request->fecha_primera_licencia ?? $conductor->fecha_primera_licencia,
            'estado_licencia' => $request->estado_licencia ?? $conductor->estado_licencia,
            'observaciones_licencia' => $request->observaciones_licencia ?? $conductor->observaciones_licencia,
            'cantidad_infracciones' => $request->cantidad_infracciones ?? $conductor->cantidad_infracciones,
            'cantidad_accidentes' => $request->cantidad_accidentes ?? $conductor->cantidad_accidentes,
            'historial_sanciones' => $request->historial_sanciones ?? $conductor->historial_sanciones,
            'fecha_ultima_revision_medica' => $request->fecha_ultima_revision_medica ?? $conductor->fecha_ultima_revision_medica,
            'apto_conducir' => $request->apto_conducir ?? $conductor->apto_conducir,
            'certificado_rcp' => $request->certificado_rcp ?? $conductor->certificado_rcp,
            'vencimiento_rcp' => $request->vencimiento_rcp ?? $conductor->vencimiento_rcp,
            'certificado_defensa' => $request->certificado_defensa ?? $conductor->certificado_defensa,
            'vencimiento_defensa' => $request->vencimiento_defensa ?? $conductor->vencimiento_defensa,
        ]);

        return response()->json($conductor);
    }

    public function destroy($id)
    {
        $conductor = Conductor::find($id);
        if (!$conductor) {
            return response()->json(['error' => 'Conductor no encontrado'], 404);
        }

        $conductor->delete();
        return response()->json(['message' => 'Conductor eliminado']);
    }
}