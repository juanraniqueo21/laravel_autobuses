<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('empleados', function (Blueprint $table) {
            // Agregar motivo de término
            $table->enum('motivo_termino', ['renuncia', 'despido', 'termino_contrato', 'jubilacion', 'otro'])
                ->nullable()
                ->after('fecha_termino');
            
            // Agregar observaciones del término
            $table->text('observaciones_termino')
                ->nullable()
                ->after('motivo_termino');
        });
    }

    public function down(): void
    {
        Schema::table('empleados', function (Blueprint $table) {
            $table->dropColumn(['motivo_termino', 'observaciones_termino']);
        });
    }
};
