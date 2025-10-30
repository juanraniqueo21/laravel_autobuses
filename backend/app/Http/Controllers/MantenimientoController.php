<?php

namespace App\Http\Controllers;

use App\Models\Mantenimiento;
use Illuminate\Http\Request;

class MantenimientoController extends Controller
{
    public function index()
    {
        $mantenimientos = Mantenimiento::with('bus', 'mecanico.user')->get();
        return response()->json($mantenimientos);
    }

    public function show($id)
    {
        $mantenimiento = Mantenimiento::with('bus', 'mecanico.user')->find($id);
        if (!$mantenimiento) {
            return response()->json(['error' => 'Mantenimiento no encontrado'], 404);
        }
        return response()->json($mantenimiento);
    }

    public function store(Request $request)
    {
        $mantenimiento = Mantenimiento::create([
            'bus_id' => $request->bus_id,
            'mecanico_id' => $request->mecanico_id,
            'tipo_mantenimiento' => $request->tipo_mantenimiento,
            'descripcion' => $request->descripcion,
            'fecha_inicio' => $request->fecha_inicio,
            'fecha_termino' => $request->fecha_termino,
            'costo_total' => $request->costo_total,
            'estado' => $request->estado ?? 'en_proceso',
            'repuestos_utilizados' => $request->repuestos_utilizados,
            'observaciones' => $request->observaciones,
        ]);
        return response()->json($mantenimiento, 201);
    }

    public function update(Request $request, $id)
    {
        $mantenimiento = Mantenimiento::find($id);
        if (!$mantenimiento) {
            return response()->json(['error' => 'Mantenimiento no encontrado'], 404);
        }

        $mantenimiento->update([
            'bus_id' => $request->bus_id ?? $mantenimiento->bus_id,
            'mecanico_id' => $request->mecanico_id ?? $mantenimiento->mecanico_id,
            'tipo_mantenimiento' => $request->tipo_mantenimiento ?? $mantenimiento->tipo_mantenimiento,
            'descripcion' => $request->descripcion ?? $mantenimiento->descripcion,
            'fecha_inicio' => $request->fecha_inicio ?? $mantenimiento->fecha_inicio,
            'fecha_termino' => $request->fecha_termino ?? $mantenimiento->fecha_termino,
            'costo_total' => $request->costo_total ?? $mantenimiento->costo_total,
            'estado' => $request->estado ?? $mantenimiento->estado,
            'repuestos_utilizados' => $request->repuestos_utilizados ?? $mantenimiento->repuestos_utilizados,
            'observaciones' => $request->observaciones ?? $mantenimiento->observaciones,
        ]);

        return response()->json($mantenimiento);
    }

    public function destroy($id)
    {
        $mantenimiento = Mantenimiento::find($id);
        if (!$mantenimiento) {
            return response()->json(['error' => 'Mantenimiento no encontrado'], 404);
        }

        $mantenimiento->delete();
        return response()->json(['message' => 'Mantenimiento eliminado']);
    }
}