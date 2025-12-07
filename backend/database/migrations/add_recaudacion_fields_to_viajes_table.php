<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('viajes', function (Blueprint $table) {
            if (!Schema::hasColumn('viajes', 'tarifa_aplicada')) {
                $table->integer('tarifa_aplicada')
                    ->nullable()
                    ->after('estado')
                    ->comment('Tarifa final por pasajero en CLP (incluye factor de tipo de servicio)');
            }

            if (!Schema::hasColumn('viajes', 'pasajeros')) {
                $table->integer('pasajeros')
                    ->nullable()
                    ->after('tarifa_aplicada')
                    ->comment('Total de pasajeros transportados en este viaje');
            }

            if (!Schema::hasColumn('viajes', 'dinero_recaudado')) {
                $table->integer('dinero_recaudado')
                    ->nullable()
                    ->after('pasajeros')
                    ->comment('Dinero real entregado por el conductor (CLP)');
            }

            if (!Schema::hasColumn('viajes', 'dinero_esperado')) {
                $table->integer('dinero_esperado')
                    ->nullable()
                    ->after('dinero_recaudado')
                    ->comment('Dinero teórico según pasajeros * tarifa promedio (CLP)');
            }

            if (!Schema::hasColumn('viajes', 'diferencia_porcentaje')) {
                $table->decimal('diferencia_porcentaje', 5, 2)
                    ->nullable()
                    ->after('dinero_esperado')
                    ->comment('% de diferencia entre esperado y recaudado');
            }

            if (!Schema::hasColumn('viajes', 'requiere_revision')) {
                $table->boolean('requiere_revision')
                    ->default(false)
                    ->after('diferencia_porcentaje')
                    ->comment('TRUE si la diferencia es > 10%');
            }

            if (!Schema::hasColumn('viajes', 'combustible_litros')) {
                $table->decimal('combustible_litros', 8, 2)
                    ->nullable()
                    ->after('requiere_revision')
                    ->comment('Litros de combustible consumidos en el viaje');
            }

            if (!Schema::hasColumn('viajes', 'kilometros_recorridos')) {
                $table->integer('kilometros_recorridos')
                    ->nullable()
                    ->after('combustible_litros')
                    ->comment('Kilómetros realmente recorridos según odómetro');
            }

            if (!Schema::hasColumn('viajes', 'costo_combustible')) {
                $table->integer('costo_combustible')
                    ->nullable()
                    ->after('kilometros_recorridos')
                    ->comment('Costo total del combustible (CLP)');
            }

            if (!Schema::hasColumn('viajes', 'costo_por_km')) {
                $table->integer('costo_por_km')
                    ->nullable()
                    ->after('costo_combustible')
                    ->comment('Costo de combustible por kilómetro (CLP/km) - Calculado');
            }
        });
    }

    public function down(): void
    {
        Schema::table('viajes', function (Blueprint $table) {
            $columns = [
                'costo_por_km',
                'costo_combustible',
                'kilometros_recorridos',
                'combustible_litros',
                'requiere_revision',
                'diferencia_porcentaje',
                'dinero_esperado',
                'dinero_recaudado',
                'pasajeros',
                'tarifa_aplicada',
            ];

            foreach ($columns as $column) {
                if (Schema::hasColumn('viajes', $column)) {
                    $table->dropColumn($column);
                }
            }
        });
    }
};