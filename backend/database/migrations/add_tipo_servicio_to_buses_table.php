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
            // ============================================
            // TIPO DE SERVICIO
            // ============================================
            // Clasificación según confort del servicio
            $table->enum('tipo_servicio', ['clasico', 'semicama', 'cama', 'premium'])
                  ->default('clasico')
                  ->after('tipo_bus')
                  ->comment('Clasico=1piso básico, Semicama=reclinable, Cama=180°, Premium=lujo');

            // ============================================
            // FACTOR DE TARIFA
            // ============================================
            // Multiplicador para calcular tarifa según tipo de servicio
            // Ejemplo: tarifa_ruta * factor_tarifa = tarifa_final
            // Clásico: 1.0x, Semicama: 1.4x, Cama: 2.0x, Premium: 3.0x
            $table->decimal('factor_tarifa', 3, 1)
                  ->default(1.0)
                  ->after('tipo_servicio')
                  ->comment('Multiplicador de tarifa base (1.0 a 3.0)');

            // ============================================
            // ÍNDICES
            // ============================================
            $table->index('tipo_servicio');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('buses', function (Blueprint $table) {
            // Eliminar índice
            $table->dropIndex(['tipo_servicio']);

            // Eliminar campos
            $table->dropColumn([
                'tipo_servicio',
                'factor_tarifa',
            ]);
        });
    }
};