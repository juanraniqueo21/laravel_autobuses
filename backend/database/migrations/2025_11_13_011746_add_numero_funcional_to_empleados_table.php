<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('empleados', function (Blueprint $table) {
            // Agregar campo numero_funcional después de numero_empleado
            $table->string('numero_funcional', 15)->nullable()->after('numero_empleado');
            
            // Índice para búsquedas rápidas
            $table->index('numero_funcional');
        });
    }

    public function down(): void
    {
        Schema::table('empleados', function (Blueprint $table) {
            $table->dropIndex(['numero_funcional']);
            $table->dropColumn('numero_funcional');
        });
    }
};
