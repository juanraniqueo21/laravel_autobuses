<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;

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
        $validated = $request->validate([
            'nombre' => 'required|string|max:100',
            'apellido' => 'required|string|max:100',
            'email' => 'required|email|unique:users,email',
            'password' => 'required|string|min:6',
            'rut' => 'required|string|unique:users,rut',
            'rut_verificador' => 'required|string|max:1',
            'telefono' => 'required|string|regex:/^9\d{8}$/', // 9 dígitos empezando con 9
            'estado' => 'required|in:activo,inactivo,suspendido',
            'rol_id' => 'required|exists:roles,id',
        ]);

        try {
            $user = User::create([
                'nombre' => $validated['nombre'],
                'apellido' => $validated['apellido'],
                'email' => $validated['email'],
                'password' => bcrypt($validated['password']),
                'rut' => $validated['rut'],
                'rut_verificador' => $validated['rut_verificador'],
                'telefono' => $validated['telefono'],
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

        $validated = $request->validate([
            'nombre' => 'sometimes|required|string|max:100',
            'apellido' => 'sometimes|required|string|max:100',
            'email' => 'sometimes|required|email|unique:users,email,' . $id,
            'rut' => 'sometimes|required|string|unique:users,rut,' . $id,
            'rut_verificador' => 'sometimes|required|string|max:1',
            'telefono' => 'sometimes|required|string|regex:/^9\d{8}$/', // 9 dígitos empezando con 9
            'estado' => 'sometimes|required|in:activo,inactivo,suspendido',
            'rol_id' => 'sometimes|required|exists:roles,id',
            'password' => 'nullable|string|min:6', // Opcional
        ]);

        try {
            // Preparar datos para actualizar
            $dataToUpdate = [];
            
            foreach (['nombre', 'apellido', 'email', 'rut', 'rut_verificador', 'telefono', 'estado', 'rol_id'] as $field) {
                if (isset($validated[$field])) {
                    $dataToUpdate[$field] = $validated[$field];
                }
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