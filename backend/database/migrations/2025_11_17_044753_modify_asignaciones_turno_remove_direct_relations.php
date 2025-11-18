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
        Schema::table('asignaciones_turno', function (Blueprint $table) {
            // ============================================
            // ELIMINAR COLUMNAS ANTIGUAS
            // ============================================
            $table->dropForeign(['conductor_id']);
            $table->dropForeign(['asistente_id']);
            $table->dropForeign(['ruta_id']);
            
            $table->dropColumn([
                'conductor_id',  // Ahora será tabla intermedia
                'asistente_id',  // Ahora será tabla intermedia
                'ruta_id',       // Los viajes pueden ser de varias rutas
            ]);
            
            // ============================================
            // AGREGAR NUEVA COLUMNA
            // ============================================
            $table->enum('tipo_turno', ['mañana', 'tarde', 'noche', 'completo'])
                  ->default('completo')
                  ->after('hora_termino');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('asignaciones_turno', function (Blueprint $table) {
            // Restaurar columnas eliminadas
            $table->unsignedBigInteger('conductor_id')->after('bus_id');
            $table->unsignedBigInteger('asistente_id')->nullable()->after('conductor_id');
            $table->unsignedBigInteger('ruta_id')->after('asistente_id');
            
            // Restaurar foreign keys
            $table->foreign('conductor_id')->references('id')->on('conductores');
            $table->foreign('asistente_id')->references('id')->on('asistentes');
            $table->foreign('ruta_id')->references('id')->on('rutas');
            
            // Eliminar tipo_turno
            $table->dropColumn('tipo_turno');
        });
    }
};