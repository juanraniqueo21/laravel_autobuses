<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class AfpSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Primero, limpiar datos existentes (opcional)
        DB::table('afp_list')->truncate();

        // Insertar AFPs chilenas actualizadas (SIN timestamps)
        DB::table('afp_list')->insert([
            [
                'nombre' => 'AFP Capital',
                'porcentaje_descuento' => 1.44,
            ],
            [
                'nombre' => 'AFP Cuprum',
                'porcentaje_descuento' => 1.44,
            ],
            [
                'nombre' => 'AFP Habitat',
                'porcentaje_descuento' => 1.27,
            ],
            [
                'nombre' => 'AFP Modelo',
                'porcentaje_descuento' => 0.58,
            ],
            [
                'nombre' => 'AFP Planvital',
                'porcentaje_descuento' => 1.16,
            ],
            [
                'nombre' => 'AFP Provida',
                'porcentaje_descuento' => 1.45,
            ],
            [
                'nombre' => 'AFP Uno',
                'porcentaje_descuento' => 0.46,
            ],
        ]);

        echo "✅ AFP Seeder completado: 7 AFPs insertadas\n";
    }
}