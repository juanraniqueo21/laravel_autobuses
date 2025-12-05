<?php
// backend/database/migrations/2025_12_04_000003_add_campos_operativos_to_viajes.php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('viajes', function (Blueprint $table) {
            $table->decimal('combustible_litros', 8, 2)->nullable()->after('requiere_revision')
                ->comment('Litros de combustible consumidos en el viaje');
            
            $table->integer('kilometros_recorridos')->nullable()->after('combustible_litros')
                ->comment('Kilómetros realmente recorridos según odómetro');
            
            $table->integer('costo_combustible')->nullable()->after('kilometros_recorridos')
                ->comment('Costo total del combustible (CLP)');
            
            $table->integer('costo_por_km')->nullable()->after('costo_combustible')
                ->comment('Costo de combustible por kilómetro (CLP/km) - Calculado');
        });
    }

    public function down(): void
    {
        Schema::table('viajes', function (Blueprint $table) {
            $table->dropColumn([
                'combustible_litros',
                'kilometros_recorridos',
                'costo_combustible',
                'costo_por_km'
            ]);
        });
    }
};
