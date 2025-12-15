<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use App\Models\User;
use App\Models\Empleado;

class ProfileController extends Controller
{
    /**
     * Cambiar contraseña del usuario autenticado
     * PUT /api/me/password
     */
    public function updatePassword(Request $request)
    {
        try {
            $validator = Validator::make($request->all(), [
                'current_password' => 'required|string|min:6',
                'new_password' => 'required|string|min:6|confirmed',
                'new_password_confirmation' => 'required|string|min:6'
            ], [
                'current_password.required' => 'La contraseña actual es requerida',
                'new_password.required' => 'La nueva contraseña es requerida',
                'new_password.min' => 'La nueva contraseña debe tener al menos 6 caracteres',
                'new_password.confirmed' => 'Las contraseñas no coinciden',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Errores de validación',
                    'errors' => $validator->errors()
                ], 422);
            }

            $user = auth()->user();

            // Verificar que la contraseña actual sea correcta
            if (!Hash::check($request->current_password, $user->password)) {
                return response()->json([
                    'success' => false,
                    'message' => 'La contraseña actual es incorrecta'
                ], 401);
            }

            // Verificar que la nueva contraseña no sea igual a la actual
            if (Hash::check($request->new_password, $user->password)) {
                return response()->json([
                    'success' => false,
                    'message' => 'La nueva contraseña debe ser diferente a la actual'
                ], 422);
            }

            // Actualizar contraseña
            $user->password = Hash::make($request->new_password);
            $user->save();

            return response()->json([
                'success' => true,
                'message' => 'Contraseña actualizada exitosamente'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al actualizar contraseña',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Actualizar perfil del usuario autenticado
     * PUT /api/me/profile
     */
    public function updateProfile(Request $request)
    {
        try {
            $user = auth()->user();

            $validator = Validator::make($request->all(), [
                'nombre' => 'sometimes|required|string|max:100',
                'apellido' => 'sometimes|required|string|max:100',
                'email' => 'sometimes|required|email|unique:users,email,' . $user->id,
                'telefono' => 'nullable|string|regex:/^9\d{8}$/',
            ], [
                'nombre.required' => 'El nombre es requerido',
                'apellido.required' => 'El apellido es requerido',
                'email.required' => 'El email es requerido',
                'email.email' => 'El email debe ser válido',
                'email.unique' => 'Este email ya está en uso',
                'telefono.regex' => 'El teléfono debe tener formato chileno (9 dígitos comenzando con 9)',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Errores de validación',
                    'errors' => $validator->errors()
                ], 422);
            }

            // Actualizar datos básicos del usuario
            if ($request->has('nombre')) {
                $user->nombre = $request->nombre;
            }
            if ($request->has('apellido')) {
                $user->apellido = $request->apellido;
            }
            if ($request->has('email')) {
                $user->email = $request->email;
            }
            if ($request->has('telefono')) {
                $user->telefono = $request->telefono;
            }

            $user->save();

            // Si el usuario tiene un empleado asociado, actualizar datos adicionales
            $empleado = Empleado::where('user_id', $user->id)->first();
            if ($empleado && $request->has('empleado')) {
                $empleadoData = $request->empleado;

                if (isset($empleadoData['ciudad'])) {
                    $empleado->ciudad = $empleadoData['ciudad'];
                }
                if (isset($empleadoData['direccion'])) {
                    $empleado->direccion = $empleadoData['direccion'];
                }
                if (isset($empleadoData['telefono_personal'])) {
                    $empleado->telefono_personal = $empleadoData['telefono_personal'];
                }
                if (isset($empleadoData['contacto_emergencia_nombre'])) {
                    $empleado->contacto_emergencia_nombre = $empleadoData['contacto_emergencia_nombre'];
                }
                if (isset($empleadoData['contacto_emergencia_telefono'])) {
                    $empleado->contacto_emergencia_telefono = $empleadoData['contacto_emergencia_telefono'];
                }
                if (isset($empleadoData['contacto_emergencia_relacion'])) {
                    $empleado->contacto_emergencia_relacion = $empleadoData['contacto_emergencia_relacion'];
                }

                $empleado->save();
            }

            // Recargar el usuario con sus relaciones
            $user->load('rol');
            if ($empleado) {
                $user->empleado = $empleado;
            }

            return response()->json([
                'success' => true,
                'message' => 'Perfil actualizado exitosamente',
                'data' => $user
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al actualizar perfil',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Obtener perfil completo del usuario autenticado
     * GET /api/me/profile
     */
    public function getProfile()
    {
        try {
            $user = auth()->user();
            $user->load('rol');

            // Cargar datos del empleado si existe
            $empleado = Empleado::where('user_id', $user->id)
                ->with(['afp', 'isapre', 'conductor', 'asistente', 'mecanico'])
                ->first();

            $response = [
                'success' => true,
                'data' => [
                    'user' => $user,
                    'empleado' => $empleado
                ]
            ];

            return response()->json($response);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al obtener perfil',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
