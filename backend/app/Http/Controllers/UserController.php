<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;

class UserController extends Controller
{
    // GET - Obtener todos los usuarios
    public function index()
    {
        $users = User::all();
        return response()->json($users);
    }

    // GET - Obtener un usuario específico
    public function show($id)
    {
        $user = User::find($id);
        if (!$user) {
            return response()->json(['error' => 'Usuario no encontrado'], 404);
        }
        return response()->json($user);
    }

    // POST - Crear nuevo usuario
    public function store(Request $request)
    {
        $user = User::create([
            'nombre' => $request->nombre,
            'apellido' => $request->apellido,
            'email' => $request->email,
            'password' => bcrypt($request->password),
            'rut' => $request->rut,
            'rut_verificador' => $request->rut_verificador,
            'rol_id' => $request->rol_id,
            'estado' => $request->estado ?? 'activo',
        ]);
        return response()->json($user, 201);
    }

    // PUT - Actualizar usuario
    public function update(Request $request, $id)
    {
        $user = User::find($id);
        if (!$user) {
            return response()->json(['error' => 'Usuario no encontrado'], 404);
        }

        $user->update([
            'nombre' => $request->nombre ?? $user->nombre,
            'apellido' => $request->apellido ?? $user->apellido,
            'email' => $request->email ?? $user->email,
            'rut' => $request->rut ?? $user->rut,
            'rut_verificador' => $request->rut_verificador ?? $user->rut_verificador,
            'rol_id' => $request->rol_id ?? $user->rol_id,
            'estado' => $request->estado ?? $user->estado,
        ]);
        return response()->json($user);
    }

    // DELETE - Eliminar usuario
    public function destroy($id)
    {
        $user = User::find($id);
        if (!$user) {
            return response()->json(['error' => 'Usuario no encontrado'], 404);
        }

        $user->delete();
        return response()->json(['message' => 'Usuario eliminado']);
    }
}