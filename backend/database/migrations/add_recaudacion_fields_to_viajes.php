// backend/database/migrations/2025_12_04_000001_add_recaudacion_fields_to_viajes.php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('viajes', function (Blueprint $table) {
            $table->integer('pasajeros')->nullable()->after('estado')
                ->comment('Total de pasajeros transportados en este viaje');
            
            $table->integer('dinero_recaudado')->nullable()->after('pasajeros')
                ->comment('Dinero real entregado por el conductor (CLP)');
            
            $table->integer('dinero_esperado')->nullable()->after('dinero_recaudado')
                ->comment('Dinero teórico según pasajeros * tarifa promedio (CLP)');
            
            $table->decimal('diferencia_porcentaje', 5, 2)->nullable()->after('dinero_esperado')
                ->comment('% de diferencia entre esperado y recaudado');
            
            $table->boolean('requiere_revision')->default(false)->after('diferencia_porcentaje')
                ->comment('TRUE si la diferencia es > 10%');
        });
    }

    public function down(): void
    {
        Schema::table('viajes', function (Blueprint $table) {
            $table->dropColumn([
                'pasajeros',
                'dinero_recaudado',
                'dinero_esperado',
                'diferencia_porcentaje',
                'requiere_revision'
            ]);
        });
    }
};
