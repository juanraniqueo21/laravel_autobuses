<?php

namespace App\Http\Controllers;

use App\Models\Empleado;
use Illuminate\Http\Request;

class EmpleadoController extends Controller
{
    public function index()
    {
        $empleados = Empleado::with('user','mecanico')->get();
        return response()->json($empleados);
    }

    public function show($id)
    {
        $empleado = Empleado::with('user')->find($id);
        if (!$empleado) {
            return response()->json(['error' => 'Empleado no encontrado'], 404);
        }
        return response()->json($empleado);
    }

    public function store(Request $request)
    {
        $empleado = Empleado::create([
            'user_id' => $request->user_id,
            'numero_empleado' => $request->numero_empleado,
            'fecha_contratacion' => $request->fecha_contratacion,
            'fecha_termino' => $request->fecha_termino,
            'tipo_contrato' => strtolower($request->tipo_contrato),
            'salario_base' => $request->salario_base,
            'estado' => $request->estado ?? 'activo',
            // Nuevos campos personales
            'ciudad' => $request->ciudad,
            'direccion' => $request->direccion,
            'telefono_personal' => $request->telefono_personal,
            'fecha_nacimiento' => $request->fecha_nacimiento,
            'genero' => $request->genero,
            // Contacto emergencia
            'contacto_emergencia_nombre' => $request->contacto_emergencia_nombre,
            'contacto_emergencia_telefono' => $request->contacto_emergencia_telefono,
            'contacto_emergencia_relacion' => $request->contacto_emergencia_relacion,
            // Beneficios
            'afp_id' => $request->afp_id,
            'fonasa' => $request->fonasa ?? true,
            'isapre_nombre' => $request->isapre_nombre,
            'numero_seguro_cesantia' => $request->numero_seguro_cesantia,
            // Datos bancarios
            'banco' => $request->banco,
            'tipo_cuenta' => $request->tipo_cuenta,
            'numero_cuenta' => $request->numero_cuenta,
        ]);
        return response()->json($empleado, 201);
    }

    public function update(Request $request, $id)
    {
        $empleado = Empleado::find($id);
        if (!$empleado) {
            return response()->json(['error' => 'Empleado no encontrado'], 404);
        }

        $empleado->update([
            'user_id' => $request->user_id ?? $empleado->user_id,
            'numero_empleado' => $request->numero_empleado ?? $empleado->numero_empleado,
            'fecha_contratacion' => $request->fecha_contratacion ?? $empleado->fecha_contratacion,
            'fecha_termino' => $request->fecha_termino ?? $empleado->fecha_termino,
            'tipo_contrato' => $request->tipo_contrato ? strtolower($request->tipo_contrato) : $empleado->tipo_contrato,
            'salario_base' => $request->salario_base ?? $empleado->salario_base,
            'estado' => $request->estado ?? $empleado->estado,
            // Nuevos campos personales
            'ciudad' => $request->ciudad ?? $empleado->ciudad,
            'direccion' => $request->direccion ?? $empleado->direccion,
            'telefono_personal' => $request->telefono_personal ?? $empleado->telefono_personal,
            'fecha_nacimiento' => $request->fecha_nacimiento ?? $empleado->fecha_nacimiento,
            'genero' => $request->genero ?? $empleado->genero,
            // Contacto emergencia
            'contacto_emergencia_nombre' => $request->contacto_emergencia_nombre ?? $empleado->contacto_emergencia_nombre,
            'contacto_emergencia_telefono' => $request->contacto_emergencia_telefono ?? $empleado->contacto_emergencia_telefono,
            'contacto_emergencia_relacion' => $request->contacto_emergencia_relacion ?? $empleado->contacto_emergencia_relacion,
            // Beneficios
            'afp_id' => $request->afp_id ?? $empleado->afp_id,
            'fonasa' => $request->fonasa ?? $empleado->fonasa,
            'isapre_nombre' => $request->isapre_nombre ?? $empleado->isapre_nombre,
            'numero_seguro_cesantia' => $request->numero_seguro_cesantia ?? $empleado->numero_seguro_cesantia,
            // Datos bancarios
            'banco' => $request->banco ?? $empleado->banco,
            'tipo_cuenta' => $request->tipo_cuenta ?? $empleado->tipo_cuenta,
            'numero_cuenta' => $request->numero_cuenta ?? $empleado->numero_cuenta,
        ]);

        return response()->json($empleado);
    }

    public function destroy($id)
    {
        $empleado = Empleado::find($id);
        if (!$empleado) {
            return response()->json(['error' => 'Empleado no encontrado'], 404);
        }

        $empleado->delete();
        return response()->json(['message' => 'Empleado eliminado']);
    }
}