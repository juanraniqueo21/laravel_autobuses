<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\Rol;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // 1. Crear roles primero (si no existen)
        $roles = [
            ['nombre' => 'Admin', 'descripcion' => 'Administrador del sistema'],
            ['nombre' => 'Gerente', 'descripcion' => 'Gestión y dirección de la operación'],
            ['nombre' => 'Conductor', 'descripcion' => 'Rol para conductores'],
            ['nombre' => 'Mecanico', 'descripcion' => 'Mantenimiento y soporte de flota'],
            ['nombre' => 'Asistente', 'descripcion' => 'Asistente de abordo o apoyo'],
            ['nombre' => 'RRHH', 'descripcion' => 'Recursos humanos'],
        ];

        $rolesCreados = [];
        foreach ($roles as $rolData) {
            $rolesCreados[$rolData['nombre']] = Rol::firstOrCreate(
                ['nombre' => $rolData['nombre']],
                ['descripcion' => $rolData['descripcion']]
            );
        }

        $adminRol = $rolesCreados['Admin'];

        // 2. Crear usuario de prueba
        User::firstOrCreate(
            ['email' => 'test@example.com'],
            [
                'nombre' => 'Test',
                'apellido' => 'User',
                'password' => bcrypt('123456'),
                'rut' => '12.345.678',
                'rut_verificador' => '9',
                'estado' => 'activo',
                'rol_id' => $adminRol->id,
            ]
        );

        // 3. Ejecutar otros seeders
        // Nota: el orden garantiza que los catálogos y buses existan antes de poblar viajes completos.
        $this->call([
            AfpSeeder::class,
            IsapresSeeder::class,
            PersonalConductorSeeder::class,
            CatalogosBusesSeeder::class,
            BusSeeder::class,
            DatosCompletosSeeder::class,
        ]);
    }
}