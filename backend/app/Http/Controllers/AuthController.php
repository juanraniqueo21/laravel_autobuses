<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use App\Models\User;
use Tymon\JWTAuth\Facades\JWTAuth;
use Tymon\JWTAuth\Exceptions\JWTException;

class AuthController extends Controller
{
    /**
     * Constructor - Aplicar middleware excepto en login
     */
    public function __construct()
    {
        $this->middleware('auth:api', ['except' => ['login']]);
    }

    /**
     * LOGIN - Autenticar usuario y devolver token JWT
     * 
     * POST /api/login
     * Body: { "email": "user@example.com", "password": "password123" }
     */
    public function login(Request $request)
    {
        // Validar datos de entrada
        $validator = Validator::make($request->all(), [
            'email' => 'required|email',
            'password' => 'required|string|min:6',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Datos inválidos',
                'errors' => $validator->errors()
            ], 422);
        }

        // Obtener credenciales
        $credentials = $request->only('email', 'password');

        try {
            // Intentar autenticar
            if (!$token = JWTAuth::attempt($credentials)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Credenciales incorrectas'
                ], 401);
            }

            // Obtener usuario autenticado
            $user = Auth::user();

            // Verificar que el usuario esté activo
            if ($user->estado !== 'activo') {
                return response()->json([
                    'success' => false,
                    'message' => 'Usuario inactivo o suspendido'
                ], 403);
            }

            // Cargar relación con rol
            $user->load('rol');

            // Retornar token y datos del usuario
            return response()->json([
                'success' => true,
                'message' => 'Login exitoso',
                'token' => $token,
                'token_type' => 'bearer',
                'expires_in' => config('jwt.ttl') * 60, // en segundos
                'user' => [
                    'id' => $user->id,
                    'nombre' => $user->nombre,
                    'apellido' => $user->apellido,
                    'email' => $user->email,
                    'rut' => $user->rut,
                    'telefono' => $user->telefono,
                    'estado' => $user->estado,
                    'rol' => [
                        'id' => $user->rol->id,
                        'nombre' => $user->rol->nombre,
                        'descripcion' => $user->rol->descripcion,
                    ]
                ]
            ], 200);

        } catch (JWTException $e) {
            return response()->json([
                'success' => false,
                'message' => 'No se pudo crear el token'
            ], 500);
        }
    }

    /**
     * LOGOUT - Invalidar token JWT
     * 
     * POST /api/logout
     * Headers: { "Authorization": "Bearer {token}" }
     */
    public function logout()
    {
        try {
            JWTAuth::invalidate(JWTAuth::getToken());
            
            return response()->json([
                'success' => true,
                'message' => 'Sesión cerrada exitosamente'
            ], 200);
            
        } catch (JWTException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al cerrar sesión'
            ], 500);
        }
    }

    /**
     * ME - Obtener datos del usuario autenticado
     * 
     * GET /api/me
     * Headers: { "Authorization": "Bearer {token}" }
     */
    public function me()
    {
        try {
            $user = Auth::user();
            
            if (!$user) {
                return response()->json([
                    'success' => false,
                    'message' => 'Usuario no autenticado'
                ], 401);
            }

            // Cargar relación con rol
            $user->load('rol');

            return response()->json([
                'success' => true,
                'user' => [
                    'id' => $user->id,
                    'nombre' => $user->nombre,
                    'apellido' => $user->apellido,
                    'email' => $user->email,
                    'rut' => $user->rut,
                    'telefono' => $user->telefono,
                    'estado' => $user->estado,
                    'rol' => [
                        'id' => $user->rol->id,
                        'nombre' => $user->rol->nombre,
                        'descripcion' => $user->rol->descripcion,
                    ]
                ]
            ], 200);
            
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al obtener datos del usuario'
            ], 500);
        }
    }

    /**
     * REFRESH - Renovar token JWT
     * 
     * POST /api/refresh
     * Headers: { "Authorization": "Bearer {token}" }
     */
    public function refresh()
    {
        try {
            $newToken = JWTAuth::refresh(JWTAuth::getToken());
            
            return response()->json([
                'success' => true,
                'token' => $newToken,
                'token_type' => 'bearer',
                'expires_in' => config('jwt.ttl') * 60
            ], 200);
            
        } catch (JWTException $e) {
            return response()->json([
                'success' => false,
                'message' => 'No se pudo refrescar el token'
            ], 500);
        }
    }
}