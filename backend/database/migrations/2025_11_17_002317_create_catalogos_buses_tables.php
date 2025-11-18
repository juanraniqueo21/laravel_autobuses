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
        // ============================================
        // TABLA: MARCAS_BUS
        // Catálogo de marcas para buses, motores, chasis y carrocerías
        // ============================================
        Schema::create('marcas_bus', function (Blueprint $table) {
            $table->id();
            $table->string('nombre', 50); // Mercedes-Benz, Volvo, Scania, etc.
            $table->enum('tipo', ['bus', 'motor', 'chasis', 'carroceria']);
            $table->boolean('activo')->default(true);
            $table->timestamps();
            
            // Índices
            $table->unique(['nombre', 'tipo']); // Una marca puede estar en varios tipos
            $table->index('tipo');
            $table->index('activo');
        });

        // ============================================
        // TABLA: MODELOS_BUS
        // Catálogo de modelos específicos por marca
        // ============================================
        Schema::create('modelos_bus', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('marca_id');
            $table->string('nombre', 50); // O-500, B12M, ISB 6.7, etc.
            $table->enum('tipo', ['bus', 'motor', 'chasis', 'carroceria']);
            $table->boolean('activo')->default(true);
            $table->timestamps();
            
            // Relaciones
            $table->foreign('marca_id')->references('id')->on('marcas_bus')->onDelete('cascade');
            
            // Índices
            $table->unique(['marca_id', 'nombre']); // Modelo único por marca
            $table->index('marca_id');
            $table->index('tipo');
            $table->index('activo');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('modelos_bus');
        Schema::dropIfExists('marcas_bus');
    }
};