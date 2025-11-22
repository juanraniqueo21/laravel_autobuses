<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('rutas_tarifas', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('ruta_id');
            $table->enum('tipo_pasajero', ['adulto', 'estudiante', 'nino', 'tercera_edad']);
            $table->integer('tarifa'); // En CLP, sin decimales
            $table->timestamps();

            // Relaciones
            $table->foreign('ruta_id')->references('id')->on('rutas')->onDelete('cascade');
            
            // Índices
            $table->index('ruta_id');
            $table->unique(['ruta_id', 'tipo_pasajero']); // Una tarifa por tipo
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('rutas_tarifas');
    }
};
