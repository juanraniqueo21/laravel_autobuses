<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use App\Rules\RutValidation;
use App\Helpers\RutHelper;

class UserController extends Controller
{
    // ============================================
    // GET - Obtener todos los usuarios
    // ============================================
    public function index()
    {
        $users = User::with('rol')
            ->orderBy('id', 'asc')
            ->get();
        
        return response()->json($users);
    }

    // ============================================
    // GET - Obtener un usuario específico
    // ============================================
    public function show($id)
    {
        $user = User::with('rol')->find($id);
        
        if (!$user) {
            return response()->json(['error' => 'Usuario no encontrado'], 404);
        }
        
        return response()->json($user);
    }

    // ============================================
    // POST - Crear nuevo usuario
    // ============================================
    public function store(Request $request)
    {
        // Validación con RUT completo
        $validated = $request->validate([
            'nombre' => 'required|string|max:100',
            'apellido' => 'required|string|max:100',
            'email' => 'required|email|unique:users,email',
            'password' => 'required|string|min:6',
            'rut_completo' => ['required', 'string', new RutValidation()],
            'estado' => 'required|in:activo,inactivo,suspendido',
            'rol_id' => 'required|exists:roles,id',
        ], [
            'rut_completo.required' => 'El RUT es obligatorio',
        ]);

        try {
            // Separar RUT en número y dígito verificador
            $rutData = RutHelper::separar($validated['rut_completo']);
            
            // Verificar que el RUT no exista ya en la BD
            $rutExistente = User::where('rut', $rutData['numero'])
                ->where('rut_verificador', $rutData['dv'])
                ->first();
            
            if ($rutExistente) {
                return response()->json([
                    'error' => 'El RUT ya está registrado en el sistema'
                ], 422);
            }

            // Crear usuario
            $user = User::create([
                'nombre' => $validated['nombre'],
                'apellido' => $validated['apellido'],
                'email' => $validated['email'],
                'password' => bcrypt($validated['password']),
                'rut' => $rutData['numero'],
                'rut_verificador' => strtoupper($rutData['dv']),
                'estado' => $validated['estado'],
                'rol_id' => $validated['rol_id'],
            ]);

            // Cargar relación rol
            $user->load('rol');

            return response()->json([
                'message' => 'Usuario creado exitosamente',
                'data' => $user
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Error al crear usuario: ' . $e->getMessage()
            ], 500);
        }
    }

    // ============================================
    // PUT - Actualizar usuario
    // ============================================
    public function update(Request $request, $id)
    {
        $user = User::find($id);
        
        if (!$user) {
            return response()->json(['error' => 'Usuario no encontrado'], 404);
        }

        // Validación
        $rules = [
            'nombre' => 'sometimes|required|string|max:100',
            'apellido' => 'sometimes|required|string|max:100',
            'email' => 'sometimes|required|email|unique:users,email,' . $id,
            'estado' => 'sometimes|required|in:activo,inactivo,suspendido',
            'rol_id' => 'sometimes|required|exists:roles,id',
            'password' => 'nullable|string|min:6',
        ];

        // Si se está actualizando el RUT, validarlo
        if ($request->has('rut_completo')) {
            $rules['rut_completo'] = ['required', 'string', new RutValidation()];
        }

        $validated = $request->validate($rules);

        try {
            // Preparar datos para actualizar
            $dataToUpdate = [];
            
            foreach (['nombre', 'apellido', 'email', 'estado', 'rol_id'] as $field) {
                if (isset($validated[$field])) {
                    $dataToUpdate[$field] = $validated[$field];
                }
            }

            // Si se actualiza el RUT
            if (isset($validated['rut_completo'])) {
                $rutData = RutHelper::separar($validated['rut_completo']);
                
                // Verificar que el nuevo RUT no esté en uso por otro usuario
                $rutExistente = User::where('rut', $rutData['numero'])
                    ->where('rut_verificador', $rutData['dv'])
                    ->where('id', '!=', $id)
                    ->first();
                
                if ($rutExistente) {
                    return response()->json([
                        'error' => 'El RUT ya está registrado en el sistema'
                    ], 422);
                }
                
                $dataToUpdate['rut'] = $rutData['numero'];
                $dataToUpdate['rut_verificador'] = strtoupper($rutData['dv']);
            }

            // Si se incluye password, encriptar
            if (isset($validated['password'])) {
                $dataToUpdate['password'] = bcrypt($validated['password']);
            }

            $user->update($dataToUpdate);
            $user->load('rol');

            return response()->json([
                'message' => 'Usuario actualizado exitosamente',
                'data' => $user
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Error al actualizar usuario: ' . $e->getMessage()
            ], 500);
        }
    }

    // ============================================
    // DELETE - Eliminar usuario
    // ============================================
    public function destroy($id)
    {
        $user = User::find($id);
        
        if (!$user) {
            return response()->json(['error' => 'Usuario no encontrado'], 404);
        }

        try {
            $user->delete();
            return response()->json(['message' => 'Usuario eliminado exitosamente']);
        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Error al eliminar usuario: ' . $e->getMessage()
            ], 500);
        }
    }

    // ============================================
    // GET - Usuario actual (para autenticación)
    // ============================================
    public function currentUser()
    {
        $user = auth()->user();
        
        if (!$user) {
            return response()->json(['error' => 'No autenticado'], 401);
        }

        $user->load('rol');
        return response()->json($user);
    }
}