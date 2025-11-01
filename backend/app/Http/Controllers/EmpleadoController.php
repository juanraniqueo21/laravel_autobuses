<?php

namespace App\Http\Controllers;

use App\Models\Empleado;
use App\Models\Afp;
use App\Models\Isapre;
use Illuminate\Http\Request;

class EmpleadoController extends Controller
{
    // ============================================
    // GET - Obtener todos los empleados
    // ============================================
    public function index()
    {
        $empleados = Empleado::with('user', 'afp', 'isapre', 'conductor', 'mecanico', 'asistente')
            ->orderBy('id', 'asc')
            ->get();
        
        return response()->json($empleados);
    }

    // ============================================
    // GET - Obtener un empleado específico
    // ============================================
    public function show($id)
    {
        $empleado = Empleado::with('user', 'afp', 'isapre', 'conductor', 'mecanico', 'asistente')->find($id);
        
        if (!$empleado) {
            return response()->json(['error' => 'Empleado no encontrado'], 404);
        }
        
        return response()->json($empleado);
    }

    // ============================================
    // POST - Crear nuevo empleado
    // ============================================
    public function store(Request $request)
    {
        $validated = $request->validate([
            // Datos laborales
            'user_id' => 'required|exists:users,id|unique:empleados,user_id',
            'numero_empleado' => 'required|string|unique:empleados,numero_empleado',
            'fecha_contratacion' => 'required|date|before_or_equal:today',
            'fecha_termino' => 'nullable|date|after:fecha_contratacion',
            'tipo_contrato' => 'required|in:indefinido,plazo_fijo,practicante',
            'salario_base' => 'required|integer|min:0',
            'estado' => 'required|in:activo,licencia,suspendido,terminado',

            // Datos personales
            'ciudad' => 'nullable|string|max:100',
            'direccion' => 'nullable|string|max:255',
            'telefono_personal' => 'nullable|string|regex:/^9\d{8}$/',
            'fecha_nacimiento' => 'nullable|date|before:today',
            'genero' => 'nullable|in:masculino,femenino,otro',

            // Contacto emergencia
            'contacto_emergencia_nombre' => 'nullable|string|max:100',
            'contacto_emergencia_telefono' => 'nullable|string|regex:/^9\d{8}$/',
            'contacto_emergencia_relacion' => 'nullable|string|max:50',

            // Beneficios y salud
            'afp_id' => 'nullable|exists:afp_list,id',
            'tipo_fonasa' => 'nullable|in:A,B,C,D',
            'isapre_id' => 'nullable|exists:isapres,id',
            'numero_seguro_cesantia' => 'nullable|string|max:50',

            // Datos bancarios
            'banco' => 'nullable|string|max:100',
            'tipo_cuenta' => 'nullable|in:corriente,ahorro',
            'numero_cuenta' => 'nullable|string|unique:empleados,numero_cuenta|max:50',
        ]);

        try {
            $empleado = Empleado::create([
                'user_id' => $validated['user_id'],
                'numero_empleado' => $validated['numero_empleado'],
                'fecha_contratacion' => $validated['fecha_contratacion'],
                'fecha_termino' => $validated['fecha_termino'] ?? null,
                'tipo_contrato' => strtolower($validated['tipo_contrato']),
                'salario_base' => $validated['salario_base'],
                'estado' => $validated['estado'],

                'ciudad' => $validated['ciudad'] ?? null,
                'direccion' => $validated['direccion'] ?? null,
                'telefono_personal' => $validated['telefono_personal'] ?? null,
                'fecha_nacimiento' => $validated['fecha_nacimiento'] ?? null,
                'genero' => $validated['genero'] ?? null,

                'contacto_emergencia_nombre' => $validated['contacto_emergencia_nombre'] ?? null,
                'contacto_emergencia_telefono' => $validated['contacto_emergencia_telefono'] ?? null,
                'contacto_emergencia_relacion' => $validated['contacto_emergencia_relacion'] ?? null,

                'afp_id' => $validated['afp_id'] ?? null,
                'tipo_fonasa' => $validated['tipo_fonasa'] ?? 'B',
                'isapre_id' => $validated['isapre_id'] ?? null,
                'numero_seguro_cesantia' => $validated['numero_seguro_cesantia'] ?? null,

                'banco' => $validated['banco'] ?? null,
                'tipo_cuenta' => $validated['tipo_cuenta'] ?? null,
                'numero_cuenta' => $validated['numero_cuenta'] ?? null,
            ]);

            $empleado->load('user', 'afp', 'isapre');

            return response()->json([
                'message' => 'Empleado creado exitosamente',
                'data' => $empleado
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Error al crear empleado: ' . $e->getMessage()
            ], 500);
        }
    }

    // ============================================
    // PUT - Actualizar empleado
    // ============================================
    public function update(Request $request, $id)
    {
        $empleado = Empleado::find($id);
        
        if (!$empleado) {
            return response()->json(['error' => 'Empleado no encontrado'], 404);
        }

        $validated = $request->validate([
            // Datos laborales
            'numero_empleado' => 'sometimes|required|string|unique:empleados,numero_empleado,' . $id,
            'fecha_contratacion' => 'sometimes|required|date|before_or_equal:today',
            'fecha_termino' => 'nullable|date|after:fecha_contratacion',
            'tipo_contrato' => 'sometimes|required|in:indefinido,plazo_fijo,practicante',
            'salario_base' => 'sometimes|required|integer|min:0',
            'estado' => 'sometimes|required|in:activo,licencia,suspendido,terminado',

            // Datos personales
            'ciudad' => 'nullable|string|max:100',
            'direccion' => 'nullable|string|max:255',
            'telefono_personal' => 'nullable|string|regex:/^9\d{8}$/',
            'fecha_nacimiento' => 'nullable|date|before:today',
            'genero' => 'nullable|in:masculino,femenino,otro',

            // Contacto emergencia
            'contacto_emergencia_nombre' => 'nullable|string|max:100',
            'contacto_emergencia_telefono' => 'nullable|string|regex:/^9\d{8}$/',
            'contacto_emergencia_relacion' => 'nullable|string|max:50',

            // Beneficios y salud
            'afp_id' => 'nullable|exists:afp_list,id',
            'tipo_fonasa' => 'nullable|in:A,B,C,D',
            'isapre_id' => 'nullable|exists:isapres,id',
            'numero_seguro_cesantia' => 'nullable|string|max:50',

            // Datos bancarios
            'banco' => 'nullable|string|max:100',
            'tipo_cuenta' => 'nullable|in:corriente,ahorro',
            'numero_cuenta' => 'nullable|string|unique:empleados,numero_cuenta,' . $id . '|max:50',
        ]);

        try {
            $empleado->update($validated);
            $empleado->load('user', 'afp', 'isapre');

            return response()->json([
                'message' => 'Empleado actualizado exitosamente',
                'data' => $empleado
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Error al actualizar empleado: ' . $e->getMessage()
            ], 500);
        }
    }

    // ============================================
    // DELETE - Eliminar empleado
    // ============================================
    public function destroy($id)
    {
        $empleado = Empleado::find($id);
        
        if (!$empleado) {
            return response()->json(['error' => 'Empleado no encontrado'], 404);
        }

        try {
            $empleado->delete();
            return response()->json(['message' => 'Empleado eliminado exitosamente']);
        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Error al eliminar empleado: ' . $e->getMessage()
            ], 500);
        }
    }

    // ============================================
    // MÉTODOS ADICIONALES ÚTILES
    // ============================================

    /**
     * GET - Obtener AFPs para select
     */
    public function getAfps()
    {
        $afps = Afp::all();
        return response()->json($afps);
    }

    /**
     * GET - Obtener Isapres para select
     */
    public function getIsapres()
    {
        $isapres = Isapre::all();
        return response()->json($isapres);
    }

    /**
     * GET - Obtener empleados por estado
     */
    public function getByEstado($estado)
    {
        $empleados = Empleado::with('user', 'afp', 'isapre')
            ->byEstado($estado)
            ->get();
        
        return response()->json($empleados);
    }

    /**
     * GET - Obtener empleados activos
     */
    public function getActivos()
    {
        $empleados = Empleado::with('user', 'afp', 'isapre')
            ->activos()
            ->get();
        
        return response()->json($empleados);
    }
}