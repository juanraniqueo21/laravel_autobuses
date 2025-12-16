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
        // Cambiar el constraint del enum para incluir 'inactivo'
        DB::statement("ALTER TABLE buses DROP CONSTRAINT IF EXISTS buses_estado_check");
        DB::statement("ALTER TABLE buses ADD CONSTRAINT buses_estado_check CHECK (estado IN ('operativo', 'mantenimiento', 'desmantelado', 'inactivo'))");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Primero cambiar cualquier bus inactivo a operativo para evitar errores
        DB::table('buses')->where('estado', 'inactivo')->update(['estado' => 'operativo']);

        // Restaurar el constraint original
        DB::statement("ALTER TABLE buses DROP CONSTRAINT IF EXISTS buses_estado_check");
        DB::statement("ALTER TABLE buses ADD CONSTRAINT buses_estado_check CHECK (estado IN ('operativo', 'mantenimiento', 'desmantelado'))");
    }
};
