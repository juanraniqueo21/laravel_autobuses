<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('mecanicos', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('empleado_id')->unique();
            $table->string('numero_certificacion', 50)->nullable();
            $table->string('especialidad', 100)->nullable();
            $table->date('fecha_certificacion')->nullable();
            $table->enum('estado', ['activo', 'inactivo', 'suspendido'])->default('activo');
            $table->text('observaciones')->nullable();
            $table->timestamps();

            // Relaciones
            $table->foreign('empleado_id')->references('id')->on('empleados')->onDelete('cascade');

            // Índices
            $table->index('empleado_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('mecanicos');
    }
};