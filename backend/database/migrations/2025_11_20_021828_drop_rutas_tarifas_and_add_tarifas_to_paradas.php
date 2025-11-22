<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Eliminar tabla de tarifas por ruta
        Schema::dropIfExists('rutas_tarifas');

        // Agregar tarifas a cada parada
        Schema::table('rutas_paradas', function (Blueprint $table) {
            $table->integer('tarifa_adulto')->default(0)->after('tiempo_desde_anterior_min');
            $table->integer('tarifa_estudiante')->default(0)->after('tarifa_adulto');
            $table->integer('tarifa_tercera_edad')->default(0)->after('tarifa_estudiante');
        });
    }

    public function down(): void
    {
        // Recrear tabla rutas_tarifas
        Schema::create('rutas_tarifas', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('ruta_id');
            $table->enum('tipo_pasajero', ['adulto', 'estudiante', 'nino', 'tercera_edad']);
            $table->integer('tarifa');
            $table->timestamps();
            
            $table->foreign('ruta_id')->references('id')->on('rutas')->onDelete('cascade');
            $table->unique(['ruta_id', 'tipo_pasajero']);
        });

        // Eliminar columnas de tarifas de paradas
        Schema::table('rutas_paradas', function (Blueprint $table) {
            $table->dropColumn(['tarifa_adulto', 'tarifa_estudiante', 'tarifa_tercera_edad']);
        });
    }
};
