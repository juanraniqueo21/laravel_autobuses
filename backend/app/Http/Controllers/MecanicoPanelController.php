<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use App\Models\Empleado;
use App\Models\Mecanico;
use App\Models\Mantenimiento;
use Carbon\Carbon;

class MecanicoPanelController extends Controller
{
    private function getMecanicoActual()
    {
        $user = Auth::user();
        if (!$user) return null;

        // 1. Buscar empleado asociado al usuario
        $empleado = Empleado::where('user_id', $user->id)->first();
        if (!$empleado) return null;

        // 2. Buscar perfil de mecánico de ese empleado
        return Mecanico::where('empleado_id', $empleado->id)->first();
    }

    public function dashboard()
    {
        try {
            $mecanico = $this->getMecanicoActual();

            if (!$mecanico) {
                return response()->json([
                    'success' => false, 
                    'message' => 'Perfil de mecánico no encontrado.'
                ], 404);
            }

            $mecanico->load('empleado.user');
            
            // --- CORRECCIÓN AQUÍ ---
            // Usamos el ID del MECÁNICO (tabla mecanicos), no del empleado.
            $mecanicoId = $mecanico->id; 

            $inicioMes = Carbon::now()->startOfMonth();
            $finMes = Carbon::now()->endOfMonth();

            // 1. Métricas
            $pendientes = Mantenimiento::where('mecanico_id', $mecanicoId)
                ->where('estado', 'en_proceso')
                ->count();

            $completadasMes = Mantenimiento::where('mecanico_id', $mecanicoId)
                ->where('estado', 'completado')
                ->whereBetween('fecha_inicio', [$inicioMes, $finMes]) 
                ->count();
            
            $totalHistorico = Mantenimiento::where('mecanico_id', $mecanicoId)
                ->where('estado', 'completado')
                ->count();

            // 2. Próxima Tarea
            $proximaMantencion = Mantenimiento::with(['bus'])
                ->where('mecanico_id', $mecanicoId)
                ->where('estado', 'en_proceso')
                ->orderBy('fecha_inicio', 'asc')
                ->first();

            // Datos seguros para frontend
            $nombre = 'Mecánico';
            $email = '';
            if ($mecanico->empleado && $mecanico->empleado->user) {
                $nombre = $mecanico->empleado->user->nombre . ' ' . $mecanico->empleado->user->apellido;
                $email = $mecanico->empleado->user->email;
            }

            // Obtener notificaciones
            $notificationController = new \App\Http\Controllers\NotificationController();
            $notificationsResponse = $notificationController->index();
            $notificationsData = json_decode($notificationsResponse->getContent(), true);

            return response()->json([
                'success' => true,
                'data' => [
                    'mecanico' => [
                        'id' => $mecanico->id,
                        'nombre' => $nombre,
                        'email' => $email,
                        'telefono' => $mecanico->empleado->telefono_personal ?? 'No registrado',
                        'direccion' => $mecanico->empleado->direccion ?? 'No registrada',
                        'numero_certificacion' => $mecanico->numero_certificacion,
                        'especialidad' => $mecanico->especialidad,
                        'estado' => $mecanico->estado,
                        'empleado' => $mecanico->empleado,
                    ],
                    'metricas' => [
                        'pendientes' => $pendientes,
                        'completadas_mes' => $completadasMes,
                        'total_historico' => $totalHistorico
                    ],
                    'proxima_mantencion' => $proximaMantencion ? [
                        'id' => $proximaMantencion->id,
                        'tipo_mantenimiento' => $proximaMantencion->tipo_mantenimiento,
                        'fecha_programada' => $proximaMantencion->fecha_inicio,
                        'estado' => $proximaMantencion->estado,
                        'bus' => $proximaMantencion->bus,
                        'descripcion' => $proximaMantencion->descripcion
                    ] : null,
                    'notifications' => $notificationsData['data'] ?? []
                ]
            ]);

        } catch (\Exception $e) {
            \Log::error('Error Dashboard Mecánico: ' . $e->getMessage());
            return response()->json([
                'success' => false, 
                'message' => 'Error interno del servidor: ' . $e->getMessage()
            ], 500);
        }
    }

    public function misMantenciones(Request $request)
    {
        try {
            $mecanico = $this->getMecanicoActual();
            if (!$mecanico) return response()->json(['success' => false, 'message' => 'No autorizado'], 404);

            // --- CORRECCIÓN AQUÍ ---
            // Usamos el ID de la tabla mecanicos
            $mecanicoId = $mecanico->id; 

            $query = Mantenimiento::with(['bus'])
                ->where('mecanico_id', $mecanicoId);

            if ($request->has('estado') && $request->estado !== '') {
                $query->where('estado', $request->estado);
            }

            $query->orderByRaw("CASE 
                WHEN estado = 'en_proceso' THEN 1 
                WHEN estado = 'completado' THEN 2 
                ELSE 3 END");
            
            $query->orderBy('fecha_inicio', 'asc');
            
            $mantenciones = $query->get();

            // Transformar para frontend (fecha_programada alias)
            $mantencionesTransformadas = $mantenciones->map(function($m) {
                $m->fecha_programada = $m->fecha_inicio;
                return $m;
            });

            return response()->json(['success' => true, 'data' => $mantencionesTransformadas]);

        } catch (\Exception $e) {
            \Log::error('Error Mis Mantenciones: ' . $e->getMessage());
            return response()->json(['success' => false, 'message' => 'Error', 'error' => $e->getMessage()], 500);
        }
    }
}