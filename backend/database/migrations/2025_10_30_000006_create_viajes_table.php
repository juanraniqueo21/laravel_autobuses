<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('viajes', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('bus_id');
            $table->unsignedBigInteger('conductor_id');
            $table->unsignedBigInteger('asistente_id')->nullable();
            $table->unsignedBigInteger('ruta_id');
            $table->dateTime('fecha_hora_salida');
            $table->dateTime('fecha_hora_llegada')->nullable();
            $table->integer('pasajeros_transportados')->nullable();
            $table->decimal('combustible_gastado', 8, 2)->nullable();
            $table->integer('kilometraje_inicial')->nullable();
            $table->integer('kilometraje_final')->nullable();
            $table->enum('estado', ['programado', 'en_curso', 'completado', 'cancelado'])->default('programado');
            $table->text('observaciones')->nullable();
            $table->text('incidentes')->nullable();
            $table->timestamps();

            // Relaciones
            $table->foreign('bus_id')->references('id')->on('buses')->onDelete('cascade');
            $table->foreign('conductor_id')->references('id')->on('conductores')->onDelete('cascade');
            $table->foreign('asistente_id')->references('id')->on('asistentes')->onDelete('set null');
            $table->foreign('ruta_id')->references('id')->on('rutas')->onDelete('cascade');

            // Índices
            $table->index('bus_id');
            $table->index('conductor_id');
            $table->index('fecha_hora_salida');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('viajes');
    }
};