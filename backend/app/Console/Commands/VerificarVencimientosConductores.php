<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Conductor;
use Carbon\Carbon;

class VerificarVencimientosConductores extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'conductores:verificar-vencimientos';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Verifica vencimientos de licencias de conducir y marca conductores como inactivos si están vencidos';

    /**
     * Execute the console command.
     *
     * @return int
     */
    public function handle()
    {
        $this->info('🔍 Iniciando verificación de vencimientos de licencias de conductores...');
        $this->newLine();

        $conductoresActualizados = 0;
        $conductoresConLicenciaVencida = 0;

        // ============================================
        // 1. VERIFICAR CONDUCTORES CON LICENCIA VENCIDA
        // ============================================
        $this->info('👨‍✈️ Verificando licencias de conducir vencidas...');

        $conductoresConLicenciaVencidaQuery = Conductor::with('empleado.user')
            ->whereIn('estado', ['activo', 'baja_medica', 'suspendido'])
            ->conLicenciaVencida()
            ->get();

        foreach ($conductoresConLicenciaVencidaQuery as $conductor) {
            $estadoAnterior = $conductor->estado;
            $conductor->update(['estado' => 'inactivo']);

            $nombre = $conductor->empleado->user->nombre ?? 'N/A';
            $apellido = $conductor->empleado->user->apellido ?? '';

            $this->line("   ✓ Conductor {$nombre} {$apellido} (Lic: {$conductor->numero_licencia}): Licencia vencida el {$conductor->fecha_vencimiento_licencia->format('d/m/Y')} - Estado: {$estadoAnterior} → inactivo");
            $conductoresActualizados++;
            $conductoresConLicenciaVencida++;
        }

        // ============================================
        // ALERTAS DE VENCIMIENTOS PRÓXIMOS (30 días)
        // ============================================
        $this->newLine();
        $this->info('⚠️  Alertas de vencimientos próximos (30 días)...');

        // Licencias próximas a vencer
        $conductoresConLicenciaProxima = Conductor::with('empleado.user')
            ->whereIn('estado', ['activo', 'baja_medica', 'suspendido'])
            ->whereDate('fecha_vencimiento_licencia', '>=', Carbon::now())
            ->whereDate('fecha_vencimiento_licencia', '<=', Carbon::now()->addDays(30))
            ->get();

        if ($conductoresConLicenciaProxima->count() > 0) {
            $this->warn("   ⚠️  {$conductoresConLicenciaProxima->count()} conductores con licencia próxima a vencer:");
            foreach ($conductoresConLicenciaProxima as $conductor) {
                $diasRestantes = Carbon::now()->diffInDays($conductor->fecha_vencimiento_licencia);
                $nombre = $conductor->empleado->user->nombre ?? 'N/A';
                $apellido = $conductor->empleado->user->apellido ?? '';

                $this->line("      • {$nombre} {$apellido} (Lic: {$conductor->numero_licencia}): vence en {$diasRestantes} días ({$conductor->fecha_vencimiento_licencia->format('d/m/Y')})");
            }
        }

        // ============================================
        // RESUMEN
        // ============================================
        $this->newLine();
        $this->info('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        $this->info('📊 RESUMEN DE VERIFICACIÓN');
        $this->info('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        $this->line("   Conductores con licencia vencida:     {$conductoresConLicenciaVencida}");
        $this->line('   ─────────────────────────────────────────');
        $this->info("   TOTAL conductores marcados inactivos:  {$conductoresActualizados}");
        $this->newLine();
        $this->line("   Conductores con licencia próxima:     {$conductoresConLicenciaProxima->count()}");
        $this->info('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        $this->newLine();

        if ($conductoresActualizados > 0) {
            $this->warn("⚠️  {$conductoresActualizados} conductores fueron marcados como inactivos por licencias vencidas.");
        } else {
            $this->info('✅ Todos los conductores activos tienen licencias vigentes.');
        }

        return 0;
    }
}
