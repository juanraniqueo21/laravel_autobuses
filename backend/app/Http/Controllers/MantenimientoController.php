<?php

namespace App\Http\Controllers;

use App\Models\Mantenimiento;
use App\Models\Bus;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;

class MantenimientoController extends Controller
{
    public function index()
    {
        $mantenimientos = Mantenimiento::with(['bus', 'mecanico.user'])->get();
        return response()->json($mantenimientos);
    }

    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'bus_id' => 'required|exists:buses,id',
            'mecanico_id' => 'required|exists:empleados,id',
            'tipo_mantenimiento' => 'required|in:preventivo,correctivo,revision',
            'fecha_inicio' => 'required|date',
            'estado' => 'required|in:en_proceso,completado,cancelado',
            'costo_total' => 'nullable|numeric',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        DB::beginTransaction();
        try {
            // 1. Crear el registro de mantenimiento
            $mantenimiento = Mantenimiento::create($request->all());

            // 2. LÓGICA AUTOMÁTICA: Si el mantenimiento inicia, cambiar estado del BUS
            $bus = Bus::find($request->bus_id);
            
            if ($request->estado === 'en_proceso') {
                $bus->estado = 'mantenimiento';
                $bus->save();
            }

            DB::commit();
            return response()->json($mantenimiento, 201);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => 'Error al guardar mantenimiento', 'error' => $e->getMessage()], 500);
        }
    }

    public function update(Request $request, $id)
    {
        $mantenimiento = Mantenimiento::find($id);
        if (!$mantenimiento) return response()->json(['message' => 'No encontrado'], 404);

        DB::beginTransaction();
        try {
            $estadoAnterior = $mantenimiento->estado;
            
            // 1. Actualizar el mantenimiento
            $mantenimiento->update($request->all());

            // 2. LÓGICA AUTOMÁTICA: Liberar el bus si se completa el trabajo
            $bus = Bus::find($mantenimiento->bus_id);
            
            // Si pasa a completado o cancelado, el bus vuelve a estar operativo
            if ($request->estado === 'completado' || $request->estado === 'cancelado') {
                $bus->estado = 'operativo';
                $bus->save();
            }
            // Si por error se vuelve a poner en proceso, bloquear el bus de nuevo
            elseif ($request->estado === 'en_proceso') {
                $bus->estado = 'mantenimiento';
                $bus->save();
            }

            DB::commit();
            return response()->json($mantenimiento);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => 'Error al actualizar', 'error' => $e->getMessage()], 500);
        }
    }

    public function destroy($id)
    {
        $mantenimiento = Mantenimiento::find($id);
        if (!$mantenimiento) return response()->json(['message' => 'No encontrado'], 404);
        
        // Si borramos un mantenimiento en curso, liberamos el bus por seguridad
        if ($mantenimiento->estado === 'en_proceso') {
            $bus = Bus::find($mantenimiento->bus_id);
            if ($bus) {
                $bus->estado = 'operativo';
                $bus->save();
            }
        }
        
        $mantenimiento->delete();
        return response()->json(['message' => 'Eliminado correctamente']);
    }
}