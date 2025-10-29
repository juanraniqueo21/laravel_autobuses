<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('buses', function (Blueprint $table) {
            $table->id();
            $table->string('patente', 20)->unique();
            $table->string('marca', 50);
            $table->string('modelo', 50);
            $table->integer('anio');
            $table->integer('capacidad');
            $table->enum('estado', ['Operativo', 'Mantenimiento', 'Desmantelado'])->default('Operativo');
            $table->date('proximaRevision')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('buses');
    }
};