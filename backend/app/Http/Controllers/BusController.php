<?php

namespace App\Http\Controllers;

use App\Models\Bus;
use App\Models\MarcaBus;
use App\Models\ModeloBus;
use App\Models\Mantenimiento;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class BusController extends Controller
{
    /**
     * Listar todos los buses
     */
    public function index(Request $request)
    {
        try {
            $query = Bus::query();

            // Filtrar por tipo de servicio si se proporciona
            if ($request->has('tipo_servicio')) {
                $query->where('tipo_servicio', $request->tipo_servicio);
            }

            // Filtrar por estado
            if ($request->has('estado')) {
                $query->where('estado', $request->estado);
            }

            $buses = $query->get();

            // Agregar nombre descriptivo del tipo de servicio
            $busesConAnalisis = $buses->map(function ($bus) {
                $busData = $bus->toArray();
                $busData['nombre_tipo_servicio'] = $bus->nombre_tipo_servicio;
                $busData['es_servicio_premium'] = $bus->esServicioPremium();
                return $busData;
            });

            return response()->json([
                'success' => true,
                'data' => $busesConAnalisis,
                'total' => $buses->count()
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al cargar buses',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Mostrar un bus específico
     */
    public function show($id)
    {
        try {
            $bus = Bus::with(['viajes', 'mantenimientos'])->find($id);

            if (!$bus) {
                return response()->json([
                    'success' => false,
                    'message' => 'Bus no encontrado'
                ], 404);
            }

            // Agregar información adicional del tipo de servicio
            $busData = $bus->toArray();
            $busData['nombre_tipo_servicio'] = $bus->nombre_tipo_servicio;
            $busData['es_servicio_premium'] = $bus->esServicioPremium();
            $busData['requiere_asistente'] = $bus->requiereAsistente();

            return response()->json([
                'success' => true,
                'data' => $busData
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al obtener bus',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Crear un nuevo bus
     */
    public function store(Request $request)
    {
        try {
            // Validaciones
            $validator = Validator::make($request->all(), [
                // Campos obligatorios
                'patente' => [
                    'required',
                    'string',
                    'max:10',
                    'unique:buses,patente',
                    'regex:/^[A-Z]{4}[0-9]{2}$/'
                ],
                'marca' => 'required|string|max:100',
                'modelo' => 'required|string|max:100',
                'tipo_combustible' => ['required', Rule::in(['diesel', 'gasolina', 'gas', 'eléctrico', 'híbrido'])],
                'anio' => 'required|integer|min:1980|max:' . (date('Y') + 1),
                'capacidad_pasajeros' => 'required|integer|min:1|max:100',
                'estado' => ['required', Rule::in(['operativo', 'mantenimiento', 'desmantelado'])],

                // Nuevos campos obligatorios
                'tipo_bus' => ['required', Rule::in(['simple', 'doble_piso'])],
                'cantidad_ejes' => ['required', Rule::in(['2', '3', '4'])],
                'tipo_servicio' => ['required', Rule::in(['clasico', 'semicama', 'cama', 'premium'])],

                // Campos opcionales
                'patente_verificador' => 'nullable|string|max:1',
                'numero_serie' => 'nullable|string|max:50|unique:buses,numero_serie',
                'numero_motor' => 'nullable|string|max:50',
                'numero_chasis' => 'nullable|string|max:50',
                'fecha_adquisicion' => 'nullable|date|before_or_equal:today',
                'kilometraje_original' => 'nullable|integer|min:0',
                
                // Motor
                'marca_motor' => 'nullable|string|max:50',
                'modelo_motor' => 'nullable|string|max:50',
                'ubicacion_motor' => ['nullable', Rule::in(['delantero', 'trasero', 'central'])],
                
                // Chasis
                'marca_chasis' => 'nullable|string|max:50',
                'modelo_chasis' => 'nullable|string|max:50',
                
                // Carrocería
                'marca_carroceria' => 'nullable|string|max:50',
                'modelo_carroceria' => 'nullable|string|max:50',
                
                // Mantenimiento
                'proximo_mantenimiento_km' => 'nullable|integer|min:0',
                'fecha_ultimo_mantenimiento' => 'nullable|date|before_or_equal:today',
                'fecha_proximo_mantenimiento' => 'nullable|date|after:fecha_ultimo_mantenimiento',
                
                // Documentación
                'ultima_revision_tecnica' => 'nullable|date|before_or_equal:today',
                'proxima_revision_tecnica' => 'nullable|date|after:ultima_revision_tecnica',
                'documento_revision_tecnica' => 'nullable|string|max:255',
                
                // SOAP (obligatorio)
                'numero_soap' => 'required|string|max:50',
                'vencimiento_soap' => 'required|date|after_or_equal:today',
                
                // Seguro adicional (opcional)
                'compania_seguro' => 'nullable|string|max:100',
                'numero_poliza' => 'nullable|string|max:50',
                'tipo_cobertura_adicional' => ['nullable', Rule::in(['ninguna', 'terceros', 'full'])],
                'vencimiento_poliza' => 'nullable|date|after_or_equal:today',
                
                'numero_permiso_circulacion' => 'nullable|string|max:50',
                'observaciones' => 'nullable|string|max:1000',
            ], [
                // Mensajes personalizados
                'patente.required' => 'La patente es obligatoria',
                'patente.unique' => 'Esta patente ya está registrada',
                'patente.regex' => 'Formato de patente inválido (debe ser 4 letras y 2 números, ej: ABCD12)',
                'marca.required' => 'La marca es obligatoria',
                'modelo.required' => 'El modelo es obligatorio',
                'tipo_combustible.required' => 'El tipo de combustible es obligatorio',
                'tipo_combustible.in' => 'Tipo de combustible inválido',
                'tipo_bus.required' => 'El tipo de bus es obligatorio',
                'tipo_bus.in' => 'Tipo de bus inválido',
                'cantidad_ejes.required' => 'La cantidad de ejes es obligatoria',
                'cantidad_ejes.in' => 'Cantidad de ejes inválida',
                'anio.required' => 'El año es obligatorio',
                'anio.min' => 'El año debe ser mayor a 1980',
                'anio.max' => 'El año no puede ser mayor al año siguiente',
                'capacidad_pasajeros.required' => 'La capacidad es obligatoria',
                'capacidad_pasajeros.min' => 'La capacidad debe ser al menos 1',
                'capacidad_pasajeros.max' => 'La capacidad no puede superar 100 pasajeros',
                'estado.required' => 'El estado es obligatorio',
                'estado.in' => 'Estado inválido',
                'numero_serie.unique' => 'Este número de serie ya está registrado',
                'proxima_revision_tecnica.after' => 'La próxima revisión debe ser después de la última',
                'fecha_proximo_mantenimiento.after' => 'El próximo mantenimiento debe ser después del último',
                'numero_soap.required' => 'El número de SOAP es obligatorio',
                'vencimiento_soap.required' => 'La fecha de vencimiento del SOAP es obligatoria',
                'vencimiento_soap.after_or_equal' => 'El SOAP no puede estar vencido',
                'tipo_cobertura_adicional.in' => 'Tipo de cobertura inválido',
                'vencimiento_poliza.after_or_equal' => 'La póliza no puede estar vencida',
                'ubicacion_motor.in' => 'Ubicación del motor inválida',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Errores de validación',
                    'errors' => $validator->errors()
                ], 422);
            }

            // Asignar factor de tarifa automáticamente según tipo de servicio
            $factoresTarifa = [
                'clasico' => 1.0,
                'semicama' => 1.4,
                'cama' => 2.0,
                'premium' => 3.0,
            ];
            $factorTarifa = $factoresTarifa[$request->tipo_servicio] ?? 1.0;

            // Crear el bus
            $bus = Bus::create([
                'patente' => strtoupper($request->patente),
                'patente_verificador' => $request->patente_verificador,
                'marca' => $request->marca,
                'modelo' => $request->modelo,
                'tipo_combustible' => $request->tipo_combustible,
                'anio' => $request->anio,
                'numero_serie' => $request->numero_serie,
                'numero_motor' => $request->numero_motor,
                'numero_chasis' => $request->numero_chasis,
                'capacidad_pasajeros' => $request->capacidad_pasajeros,
                'fecha_adquisicion' => $request->fecha_adquisicion,
                'estado' => $request->estado,

                // Nuevos campos
                'tipo_bus' => $request->tipo_bus,
                'cantidad_ejes' => $request->cantidad_ejes,
                'tipo_servicio' => $request->tipo_servicio,
                'factor_tarifa' => $factorTarifa,
                'marca_motor' => $request->marca_motor,
                'modelo_motor' => $request->modelo_motor,
                'ubicacion_motor' => $request->ubicacion_motor ?? 'trasero',
                'marca_chasis' => $request->marca_chasis,
                'modelo_chasis' => $request->modelo_chasis,
                'marca_carroceria' => $request->marca_carroceria,
                'modelo_carroceria' => $request->modelo_carroceria,
                'proximo_mantenimiento_km' => $request->proximo_mantenimiento_km,
                'fecha_ultimo_mantenimiento' => $request->fecha_ultimo_mantenimiento,
                'fecha_proximo_mantenimiento' => $request->fecha_proximo_mantenimiento,
                
                // Documentación
                'proxima_revision_tecnica' => $request->proxima_revision_tecnica,
                'ultima_revision_tecnica' => $request->ultima_revision_tecnica,
                'documento_revision_tecnica' => $request->documento_revision_tecnica,
                'numero_soap' => $request->numero_soap,
                'vencimiento_soap' => $request->vencimiento_soap,
                'compania_seguro' => $request->compania_seguro,
                'numero_poliza' => $request->numero_poliza,
                'tipo_cobertura_adicional' => $request->tipo_cobertura_adicional ?? 'ninguna',
                'vencimiento_poliza' => $request->vencimiento_poliza,
                'numero_permiso_circulacion' => $request->numero_permiso_circulacion,
                'observaciones' => $request->observaciones,
                'kilometraje_original' => $request->kilometraje_original ?? 0,
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Bus creado exitosamente',
                'data' => $bus
            ], 201);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al crear bus',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Actualizar un bus existente
     */
    public function update(Request $request, $id)
    {
        try {
            $bus = Bus::find($id);
            
            if (!$bus) {
                return response()->json([
                    'success' => false,
                    'message' => 'Bus no encontrado'
                ], 404);
            }

            // Validaciones
            $validator = Validator::make($request->all(), [
                'patente' => [
                    'sometimes',
                    'required',
                    'string',
                    'max:10',
                    Rule::unique('buses', 'patente')->ignore($id),
                    'regex:/^[A-Z]{4}[0-9]{2}$/'
                ],
                'marca' => 'sometimes|required|string|max:100',
                'modelo' => 'sometimes|required|string|max:100',
                'tipo_combustible' => ['sometimes', 'required', Rule::in(['diesel', 'gasolina', 'gas', 'eléctrico', 'híbrido'])],
                'anio' => 'sometimes|required|integer|min:1980|max:' . (date('Y') + 1),
                'capacidad_pasajeros' => 'sometimes|required|integer|min:1|max:100',
                'estado' => ['sometimes', 'required', Rule::in(['operativo', 'mantenimiento', 'desmantelado'])],
                'tipo_bus' => ['sometimes', 'required', Rule::in(['simple', 'doble_piso'])],
                'cantidad_ejes' => ['sometimes', 'required', Rule::in(['2', '3', '4'])],
                'patente_verificador' => 'nullable|string|max:1',
                'numero_serie' => [
                    'nullable',
                    'string',
                    'max:50',
                    Rule::unique('buses', 'numero_serie')->ignore($id)
                ],
                'numero_motor' => 'nullable|string|max:50',
                'numero_chasis' => 'nullable|string|max:50',
                'fecha_adquisicion' => 'nullable|date|before_or_equal:today',
                'kilometraje_original' => 'nullable|integer|min:0',
                'marca_motor' => 'nullable|string|max:50',
                'modelo_motor' => 'nullable|string|max:50',
                'ubicacion_motor' => ['nullable', Rule::in(['delantero', 'trasero', 'central'])],
                'marca_chasis' => 'nullable|string|max:50',
                'modelo_chasis' => 'nullable|string|max:50',
                'marca_carroceria' => 'nullable|string|max:50',
                'modelo_carroceria' => 'nullable|string|max:50',
                'proximo_mantenimiento_km' => 'nullable|integer|min:0',
                'fecha_ultimo_mantenimiento' => 'nullable|date|before_or_equal:today',
                'fecha_proximo_mantenimiento' => 'nullable|date',
                'ultima_revision_tecnica' => 'nullable|date|before_or_equal:today',
                'proxima_revision_tecnica' => 'nullable|date',
                'documento_revision_tecnica' => 'nullable|string|max:255',
                'numero_soap' => 'sometimes|required|string|max:50',
                'vencimiento_soap' => 'sometimes|required|date',
                'compania_seguro' => 'nullable|string|max:100',
                'numero_poliza' => 'nullable|string|max:50',
                'tipo_cobertura_adicional' => ['nullable', Rule::in(['ninguna', 'terceros', 'full'])],
                'vencimiento_poliza' => 'nullable|date',
                'numero_permiso_circulacion' => 'nullable|string|max:50',
                'observaciones' => 'nullable|string|max:1000',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Errores de validación',
                    'errors' => $validator->errors()
                ], 422);
            }

            // Actualizar campos
            $bus->update($request->only([
                'patente', 'patente_verificador', 'marca', 'modelo', 'tipo_combustible',
                'anio', 'numero_serie', 'numero_motor', 'numero_chasis', 'capacidad_pasajeros',
                'fecha_adquisicion', 'estado', 'tipo_bus', 'cantidad_ejes',
                'marca_motor', 'modelo_motor', 'ubicacion_motor',
                'marca_chasis', 'modelo_chasis', 'marca_carroceria', 'modelo_carroceria',
                'proximo_mantenimiento_km', 'fecha_ultimo_mantenimiento', 'fecha_proximo_mantenimiento',
                'proxima_revision_tecnica', 'ultima_revision_tecnica', 'documento_revision_tecnica',
                'numero_soap', 'vencimiento_soap', 'compania_seguro', 'numero_poliza',
                'tipo_cobertura_adicional', 'vencimiento_poliza', 'numero_permiso_circulacion',
                'observaciones', 'kilometraje_original'
            ]));

            return response()->json([
                'success' => true,
                'message' => 'Bus actualizado exitosamente',
                'data' => $bus->fresh()
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al actualizar bus',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Activar bus en modo emergencia
     * Cambia el estado del bus a operativo y marca mantenimientos en proceso como pendientes
     */
    public function activarEmergencia($id)
    {
        try {
            DB::beginTransaction();

            $bus = Bus::find($id);

            if (!$bus) {
                return response()->json([
                    'success' => false,
                    'message' => 'Bus no encontrado'
                ], 404);
            }

            // Verificar que el bus esté en mantenimiento
            if ($bus->estado !== 'mantenimiento') {
                return response()->json([
                    'success' => false,
                    'message' => 'El bus no está en mantenimiento'
                ], 400);
            }

            // Marcar mantenimientos en proceso como cancelados (suspendidos por emergencia)
            $mantenimientosActivos = Mantenimiento::where('bus_id', $id)
                ->where('estado', 'en_proceso')
                ->get();

            foreach ($mantenimientosActivos as $mantenimiento) {
                $mantenimiento->update([
                    'estado' => 'cancelado',
                    'observaciones' => ($mantenimiento->observaciones ?? '') .
                        ' [SUSPENDIDO POR EMERGENCIA - ' . now()->format('Y-m-d H:i') . ']'
                ]);
            }

            // Activar el bus
            $bus->update(['estado' => 'operativo']);

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Bus activado en modo emergencia exitosamente',
                'data' => $bus->fresh(),
                'mantenimientos_suspendidos' => $mantenimientosActivos->count()
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Error al activar bus en emergencia',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Eliminar un bus
     */
    public function destroy($id)
    {
        try {
            $bus = Bus::find($id);

            if (!$bus) {
                return response()->json([
                    'success' => false,
                    'message' => 'Bus no encontrado'
                ], 404);
            }

            if ($bus->viajes()->count() > 0) {
                return response()->json([
                    'success' => false,
                    'message' => 'No se puede eliminar un bus con viajes asociados',
                    'viajes_count' => $bus->viajes()->count()
                ], 400);
            }

            $bus->delete();

            return response()->json([
                'success' => true,
                'message' => 'Bus eliminado exitosamente'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al eliminar bus',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    // ============================================
    // ENDPOINTS PARA CATÁLOGOS
    // ============================================

    /**
     * Obtener marcas por tipo
     * GET /api/buses/catalogos/marcas/{tipo}
     * Tipos: bus, motor, chasis, carroceria
     */
    public function getMarcas($tipo)
    {
        try {
            $marcas = MarcaBus::where('tipo', $tipo)
                ->where('activo', true)
                ->orderBy('nombre')
                ->get(['id', 'nombre']);

            return response()->json([
                'success' => true,
                'data' => $marcas
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al obtener marcas',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Obtener modelos de una marca específica
     * GET /api/buses/catalogos/modelos/{marcaId}
     */
    public function getModelos($marcaId)
    {
        try {
            $modelos = ModeloBus::where('marca_id', $marcaId)
                ->where('activo', true)
                ->orderBy('nombre')
                ->get(['id', 'nombre']);

            return response()->json([
                'success' => true,
                'data' => $modelos
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al obtener modelos',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Obtener todos los catálogos de una vez
     * GET /api/buses/catalogos/todos
     */
    public function getCatalogosCompletos()
    {
        try {
            $catalogos = [
                'marcas_bus' => MarcaBus::buses()->get(['id', 'nombre']),
                'marcas_motor' => MarcaBus::motores()->get(['id', 'nombre']),
                'marcas_chasis' => MarcaBus::chasis()->get(['id', 'nombre']),
                'marcas_carroceria' => MarcaBus::carrocerias()->get(['id', 'nombre']),
            ];

            return response()->json([
                'success' => true,
                'data' => $catalogos
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al obtener catálogos',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}