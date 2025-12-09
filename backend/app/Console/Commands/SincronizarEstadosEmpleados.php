<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Empleado;
use App\Models\Conductor;
use App\Models\Asistente;
use App\Models\Mecanico;

class SincronizarEstadosEmpleados extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'empleados:sincronizar-estados';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Sincroniza los estados de conductores, asistentes y mecánicos con sus empleados base';

    /**
     * Execute the console command.
     *
     * @return int
     */
    public function handle()
    {
        $this->info('🔄 Iniciando sincronización de estados...');
        $this->newLine();

        $conductoresActualizados = 0;
        $asistentesActualizados = 0;
        $mecanicosActualizados = 0;

        // ============================================
        // 1. SINCRONIZAR CONDUCTORES
        // ============================================
        $this->info('🚗 Sincronizando conductores...');

        $conductores = Conductor::with('empleado')->get();

        foreach ($conductores as $conductor) {
            if ($conductor->empleado && $conductor->estado !== $conductor->empleado->estado) {
                $estadoAnterior = $conductor->estado;
                $conductor->update(['estado' => $conductor->empleado->estado]);

                $this->line("   ✓ Conductor ID {$conductor->id}: {$estadoAnterior} → {$conductor->empleado->estado}");
                $conductoresActualizados++;
            }
        }

        // ============================================
        // 2. SINCRONIZAR ASISTENTES
        // ============================================
        $this->newLine();
        $this->info('👥 Sincronizando asistentes...');

        $asistentes = Asistente::with('empleado')->get();

        foreach ($asistentes as $asistente) {
            if ($asistente->empleado && $asistente->estado !== $asistente->empleado->estado) {
                $estadoAnterior = $asistente->estado;
                $asistente->update(['estado' => $asistente->empleado->estado]);

                $this->line("   ✓ Asistente ID {$asistente->id}: {$estadoAnterior} → {$asistente->empleado->estado}");
                $asistentesActualizados++;
            }
        }

        // ============================================
        // 3. SINCRONIZAR MECÁNICOS
        // ============================================
        $this->newLine();
        $this->info('🔧 Sincronizando mecánicos...');

        $mecanicos = Mecanico::with('empleado')->get();

        foreach ($mecanicos as $mecanico) {
            if ($mecanico->empleado && $mecanico->estado !== $mecanico->empleado->estado) {
                $estadoAnterior = $mecanico->estado;
                $mecanico->update(['estado' => $mecanico->empleado->estado]);

                $this->line("   ✓ Mecánico ID {$mecanico->id}: {$estadoAnterior} → {$mecanico->empleado->estado}");
                $mecanicosActualizados++;
            }
        }

        // ============================================
        // RESUMEN
        // ============================================
        $this->newLine();
        $this->info('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        $this->info('📊 RESUMEN DE SINCRONIZACIÓN');
        $this->info('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        $this->line("   Conductores actualizados:  {$conductoresActualizados}");
        $this->line("   Asistentes actualizados:   {$asistentesActualizados}");
        $this->line("   Mecánicos actualizados:    {$mecanicosActualizados}");
        $this->line('   ─────────────────────────────────────────');
        $totalActualizados = $conductoresActualizados + $asistentesActualizados + $mecanicosActualizados;
        $this->info("   TOTAL:                     {$totalActualizados}");
        $this->info('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        $this->newLine();

        if ($totalActualizados > 0) {
            $this->info('✅ Sincronización completada exitosamente.');
        } else {
            $this->info('✅ Todos los estados ya estaban sincronizados.');
        }

        return 0;
    }
}