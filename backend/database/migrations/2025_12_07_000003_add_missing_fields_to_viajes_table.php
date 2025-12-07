<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('viajes', function (Blueprint $table) {
            // Campos de pasajeros y recaudación
            $table->integer('pasajeros_transportados')->nullable()->after('estado');
            $table->integer('tarifa_aplicada')->nullable()->after('pasajeros_transportados');
            $table->integer('dinero_esperado')->nullable()->after('tarifa_aplicada');
            $table->integer('dinero_recaudado')->nullable()->after('dinero_esperado');
            $table->decimal('diferencia_porcentaje', 5, 2)->nullable()->after('dinero_recaudado');
            $table->boolean('requiere_revision')->default(false)->after('diferencia_porcentaje');
            
            // Campos de costos
            $table->integer('costo_combustible')->nullable()->after('requiere_revision');
            $table->integer('costo_peajes')->nullable()->after('costo_combustible');
            $table->integer('costo_mantencion')->nullable()->after('costo_peajes');
            $table->integer('costo_total')->nullable()->after('costo_mantencion');
        });
    }

    public function down(): void
    {
        Schema::table('viajes', function (Blueprint $table) {
            $table->dropColumn([
                'pasajeros_transportados',
                'tarifa_aplicada',
                'dinero_esperado',
                'dinero_recaudado',
                'diferencia_porcentaje',
                'requiere_revision',
                'costo_combustible',
                'costo_peajes',
                'costo_mantencion',
                'costo_total',
            ]);
        });
    }
};