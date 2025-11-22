<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('rutas', function (Blueprint $table) {
            // Renombrar campos para mayor claridad
            $table->renameColumn('punto_salida', 'origen');
            $table->renameColumn('punto_destino', 'destino');
            
            // Eliminar tarifa única (ahora será tabla separada)
            if (Schema::hasColumn('rutas', 'tarifa')) {
                $table->dropColumn('tarifa');
            }
            
            // Los campos distancia_km y tiempo_estimado_minutos se calcularán automáticamente
            // pero los dejamos para cache
        });
    }

    public function down(): void
    {
        Schema::table('rutas', function (Blueprint $table) {
            $table->renameColumn('origen', 'punto_salida');
            $table->renameColumn('destino', 'punto_destino');
            $table->integer('tarifa')->nullable();
        });
    }
};