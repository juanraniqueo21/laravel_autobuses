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
        Schema::create('turno_conductores', function (Blueprint $table) {
            $table->id();
            $table->foreignId('asignacion_turno_id')
                ->constrained('asignaciones_turno')
                ->onDelete('cascade');
            $table->foreignId('conductor_id')
                ->constrained('conductores')
                ->onDelete('cascade');
            $table->enum('rol', ['principal', 'apoyo'])->default('principal');
            $table->timestamps();

            // Restricción única para evitar duplicados
            $table->unique(['asignacion_turno_id', 'conductor_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('turno_conductores');
    }
};