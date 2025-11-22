<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('rutas_paradas', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('ruta_id');
            $table->integer('orden'); // 1, 2, 3, 4...
            $table->string('ciudad', 100);
            $table->boolean('es_origen')->default(false);
            $table->boolean('es_destino')->default(false);
            $table->decimal('distancia_desde_anterior_km', 8, 2)->nullable(); // NULL para origen
            $table->integer('tiempo_desde_anterior_min')->nullable(); // NULL para origen
            $table->text('observaciones')->nullable();
            $table->timestamps();

            // Relaciones
            $table->foreign('ruta_id')->references('id')->on('rutas')->onDelete('cascade');
            
            // Índices
            $table->index(['ruta_id', 'orden']);
            $table->unique(['ruta_id', 'orden']); // No puede haber 2 paradas con mismo orden
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('rutas_paradas');
    }
};