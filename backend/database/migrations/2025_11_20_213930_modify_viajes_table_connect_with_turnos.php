<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('viajes', function (Blueprint $table) {
            // Eliminar foreign keys primero
            $table->dropForeign(['bus_id']);
            $table->dropForeign(['conductor_id']);
            $table->dropForeign(['asistente_id']);
            
            // Eliminar índices
            $table->dropIndex(['bus_id']);
            $table->dropIndex(['conductor_id']);
            
            // Eliminar columnas obsoletas
            $table->dropColumn([
                'bus_id',
                'conductor_id',
                'asistente_id',
                'pasajeros_transportados',
                'combustible_gastado',
                'kilometraje_inicial',
                'kilometraje_final'
            ]);
            
            // Agregar nuevas columnas
            $table->unsignedBigInteger('asignacion_turno_id')->after('id');
            $table->string('codigo_viaje', 50)->unique()->after('asignacion_turno_id');
            $table->string('nombre_viaje', 255)->after('codigo_viaje');
            
            // Agregar foreign key
            $table->foreign('asignacion_turno_id')
                  ->references('id')
                  ->on('asignaciones_turno')
                  ->onDelete('cascade');
            
            // Agregar índice
            $table->index('asignacion_turno_id');
        });
    }

    public function down(): void
    {
        Schema::table('viajes', function (Blueprint $table) {
            // Eliminar foreign key nueva
            $table->dropForeign(['asignacion_turno_id']);
            $table->dropIndex(['asignacion_turno_id']);
            
            // Eliminar columnas nuevas
            $table->dropColumn([
                'asignacion_turno_id',
                'codigo_viaje',
                'nombre_viaje'
            ]);
            
            // Restaurar columnas antiguas
            $table->unsignedBigInteger('bus_id')->after('id');
            $table->unsignedBigInteger('conductor_id')->after('bus_id');
            $table->unsignedBigInteger('asistente_id')->nullable()->after('conductor_id');
            $table->integer('pasajeros_transportados')->nullable();
            $table->decimal('combustible_gastado', 8, 2)->nullable();
            $table->integer('kilometraje_inicial')->nullable();
            $table->integer('kilometraje_final')->nullable();
            
            // Restaurar foreign keys
            $table->foreign('bus_id')->references('id')->on('buses')->onDelete('cascade');
            $table->foreign('conductor_id')->references('id')->on('conductores')->onDelete('cascade');
            $table->foreign('asistente_id')->references('id')->on('asistentes')->onDelete('set null');
            
            // Restaurar índices
            $table->index('bus_id');
            $table->index('conductor_id');
        });
    }
};