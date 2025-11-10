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
        $adminRol = Rol::firstOrCreate(
            ['nombre' => 'Admin'],
            ['descripcion' => 'Administrador del sistema']
        );

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
        $this->call([
            AfpSeeder::class,
            IsapresSeeder::class,
        ]);
    }
}