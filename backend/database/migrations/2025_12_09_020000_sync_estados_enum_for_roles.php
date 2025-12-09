<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up(): void
    {
        $driver = DB::connection()->getDriverName();

        // ============================================
        // CONDUCTORES
        // ============================================
        // Mapear valores antiguos: baja_medica → licencia, inactivo → terminado
        DB::table('conductores')->where('estado', 'baja_medica')->update(['estado' => 'activo']);
        DB::table('conductores')->where('estado', 'inactivo')->update(['estado' => 'activo']);

        if ($driver === 'pgsql') {
            // PostgreSQL: Eliminar constraint CHECK y recrearla
            DB::statement("ALTER TABLE conductores DROP CONSTRAINT IF EXISTS conductores_estado_check");
            DB::statement("ALTER TABLE conductores ADD CONSTRAINT conductores_estado_check CHECK (estado::text = ANY (ARRAY['activo'::character varying, 'licencia'::character varying, 'suspendido'::character varying, 'terminado'::character varying]::text[]))");
        } else {
            // MySQL
            Schema::table('conductores', function (Blueprint $table) {
                $table->enum('estado', ['activo', 'licencia', 'suspendido', 'terminado'])->default('activo')->change();
            });
        }

        // ============================================
        // ASISTENTES
        // ============================================
        DB::table('asistentes')->where('estado', 'inactivo')->update(['estado' => 'activo']);

        if ($driver === 'pgsql') {
            DB::statement("ALTER TABLE asistentes DROP CONSTRAINT IF EXISTS asistentes_estado_check");
            DB::statement("ALTER TABLE asistentes ADD CONSTRAINT asistentes_estado_check CHECK (estado::text = ANY (ARRAY['activo'::character varying, 'licencia'::character varying, 'suspendido'::character varying, 'terminado'::character varying]::text[]))");
        } else {
            Schema::table('asistentes', function (Blueprint $table) {
                $table->enum('estado', ['activo', 'licencia', 'suspendido', 'terminado'])->default('activo')->change();
            });
        }

        // ============================================
        // MECÁNICOS
        // ============================================
        DB::table('mecanicos')->where('estado', 'inactivo')->update(['estado' => 'activo']);

        if ($driver === 'pgsql') {
            DB::statement("ALTER TABLE mecanicos DROP CONSTRAINT IF EXISTS mecanicos_estado_check");
            DB::statement("ALTER TABLE mecanicos ADD CONSTRAINT mecanicos_estado_check CHECK (estado::text = ANY (ARRAY['activo'::character varying, 'licencia'::character varying, 'suspendido'::character varying, 'terminado'::character varying]::text[]))");
        } else {
            Schema::table('mecanicos', function (Blueprint $table) {
                $table->enum('estado', ['activo', 'licencia', 'suspendido', 'terminado'])->default('activo')->change();
            });
        }
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down(): void
    {
        $driver = DB::connection()->getDriverName();

        // ============================================
        // CONDUCTORES - Revertir
        // ============================================
        DB::table('conductores')->where('estado', 'licencia')->update(['estado' => 'activo']);
        DB::table('conductores')->where('estado', 'terminado')->update(['estado' => 'activo']);

        if ($driver === 'pgsql') {
            DB::statement("ALTER TABLE conductores DROP CONSTRAINT IF EXISTS conductores_estado_check");
            DB::statement("ALTER TABLE conductores ADD CONSTRAINT conductores_estado_check CHECK (estado::text = ANY (ARRAY['activo'::character varying, 'baja_medica'::character varying, 'suspendido'::character varying, 'inactivo'::character varying]::text[]))");
        } else {
            Schema::table('conductores', function (Blueprint $table) {
                $table->enum('estado', ['activo', 'baja_medica', 'suspendido', 'inactivo'])->default('activo')->change();
            });
        }

        // ============================================
        // ASISTENTES - Revertir
        // ============================================
        DB::table('asistentes')->where('estado', 'licencia')->update(['estado' => 'activo']);
        DB::table('asistentes')->where('estado', 'terminado')->update(['estado' => 'activo']);

        if ($driver === 'pgsql') {
            DB::statement("ALTER TABLE asistentes DROP CONSTRAINT IF EXISTS asistentes_estado_check");
            DB::statement("ALTER TABLE asistentes ADD CONSTRAINT asistentes_estado_check CHECK (estado::text = ANY (ARRAY['activo'::character varying, 'inactivo'::character varying, 'suspendido'::character varying]::text[]))");
        } else {
            Schema::table('asistentes', function (Blueprint $table) {
                $table->enum('estado', ['activo', 'inactivo', 'suspendido'])->default('activo')->change();
            });
        }

        // ============================================
        // MECÁNICOS - Revertir
        // ============================================
        DB::table('mecanicos')->where('estado', 'licencia')->update(['estado' => 'activo']);
        DB::table('mecanicos')->where('estado', 'terminado')->update(['estado' => 'activo']);

        if ($driver === 'pgsql') {
            DB::statement("ALTER TABLE mecanicos DROP CONSTRAINT IF EXISTS mecanicos_estado_check");
            DB::statement("ALTER TABLE mecanicos ADD CONSTRAINT mecanicos_estado_check CHECK (estado::text = ANY (ARRAY['activo'::character varying, 'inactivo'::character varying, 'suspendido'::character varying]::text[]))");
        } else {
            Schema::table('mecanicos', function (Blueprint $table) {
                $table->enum('estado', ['activo', 'inactivo', 'suspendido'])->default('activo')->change();
            });
        }
    }
};