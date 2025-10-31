<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class AuthController extends Controller
{
    public function login(Request $request)
    {
        $validated = $request->validate([
            'email' => 'required|email',
            'password' => 'required|string',
        ]);

        $user = User::where('email', $validated['email'])->first();

        if (!$user || !Hash::check($validated['password'], $user->password)) {
            return response()->json(['error' => 'Credenciales inválidas'], 401);
        }

        // Crear sesión
        auth()->login($user);

        return response()->json([
            'message' => 'Login exitoso',
            'user' => $user,
        ]);
    }

    public function logout(Request $request)
    {
        auth()->logout();
        return response()->json(['message' => 'Logout exitoso']);
    }

    public function me()
    {
        if (!auth()->check()) {
            return response()->json(['error' => 'No autenticado'], 401);
        }
        return response()->json(auth()->user());
    }
}
