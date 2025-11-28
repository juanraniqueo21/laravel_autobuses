<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('rutas_paradas', function (Blueprint $table) {
            // Agregamos las columnas de tipo TIME (hora) y permitimos que sean nulas
            $table->time('hora_llegada')->nullable()->after('tiempo_desde_anterior_min');
            $table->time('hora_salida')->nullable()->after('hora_llegada');
        });
    }

    public function down(): void
    {
        Schema::table('rutas_paradas', function (Blueprint $table) {
            $table->dropColumn(['hora_llegada', 'hora_salida']);
        });
    }
};