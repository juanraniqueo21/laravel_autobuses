<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Bus;
use Carbon\Carbon;

class VerificarVencimientosBuses extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'buses:verificar-vencimientos';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Verifica vencimientos de SOAP, permisos de circulación y revisión técnica y marca buses como en mantenimiento si están vencidos';

    /**
     * Execute the console command.
     *
     * @return int
     */
    public function handle()
    {
        $this->info('🔍 Iniciando verificación de vencimientos de buses...');
        $this->newLine();

        $busesActualizados = 0;
        $busesConSoapVencido = 0;
        $busesConPermisoVencido = 0;
        $busesConRevisionVencida = 0;

        // ============================================
        // 1. VERIFICAR BUSES CON SOAP VENCIDO
        // ============================================
        $this->info('🚌 Verificando SOAP vencidos...');

        $busesConSoapVencidoQuery = Bus::where('estado', 'operativo')
            ->conSeguroVencido()
            ->get();

        foreach ($busesConSoapVencidoQuery as $bus) {
            $estadoAnterior = $bus->estado;
            $bus->update(['estado' => 'mantenimiento']);

            $this->line("   ✓ Bus {$bus->patente}: SOAP vencido el {$bus->vencimiento_soap->format('d/m/Y')} - Estado: {$estadoAnterior} → mantenimiento");
            $busesActualizados++;
            $busesConSoapVencido++;
        }

        // ============================================
        // 2. VERIFICAR BUSES CON PERMISO DE CIRCULACIÓN VENCIDO
        // ============================================
        $this->newLine();
        $this->info('📋 Verificando permisos de circulación vencidos...');

        $busesConPermisoVencidoQuery = Bus::where('estado', 'operativo')
            ->conPermisoCirculacionVencido()
            ->get();

        foreach ($busesConPermisoVencidoQuery as $bus) {
            $estadoAnterior = $bus->estado;
            $bus->update(['estado' => 'mantenimiento']);

            $this->line("   ✓ Bus {$bus->patente}: Permiso de circulación vencido el {$bus->vencimiento_permiso_circulacion->format('d/m/Y')} - Estado: {$estadoAnterior} → mantenimiento");
            $busesActualizados++;
            $busesConPermisoVencido++;
        }

        // ============================================
        // 3. VERIFICAR BUSES CON REVISIÓN TÉCNICA VENCIDA
        // ============================================
        $this->newLine();
        $this->info('🔧 Verificando revisiones técnicas vencidas...');

        $busesConRevisionVencidaQuery = Bus::where('estado', 'operativo')
            ->conRevisionVencida()
            ->get();

        foreach ($busesConRevisionVencidaQuery as $bus) {
            $estadoAnterior = $bus->estado;
            $bus->update(['estado' => 'mantenimiento']);

            $this->line("   ✓ Bus {$bus->patente}: Revisión técnica vencida el {$bus->proxima_revision_tecnica->format('d/m/Y')} - Estado: {$estadoAnterior} → mantenimiento");
            $busesActualizados++;
            $busesConRevisionVencida++;
        }

        // ============================================
        // ALERTAS DE VENCIMIENTOS PRÓXIMOS (30 días)
        // ============================================
        $this->newLine();
        $this->info('⚠️  Alertas de vencimientos próximos (30 días)...');

        // SOAP próximo a vencer
        $busesConSoapProximo = Bus::where('estado', 'operativo')
            ->whereDate('vencimiento_soap', '>=', Carbon::now())
            ->whereDate('vencimiento_soap', '<=', Carbon::now()->addDays(30))
            ->get();

        if ($busesConSoapProximo->count() > 0) {
            $this->warn("   ⚠️  {$busesConSoapProximo->count()} buses con SOAP próximo a vencer:");
            foreach ($busesConSoapProximo as $bus) {
                $diasRestantes = Carbon::now()->diffInDays($bus->vencimiento_soap);
                $this->line("      • {$bus->patente}: vence en {$diasRestantes} días ({$bus->vencimiento_soap->format('d/m/Y')})");
            }
        }

        $this->newLine();

        // Permiso de circulación próximo a vencer
        $busesConPermisoProximo = Bus::where('estado', 'operativo')
            ->whereDate('vencimiento_permiso_circulacion', '>=', Carbon::now())
            ->whereDate('vencimiento_permiso_circulacion', '<=', Carbon::now()->addDays(30))
            ->get();

        if ($busesConPermisoProximo->count() > 0) {
            $this->warn("   ⚠️  {$busesConPermisoProximo->count()} buses con permiso de circulación próximo a vencer:");
            foreach ($busesConPermisoProximo as $bus) {
                $diasRestantes = Carbon::now()->diffInDays($bus->vencimiento_permiso_circulacion);
                $this->line("      • {$bus->patente}: vence en {$diasRestantes} días ({$bus->vencimiento_permiso_circulacion->format('d/m/Y')})");
            }
        }

        $this->newLine();

        // Revisión técnica próxima a vencer
        $busesConRevisionProxima = Bus::where('estado', 'operativo')
            ->whereDate('proxima_revision_tecnica', '>=', Carbon::now())
            ->whereDate('proxima_revision_tecnica', '<=', Carbon::now()->addDays(30))
            ->get();

        if ($busesConRevisionProxima->count() > 0) {
            $this->warn("   ⚠️  {$busesConRevisionProxima->count()} buses con revisión técnica próxima a vencer:");
            foreach ($busesConRevisionProxima as $bus) {
                $diasRestantes = Carbon::now()->diffInDays($bus->proxima_revision_tecnica);
                $this->line("      • {$bus->patente}: vence en {$diasRestantes} días ({$bus->proxima_revision_tecnica->format('d/m/Y')})");
            }
        }

        // ============================================
        // RESUMEN
        // ============================================
        $this->newLine();
        $this->info('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        $this->info('📊 RESUMEN DE VERIFICACIÓN');
        $this->info('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        $this->line("   Buses con SOAP vencido:              {$busesConSoapVencido}");
        $this->line("   Buses con permiso vencido:           {$busesConPermisoVencido}");
        $this->line("   Buses con revisión técnica vencida:  {$busesConRevisionVencida}");
        $this->line('   ─────────────────────────────────────────');
        $this->info("   TOTAL buses marcados en mantenimiento: {$busesActualizados}");
        $this->newLine();
        $this->line("   Buses con SOAP próximo a vencer:     {$busesConSoapProximo->count()}");
        $this->line("   Buses con permiso próximo a vencer:  {$busesConPermisoProximo->count()}");
        $this->line("   Buses con revisión próxima a vencer: {$busesConRevisionProxima->count()}");
        $this->info('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        $this->newLine();

        if ($busesActualizados > 0) {
            $this->warn("⚠️  {$busesActualizados} buses fueron marcados como en mantenimiento por vencimientos.");
        } else {
            $this->info('✅ Todos los buses operativos tienen documentación vigente.');
        }

        return 0;
    }
}
