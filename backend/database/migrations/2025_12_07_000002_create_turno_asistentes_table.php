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
        Schema::create('turno_asistentes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('asignacion_turno_id')
                ->constrained('asignaciones_turno')
                ->onDelete('cascade');
            $table->foreignId('asistente_id')
                ->constrained('asistentes')
                ->onDelete('cascade');
            $table->enum('posicion', ['piso_superior', 'piso_inferior', 'general'])
                ->default('general');
            $table->timestamps();

            // Restricción única para evitar duplicados
            $table->unique(['asignacion_turno_id', 'asistente_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('turno_asistentes');
    }
};