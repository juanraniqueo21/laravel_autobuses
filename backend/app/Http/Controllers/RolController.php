<?php

namespace App\Http\Controllers;

use App\Models\Rol;
use Illuminate\Http\Request;

class RolController extends Controller
{
    // GET - Obtener todos los roles
    public function index()
    {
        $roles = Rol::all();
        return Rol::orderBy('id', 'asc')->get();
    }

    // GET - Obtener un rol específico
    public function show($id)
    {
        $rol = Rol::find($id);
        if (!$rol) {
            return response()->json(['error' => 'Rol no encontrado'], 404);
        }
        return response()->json($rol);
    }

    // POST - Crear nuevo rol
    public function store(Request $request)
    {
        $validated = $request->validate([
            'nombre' => 'required|string|max:50|unique:roles',
            'descripcion' => 'nullable|string|max:255',
        ]);

        $rol = Rol::create($validated);
        return response()->json($rol, 201);
    }

    // PUT - Actualizar rol
    public function update(Request $request, $id)
    {
        $rol = Rol::find($id);
        if (!$rol) {
            return response()->json(['error' => 'Rol no encontrado'], 404);
        }

        $validated = $request->validate([
            'nombre' => 'required|string|max:50|unique:roles,nombre,' . $id,
            'descripcion' => 'nullable|string|max:255',
        ]);

        $rol->update($validated);
        return response()->json($rol);
    }

    // DELETE - Eliminar rol
    public function destroy($id)
    {
        $rol = Rol::find($id);
        if (!$rol) {
            return response()->json(['error' => 'Rol no encontrado'], 404);
        }

        $rol->delete();
        return response()->json(['message' => 'Rol eliminado']);
    }
}
