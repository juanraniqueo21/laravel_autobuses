<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CheckRole
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next, ...$roles): Response
    {
        if (!auth()->check()) {
            return response()->json([
                'success' => false,
                'message' => 'No autenticado'
            ], 401);
        }

        $user = auth()->user();

        // Si no tiene rol asignado, denegar acceso
        if (!$user->rol) {
            return response()->json([
                'success' => false,
                'message' => 'Usuario sin rol asignado'
            ], 403);
        }

        $userRole = strtolower($user->rol->nombre);

        // Normalizar roles permitidos a minúsculas
        $allowedRoles = array_map('strtolower', $roles);

        // Admin tiene acceso a todo
        if ($userRole === 'admin') {
            return $next($request);
        }

        // Verificar si el rol del usuario está en la lista de roles permitidos
        if (in_array($userRole, $allowedRoles)) {
            return $next($request);
        }

        return response()->json([
            'success' => false,
            'message' => 'No tienes permisos para acceder a este recurso',
            'required_roles' => $roles,
            'your_role' => $user->rol->nombre
        ], 403);
    }
}
