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
        Schema::table('buses', function (Blueprint $table) {
            // Hacer todos los campos opcionales nullable
            $table->string('numero_serie', 50)->nullable()->change();
            $table->string('numero_motor', 50)->nullable()->change();
            $table->date('fecha_adquisicion')->nullable()->change();
            $table->date('proxima_revision_tecnica')->nullable()->change();
            $table->date('ultima_revision_tecnica')->nullable()->change();
            $table->string('documento_revision_tecnica', 255)->nullable()->change();
            $table->string('compania_seguro', 100)->nullable()->change();
            $table->string('numero_poliza', 50)->nullable()->change();
            $table->date('vencimiento_poliza')->nullable()->change();
            $table->string('numero_permiso_circulacion', 50)->nullable()->change();
            $table->text('observaciones')->nullable()->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('buses', function (Blueprint $table) {
            $table->string('numero_serie', 50)->nullable(false)->change();
            $table->string('numero_motor', 50)->nullable(false)->change();
            $table->date('fecha_adquisicion')->nullable(false)->change();
            $table->date('proxima_revision_tecnica')->nullable(false)->change();
            $table->date('ultima_revision_tecnica')->nullable(false)->change();
            $table->string('documento_revision_tecnica', 255)->nullable(false)->change();
            $table->string('compania_seguro', 100)->nullable(false)->change();
            $table->string('numero_poliza', 50)->nullable(false)->change();
            $table->date('vencimiento_poliza')->nullable(false)->change();
            $table->string('numero_permiso_circulacion', 50)->nullable(false)->change();
            $table->text('observaciones')->nullable(false)->change();
        });
    }
};