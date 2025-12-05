<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('viajes', function (Blueprint $table) {
            // Solo agregar los campos que NO existen

            // Tarifa aplicada por pasajero (incluye factor del tipo de bus)
            $table->integer('tarifa_aplicada')
                  ->nullable()
                  ->after('estado')
                  ->comment('Tarifa final por pasajero en CLP (incluye factor de tipo de servicio)');

            // Kilometraje inicial y final (para calcular km recorridos)
            $table->integer('kilometraje_inicial')
                  ->nullable()
                  ->after('costo_combustible')
                  ->comment('Km al iniciar el viaje');

            $table->integer('kilometraje_final')
                  ->nullable()
                  ->after('kilometraje_inicial')
                  ->comment('Km al finalizar el viaje');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('viajes', function (Blueprint $table) {
            $table->dropColumn([
                'tarifa_aplicada',
                'kilometraje_inicial',
                'kilometraje_final',
            ]);
        });
    }
};
