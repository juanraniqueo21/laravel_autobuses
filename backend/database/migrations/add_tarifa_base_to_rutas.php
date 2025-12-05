<?php
// backend/database/migrations/2025_12_04_000002_add_tarifa_base_to_rutas.php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('rutas', function (Blueprint $table) {
            $table->integer('tarifa_base_adulto')->default(3500)->after('estado')
                ->comment('Tarifa estándar adulto para toda la ruta (CLP)');
            
            $table->integer('tarifa_base_estudiante')->default(2500)->after('tarifa_base_adulto')
                ->comment('Tarifa estándar estudiante (CLP)');
            
            $table->integer('tarifa_base_tercera_edad')->default(2000)->after('tarifa_base_estudiante')
                ->comment('Tarifa estándar tercera edad (CLP)');
        });
    }

    public function down(): void
    {
        Schema::table('rutas', function (Blueprint $table) {
            $table->dropColumn([
                'tarifa_base_adulto',
                'tarifa_base_estudiante',
                'tarifa_base_tercera_edad'
            ]);
        });
    }
};
