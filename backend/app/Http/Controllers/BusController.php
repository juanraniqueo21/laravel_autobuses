<?php

namespace App\Http\Controllers;

use App\Models\Bus;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;

class BusController extends Controller
{
    /**
     * Listar todos los buses
     */
    public function index()
    {
        try {
            $buses = Bus::with(['viajes' => function($query) {
                $query->latest()->limit(5);
            }])->get();

            return response()->json([
                'success' => true,
                'data' => $buses,
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

            return response()->json([
                'success' => true,
                'data' => $bus
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
                    'regex:/^[A-Z]{4}[0-9]{2}$/' // Formato chileno: 
                ],
                'marca' => 'required|string|max:100',
                'modelo' => 'required|string|max:100',
                'tipo_combustible' => ['required', Rule::in(['diesel', 'gasolina', 'gas', 'eléctrico', 'híbrido'])],
                'color' => 'nullable|string|max:50',
                'anio' => 'required|integer|min:1980|max:' . (date('Y') + 1),
                'capacidad_pasajeros' => 'required|integer|min:1|max:100',
                'estado' => ['required', Rule::in(['operativo', 'mantenimiento', 'desmantelado'])],

                // Campos opcionales
                'patente_verificador' => 'nullable|string|max:1',
                'numero_serie' => 'nullable|string|max:50|unique:buses,numero_serie',
                'numero_motor' => 'nullable|string|max:50',
                'fecha_adquisicion' => 'nullable|date|before_or_equal:today',
                'kilometraje_original' => 'nullable|integer|min:0',
                'kilometraje_actual' => 'nullable|integer|min:0',
                
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
                'color.max' => 'El color no puede tener más de 50 caracteres',
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
                'numero_soap.required' => 'El número de SOAP es obligatorio',
                'vencimiento_soap.required' => 'La fecha de vencimiento del SOAP es obligatoria',
                'vencimiento_soap.after_or_equal' => 'El SOAP no puede estar vencido',
                'compania_seguro.max' => 'El nombre de la compañía es muy largo',
                'tipo_cobertura_adicional.in' => 'Tipo de cobertura inválido',
                'vencimiento_poliza.after_or_equal' => 'La póliza no puede estar vencida',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Errores de validación',
                    'errors' => $validator->errors()
                ], 422);
            }

            // Validación adicional: kilometraje_actual >= kilometraje_original
            if ($request->kilometraje_actual && $request->kilometraje_original) {
                if ($request->kilometraje_actual < $request->kilometraje_original) {
                    return response()->json([
                        'success' => false,
                        'message' => 'El kilometraje actual no puede ser menor al original',
                        'errors' => [
                            'kilometraje_actual' => ['El kilometraje actual debe ser mayor o igual al original']
                        ]
                    ], 422);
                }
            }

            // Crear el bus
            $bus = Bus::create([
                'patente' => strtoupper($request->patente), // Siempre en mayúsculas
                'patente_verificador' => $request->patente_verificador,
                'marca' => $request->marca,
                'modelo' => $request->modelo,
                'tipo_combustible' => $request->tipo_combustible,
                'color' => $request->color,
                'anio' => $request->anio,
                'numero_serie' => $request->numero_serie,
                'numero_motor' => $request->numero_motor,
                'capacidad_pasajeros' => $request->capacidad_pasajeros,
                'fecha_adquisicion' => $request->fecha_adquisicion,
                'estado' => $request->estado,
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
                'kilometraje_actual' => $request->kilometraje_actual ?? 0,
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

            // Validaciones (igual que store pero con unique ignorando el ID actual)
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
                'color' => 'nullable|string|max:50',
                'anio' => 'sometimes|required|integer|min:1980|max:' . (date('Y') + 1),
                'capacidad_pasajeros' => 'sometimes|required|integer|min:1|max:100',
                'estado' => ['sometimes', 'required', Rule::in(['operativo', 'mantenimiento', 'desmantelado'])],
                'patente_verificador' => 'nullable|string|max:1',
                'numero_serie' => [
                    'nullable',
                    'string',
                    'max:50',
                    Rule::unique('buses', 'numero_serie')->ignore($id)
                ],
                'numero_motor' => 'nullable|string|max:50',
                'fecha_adquisicion' => 'nullable|date|before_or_equal:today',
                'kilometraje_original' => 'nullable|integer|min:0',
                'kilometraje_actual' => 'nullable|integer|min:0',
                'ultima_revision_tecnica' => 'nullable|date|before_or_equal:today',
                'proxima_revision_tecnica' => 'nullable|date',
                'documento_revision_tecnica' => 'nullable|string|max:255',
                
                // SOAP
                'numero_soap' => 'sometimes|required|string|max:50',
                'vencimiento_soap' => 'sometimes|required|date',
                
                // Seguro adicional
                'compania_seguro' => 'nullable|string|max:100',
                'numero_poliza' => 'nullable|string|max:50',
                'tipo_cobertura_adicional' => ['nullable', Rule::in(['ninguna', 'terceros', 'full'])],
                'vencimiento_poliza' => 'nullable|date',
                
                'numero_permiso_circulacion' => 'nullable|string|max:50',
                'observaciones' => 'nullable|string|max:1000',
            ], [
                'patente.unique' => 'Esta patente ya está registrada',
                'patente.regex' => 'Formato de patente inválido (debe ser 4 letras y 2 números, ej: ABCD12)',
                'numero_serie.unique' => 'Este número de serie ya está registrado',
                'tipo_combustible.in' => 'Tipo de combustible inválido',
                'tipo_cobertura_adicional.in' => 'Tipo de cobertura inválido',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Errores de validación',
                    'errors' => $validator->errors()
                ], 422);
            }

            // Validación adicional: kilometraje_actual >= kilometraje_original
            $kmActual = $request->kilometraje_actual ?? $bus->kilometraje_actual;
            $kmOriginal = $request->kilometraje_original ?? $bus->kilometraje_original;

            if ($kmActual < $kmOriginal) {
                return response()->json([
                    'success' => false,
                    'message' => 'El kilometraje actual no puede ser menor al original',
                    'errors' => [
                        'kilometraje_actual' => ['El kilometraje actual debe ser mayor o igual al original']
                    ]
                ], 422);
            }

            // Actualizar campos (solo los que vienen en el request)
            $dataToUpdate = [];
            
            if ($request->has('patente')) $dataToUpdate['patente'] = strtoupper($request->patente);
            if ($request->has('patente_verificador')) $dataToUpdate['patente_verificador'] = $request->patente_verificador;
            if ($request->has('marca')) $dataToUpdate['marca'] = $request->marca;
            if ($request->has('modelo')) $dataToUpdate['modelo'] = $request->modelo;
            if ($request->has('tipo_combustible')) $dataToUpdate['tipo_combustible'] = $request->tipo_combustible;
            if ($request->has('color')) $dataToUpdate['color'] = $request->color;
            if ($request->has('anio')) $dataToUpdate['anio'] = $request->anio;
            if ($request->has('numero_serie')) $dataToUpdate['numero_serie'] = $request->numero_serie;
            if ($request->has('numero_motor')) $dataToUpdate['numero_motor'] = $request->numero_motor;
            if ($request->has('capacidad_pasajeros')) $dataToUpdate['capacidad_pasajeros'] = $request->capacidad_pasajeros;
            if ($request->has('fecha_adquisicion')) $dataToUpdate['fecha_adquisicion'] = $request->fecha_adquisicion;
            if ($request->has('estado')) $dataToUpdate['estado'] = $request->estado;
            if ($request->has('proxima_revision_tecnica')) $dataToUpdate['proxima_revision_tecnica'] = $request->proxima_revision_tecnica;
            if ($request->has('ultima_revision_tecnica')) $dataToUpdate['ultima_revision_tecnica'] = $request->ultima_revision_tecnica;
            if ($request->has('documento_revision_tecnica')) $dataToUpdate['documento_revision_tecnica'] = $request->documento_revision_tecnica;
            if ($request->has('numero_soap')) $dataToUpdate['numero_soap'] = $request->numero_soap;
            if ($request->has('vencimiento_soap')) $dataToUpdate['vencimiento_soap'] = $request->vencimiento_soap;
            if ($request->has('compania_seguro')) $dataToUpdate['compania_seguro'] = $request->compania_seguro;
            if ($request->has('numero_poliza')) $dataToUpdate['numero_poliza'] = $request->numero_poliza;
            if ($request->has('tipo_cobertura_adicional')) $dataToUpdate['tipo_cobertura_adicional'] = $request->tipo_cobertura_adicional;
            if ($request->has('vencimiento_poliza')) $dataToUpdate['vencimiento_poliza'] = $request->vencimiento_poliza;
            if ($request->has('numero_permiso_circulacion')) $dataToUpdate['numero_permiso_circulacion'] = $request->numero_permiso_circulacion;
            if ($request->has('observaciones')) $dataToUpdate['observaciones'] = $request->observaciones;
            if ($request->has('kilometraje_original')) $dataToUpdate['kilometraje_original'] = $request->kilometraje_original;
            if ($request->has('kilometraje_actual')) $dataToUpdate['kilometraje_actual'] = $request->kilometraje_actual;

            $bus->update($dataToUpdate);

            return response()->json([
                'success' => true,
                'message' => 'Bus actualizado exitosamente',
                'data' => $bus->fresh() // Recargar el modelo
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

            // Verificar si tiene viajes asociados
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
}