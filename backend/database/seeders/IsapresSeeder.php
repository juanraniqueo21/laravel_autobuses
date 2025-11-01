<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class IsapresSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Limpiar datos existentes (opcional)
        DB::table('isapres')->truncate();

        // Insertar Isapres chilenas abiertas (SIN timestamps si la tabla no los tiene)
        DB::table('isapres')->insert([
            [
                'nombre' => 'Banmédica',
                'descripcion' => 'Isapre privada abierta',
            ],
            [
                'nombre' => 'Colmena',
                'descripcion' => 'Isapre privada abierta',
            ],
            [
                'nombre' => 'Consalud',
                'descripcion' => 'Isapre privada abierta',
            ],
            [
                'nombre' => 'Cruz Blanca',
                'descripcion' => 'Isapre privada abierta',
            ],
            [
                'nombre' => 'Nueva Masvida',
                'descripcion' => 'Isapre privada abierta',
            ],
            [
                'nombre' => 'Esencial',
                'descripcion' => 'Isapre privada abierta',
            ],
            [
                'nombre' => 'Vida Tres',
                'descripcion' => 'Isapre privada abierta',
            ],
        ]);

        echo "✅ Isapres Seeder completado: 7 Isapres insertadas\n";
    }
}