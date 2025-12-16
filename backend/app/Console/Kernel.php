<?php

namespace App\Console;

use Illuminate\Console\Scheduling\Schedule;
use Illuminate\Foundation\Console\Kernel as ConsoleKernel;

class Kernel extends ConsoleKernel
{
    /**
     * Define the application's command schedule.
     */
    protected function schedule(Schedule $schedule): void
    {
        // Actualizar estados de licencias todos los días a las 00:01
        $schedule->command('licencias:actualizar-estados')
                 ->dailyAt('00:01')
                 ->appendOutputTo(storage_path('logs/licencias.log'));

        // Verificar vencimientos de SOAP y permisos de circulación todos los días a las 00:05
        $schedule->command('buses:verificar-vencimientos')
                 ->dailyAt('00:05')
                 ->appendOutputTo(storage_path('logs/buses_vencimientos.log'));

        // Verificar vencimientos de licencias de conductores todos los días a las 00:10
        $schedule->command('conductores:verificar-vencimientos')
                 ->dailyAt('00:10')
                 ->appendOutputTo(storage_path('logs/conductores_vencimientos.log'));
    }

    /**
     * Register the commands for the application.
     */
    protected function commands(): void
    {
        $this->load(__DIR__.'/Commands');

        require base_path('routes/console.php');
    }
}