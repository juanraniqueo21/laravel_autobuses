<?php

namespace App\Http\Controllers;

use App\Models\Ruta;
use App\Models\RutaParada;
use App\Models\RutaTarifa;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;

class RutaController extends Controller
{
    // ============================================
    // CRUD PRINCIPAL DE RUTAS
    // ============================================

    /**
     * Listar todas las rutas con sus paradas y tarifas
     */
    public function index()
    {
        $rutas = Ruta::with(['paradas'])
            ->orderBy('codigo_ruta')
            ->get();
        
        return response()->json($rutas);
    }

    /**
     * Obtener una ruta específica con toda su información
     */
    public function show($id)
    {
        $ruta = Ruta::with(['paradas'])->find($id);
        
        if (!$ruta) {
            return response()->json(['error' => 'Ruta no encontrada'], 404);
        }
        
        return response()->json($ruta);
    }

    /**
     * Crear una nueva ruta (solo información básica)
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'nombre_ruta' => 'required|string|max:100',
            'codigo_ruta' => 'required|string|max:20|unique:rutas,codigo_ruta',
            'origen' => 'required|string|max:255',
            'destino' => 'required|string|max:255',
            'descripcion' => 'nullable|string',
            'estado' => 'nullable|in:activa,inactiva,en_revision',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $ruta = Ruta::create([
            'nombre_ruta' => $request->nombre_ruta,
            'codigo_ruta' => $request->codigo_ruta,
            'origen' => $request->origen,
            'destino' => $request->destino,
            'descripcion' => $request->descripcion,
            'estado' => $request->estado ?? 'activa',
            'distancia_km' => 0, // Se calculará con las paradas
            'tiempo_estimado_minutos' => 0, // Se calculará con las paradas
        ]);

        return response()->json($ruta, 201);
    }

    /**
     * Actualizar información básica de la ruta
     */
    public function update(Request $request, $id)
    {
        $ruta = Ruta::find($id);
        
        if (!$ruta) {
            return response()->json(['error' => 'Ruta no encontrada'], 404);
        }

        $validator = Validator::make($request->all(), [
            'nombre_ruta' => 'sometimes|required|string|max:100',
            'codigo_ruta' => 'sometimes|required|string|max:20|unique:rutas,codigo_ruta,' . $id,
            'origen' => 'sometimes|required|string|max:255',
            'destino' => 'sometimes|required|string|max:255',
            'descripcion' => 'nullable|string',
            'estado' => 'nullable|in:activa,inactiva,en_revision',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $ruta->update($request->only([
            'nombre_ruta',
            'codigo_ruta',
            'origen',
            'destino',
            'descripcion',
            'estado'
        ]));

        return response()->json($ruta);
    }

    /**
     * Eliminar una ruta
     */
    public function destroy($id)
    {
        $ruta = Ruta::find($id);
        
        if (!$ruta) {
            return response()->json(['error' => 'Ruta no encontrada'], 404);
        }

        // Verificar si tiene viajes asociados
        if ($ruta->viajes()->exists()) {
            return response()->json([
                'error' => 'No se puede eliminar la ruta porque tiene viajes asociados'
            ], 400);
        }

        $ruta->delete();
        
        return response()->json(['message' => 'Ruta eliminada exitosamente']);
    }

    // ============================================
    // GESTIÓN DE PARADAS
    // ============================================

    /**
     * Agregar parada a una ruta
     */
    public function agregarParada(Request $request, $rutaId)
    {
        $ruta = Ruta::find($rutaId);
        
        if (!$ruta) {
            return response()->json(['error' => 'Ruta no encontrada'], 404);
        }

        $validator = Validator::make($request->all(), [
            'ciudad' => 'required|string|max:100',
            'orden' => 'required|integer|min:1',
            'es_origen' => 'boolean',
            'es_destino' => 'boolean',
            'distancia_desde_anterior_km' => 'nullable|numeric|min:0',
            'tiempo_desde_anterior_min' => 'nullable|integer|min:0',
            'observaciones' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        // Verificar que no exista otra parada con el mismo orden
        $existeOrden = RutaParada::where('ruta_id', $rutaId)
            ->where('orden', $request->orden)
            ->exists();

        if ($existeOrden) {
            return response()->json([
                'error' => 'Ya existe una parada con ese orden en esta ruta'
            ], 400);
        }

        $parada = RutaParada::create([
            'ruta_id' => $rutaId,
            'ciudad' => $request->ciudad,
            'orden' => $request->orden,
            'es_origen' => $request->es_origen ?? false,
            'es_destino' => $request->es_destino ?? false,
            'distancia_desde_anterior_km' => $request->distancia_desde_anterior_km,
            'tiempo_desde_anterior_min' => $request->tiempo_desde_anterior_min,
            'observaciones' => $request->observaciones,
        ]);

        // Recalcular distancia y tiempo total de la ruta
        $this->recalcularTotalesRuta($rutaId);

        return response()->json($parada, 201);
    }

    /**
     * Actualizar una parada existente
     */
    public function actualizarParada(Request $request, $rutaId, $paradaId)
    {
        $parada = RutaParada::where('ruta_id', $rutaId)
            ->where('id', $paradaId)
            ->first();

        if (!$parada) {
            return response()->json(['error' => 'Parada no encontrada'], 404);
        }

        $validator = Validator::make($request->all(), [
            'ciudad' => 'sometimes|required|string|max:100',
            'orden' => 'sometimes|required|integer|min:1',
            'distancia_desde_anterior_km' => 'nullable|numeric|min:0',
            'tiempo_desde_anterior_min' => 'nullable|integer|min:0',
            'observaciones' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        // Verificar orden único si se está cambiando
        if ($request->has('orden') && $request->orden != $parada->orden) {
            $existeOrden = RutaParada::where('ruta_id', $rutaId)
                ->where('orden', $request->orden)
                ->where('id', '!=', $paradaId)
                ->exists();

            if ($existeOrden) {
                return response()->json([
                    'error' => 'Ya existe otra parada con ese orden'
                ], 400);
            }
        }

        $parada->update($request->only([
            'ciudad',
            'orden',
            'distancia_desde_anterior_km',
            'tiempo_desde_anterior_min',
            'observaciones'
        ]));

        // Recalcular totales
        $this->recalcularTotalesRuta($rutaId);

        return response()->json($parada);
    }

    /**
     * Eliminar una parada
     */
    public function eliminarParada($rutaId, $paradaId)
    {
        $parada = RutaParada::where('ruta_id', $rutaId)
            ->where('id', $paradaId)
            ->first();

        if (!$parada) {
            return response()->json(['error' => 'Parada no encontrada'], 404);
        }

        // No permitir eliminar origen o destino si hay otras paradas
        $totalParadas = RutaParada::where('ruta_id', $rutaId)->count();
        
        if ($totalParadas > 2 && ($parada->es_origen || $parada->es_destino)) {
            return response()->json([
                'error' => 'No se puede eliminar el origen o destino mientras haya paradas intermedias'
            ], 400);
        }

        $parada->delete();

        // Recalcular totales
        $this->recalcularTotalesRuta($rutaId);

        return response()->json(['message' => 'Parada eliminada exitosamente']);
    }

    /**
     * Guardar todas las paradas de una vez (al crear/editar ruta completa)
     */
    public function guardarParadas(Request $request, $rutaId)
    {
        $ruta = Ruta::find($rutaId);
        
        if (!$ruta) {
            return response()->json(['error' => 'Ruta no encontrada'], 404);
        }

        $validator = Validator::make($request->all(), [
            'paradas' => 'required|array|min:2',
            'paradas.*.ciudad' => 'required|string|max:100',
            'paradas.*.orden' => 'required|integer|min:1',
            'paradas.*.es_origen' => 'boolean',
            'paradas.*.es_destino' => 'boolean',
            'paradas.*.distancia_desde_anterior_km' => 'nullable|numeric|min:0',
            'paradas.*.tiempo_desde_anterior_min' => 'nullable|integer|min:0',
            'paradas.*.tarifa_adulto' => 'nullable|integer|min:0',
            'paradas.*.tarifa_estudiante' => 'nullable|integer|min:0',
            'paradas.*.tarifa_tercera_edad' => 'nullable|integer|min:0',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        DB::beginTransaction();
        try {
            // Eliminar paradas existentes
            RutaParada::where('ruta_id', $rutaId)->delete();

            // Crear nuevas paradas
            foreach ($request->paradas as $paradaData) {
                RutaParada::create([
                    'ruta_id' => $rutaId,
                    'ciudad' => $paradaData['ciudad'],
                    'orden' => $paradaData['orden'],
                    'es_origen' => $paradaData['es_origen'] ?? false,
                    'es_destino' => $paradaData['es_destino'] ?? false,
                    'distancia_desde_anterior_km' => $paradaData['distancia_desde_anterior_km'] ?? null,
                    'tiempo_desde_anterior_min' => $paradaData['tiempo_desde_anterior_min'] ?? null,
                    'tarifa_adulto' => $paradaData['tarifa_adulto'] ?? 0,
                    'tarifa_estudiante' => $paradaData['tarifa_estudiante'] ?? 0,
                    'tarifa_tercera_edad' => $paradaData['tarifa_tercera_edad'] ?? 0,
                    'observaciones' => $paradaData['observaciones'] ?? null,
                ]);
            }

            // Recalcular totales
            $this->recalcularTotalesRuta($rutaId);

            DB::commit();

            $ruta->load('paradas');
            return response()->json($ruta);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['error' => 'Error al guardar paradas: ' . $e->getMessage()], 500);
        }
    }

    

    // ============================================
    // MÉTODOS AUXILIARES
    // ============================================

    /**
     * Recalcular distancia y tiempo total de la ruta
     */
    private function recalcularTotalesRuta($rutaId)
    {
        $ruta = Ruta::find($rutaId);
        
        if ($ruta) {
            $distanciaTotal = $ruta->calcularDistanciaTotal();
            $tiempoTotal = $ruta->calcularTiempoTotal();

            $ruta->update([
                'distancia_km' => $distanciaTotal,
                'tiempo_estimado_minutos' => $tiempoTotal,
            ]);
        }
    }

    /**
     * Obtener rutas activas
     */
    public function rutasActivas()
    {
        $rutas = Ruta::activas()
            ->with(['paradas'])
            ->get();
        
        return response()->json($rutas);
    }
}