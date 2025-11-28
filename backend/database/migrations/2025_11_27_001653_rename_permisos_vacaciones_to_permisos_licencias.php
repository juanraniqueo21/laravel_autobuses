<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // 1. Renombrar la tabla
        Schema::rename('permisos_vacaciones', 'permisos_licencias');

        // 2. Agregar nuevas columnas
        Schema::table('permisos_licencias', function (Blueprint $table) {
            // Campos para manejo de archivos adjuntos (PDF)
            $table->string('ruta_archivo', 500)->nullable()->after('motivo');
            $table->string('nombre_archivo', 255)->nullable()->after('ruta_archivo');

            // Campos adicionales de rechazo
            $table->unsignedBigInteger('rechazado_por')->nullable()->after('fecha_respuesta');
            $table->text('motivo_rechazo')->nullable()->after('rechazado_por');
        });

        // 3. Actualizar el tipo ENUM para PostgreSQL (necesitamos crear un nuevo tipo)
        // Primero, obtenemos el constraint actual
        DB::statement("ALTER TABLE permisos_licencias DROP CONSTRAINT IF EXISTS permisos_licencias_tipo_check");
        
        // Crear nuevo constraint con todos los tipos
        DB::statement("ALTER TABLE permisos_licencias ADD CONSTRAINT permisos_licencias_tipo_check CHECK (tipo IN ('permiso', 'vacaciones', 'licencia_medica', 'licencia_maternidad', 'licencia_paternidad'))");

        // 4. Agregar foreign key para rechazado_por
        Schema::table('permisos_licencias', function (Blueprint $table) {
            $table->foreign('rechazado_por')->references('id')->on('users')->onDelete('set null');
        });

        // 5. Agregar índices para mejor performance
        Schema::table('permisos_licencias', function (Blueprint $table) {
            $table->index(['fecha_inicio', 'fecha_termino']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // 1. Eliminar índices
        Schema::table('permisos_licencias', function (Blueprint $table) {
            $table->dropIndex(['fecha_inicio', 'fecha_termino']);
        });

        // 2. Eliminar foreign key
        Schema::table('permisos_licencias', function (Blueprint $table) {
            $table->dropForeign(['rechazado_por']);
        });

        // 3. Eliminar columnas nuevas
        Schema::table('permisos_licencias', function (Blueprint $table) {
            $table->dropColumn(['ruta_archivo', 'nombre_archivo', 'rechazado_por', 'motivo_rechazo']);
        });

        // 4. Revertir constraint de tipo
        DB::statement("ALTER TABLE permisos_licencias DROP CONSTRAINT IF EXISTS permisos_licencias_tipo_check");
        DB::statement("ALTER TABLE permisos_licencias ADD CONSTRAINT permisos_vacaciones_tipo_check CHECK (tipo IN ('permiso', 'vacaciones', 'licencia_medica', 'licencia_maternidad'))");

        // 5. Renombrar la tabla de vuelta
        Schema::rename('permisos_licencias', 'permisos_vacaciones');
    }
};