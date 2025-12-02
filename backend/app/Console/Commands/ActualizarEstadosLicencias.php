<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\PermisoLicencia;
use App\Models\Empleado;
use Carbon\Carbon;

class ActualizarEstadosLicencias extends Command
{
    protected $signature = 'licencias:actualizar-estados';
    protected $description = 'Actualiza el estado de empleados según sus licencias activas';

    public function __construct()
    {
        parent::__construct();
    }

    public function handle()
    {
        $hoy = Carbon::now()->format('Y-m-d');
        $empleadosActualizados = 0;
        $empleadosLiberados = 0;

        $this->info("🔍 Verificando licencias para el día: {$hoy}");

        // Obtener todos los empleados
        $empleados = Empleado::all();

        foreach ($empleados as $empleado) {
            // Verificar si tiene licencia aprobada que cubra HOY
            $licenciaActiva = PermisoLicencia::where('empleado_id', $empleado->id)
                ->where('estado', 'aprobado')
                ->where('fecha_inicio', '<=', $hoy)
                ->where('fecha_termino', '>=', $hoy)
                ->first();

            if ($licenciaActiva) {
                // Tiene licencia activa HOY
                if ($empleado->estado !== 'licencia') {
                    $empleado->estado = 'licencia';
                    $empleado->save();
                    $empleadosActualizados++;
                    $this->info(" {$empleado->user->nombre} {$empleado->user->apellido} → estado: licencia");
                }
            } else {
                // NO tiene licencia activa HOY pero está marcado como "licencia"
                if ($empleado->estado === 'licencia') {
                    $empleado->estado = 'activo';
                    $empleado->save();
                    $empleadosLiberados++;
                    $this->info(" {$empleado->user->nombre} {$empleado->user->apellido} → estado: activo");
                }
            }
        }

        // Marcar licencias completadas
        $licenciasCompletadas = PermisoLicencia::where('estado', 'aprobado')
            ->where('fecha_termino', '<', $hoy)
            ->update(['estado' => 'completado']);

        $this->info("\n Resumen:");
        $this->info("   → Empleados puestos en licencia: {$empleadosActualizados}");
        $this->info("   → Empleados liberados de licencia: {$empleadosLiberados}");
        $this->info("   → Licencias marcadas como completadas: {$licenciasCompletadas}");
        $this->info("\n Proceso completado exitosamente");

        return 0;
    }
}