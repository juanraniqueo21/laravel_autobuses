<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\MarcaBus;
use App\Models\ModeloBus;

class CatalogosBusesSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // ============================================
        // MARCAS Y MODELOS DE BUSES
        // ============================================
        
        // Mercedes-Benz Buses
        $mercedesBus = MarcaBus::create([
            'nombre' => 'Mercedes-Benz',
            'tipo' => 'bus',
            'activo' => true,
        ]);
        
        ModeloBus::insert([
            ['marca_id' => $mercedesBus->id, 'nombre' => 'O-500', 'tipo' => 'bus', 'activo' => true, 'created_at' => now(), 'updated_at' => now()],
            ['marca_id' => $mercedesBus->id, 'nombre' => 'O-500R', 'tipo' => 'bus', 'activo' => true, 'created_at' => now(), 'updated_at' => now()],
            ['marca_id' => $mercedesBus->id, 'nombre' => 'O-500RS', 'tipo' => 'bus', 'activo' => true, 'created_at' => now(), 'updated_at' => now()],
            ['marca_id' => $mercedesBus->id, 'nombre' => 'OF-1721', 'tipo' => 'bus', 'activo' => true, 'created_at' => now(), 'updated_at' => now()],
            ['marca_id' => $mercedesBus->id, 'nombre' => 'OF-1724', 'tipo' => 'bus', 'activo' => true, 'created_at' => now(), 'updated_at' => now()],
        ]);
        
        // Volvo Buses
        $volvoBus = MarcaBus::create([
            'nombre' => 'Volvo',
            'tipo' => 'bus',
            'activo' => true,
        ]);
        
        ModeloBus::insert([
            ['marca_id' => $volvoBus->id, 'nombre' => 'B270F', 'tipo' => 'bus', 'activo' => true, 'created_at' => now(), 'updated_at' => now()],
            ['marca_id' => $volvoBus->id, 'nombre' => 'B340M', 'tipo' => 'bus', 'activo' => true, 'created_at' => now(), 'updated_at' => now()],
            ['marca_id' => $volvoBus->id, 'nombre' => 'B12M', 'tipo' => 'bus', 'activo' => true, 'created_at' => now(), 'updated_at' => now()],
            ['marca_id' => $volvoBus->id, 'nombre' => 'B7R', 'tipo' => 'bus', 'activo' => true, 'created_at' => now(), 'updated_at' => now()],
        ]);
        
        // Scania Buses
        $scaniaBus = MarcaBus::create([
            'nombre' => 'Scania',
            'tipo' => 'bus',
            'activo' => true,
        ]);
        
        ModeloBus::insert([
            ['marca_id' => $scaniaBus->id, 'nombre' => 'K310', 'tipo' => 'bus', 'activo' => true, 'created_at' => now(), 'updated_at' => now()],
            ['marca_id' => $scaniaBus->id, 'nombre' => 'K340', 'tipo' => 'bus', 'activo' => true, 'created_at' => now(), 'updated_at' => now()],
            ['marca_id' => $scaniaBus->id, 'nombre' => 'K380', 'tipo' => 'bus', 'activo' => true, 'created_at' => now(), 'updated_at' => now()],
        ]);
        
        // Marcopolo Buses
        $marcopolo = MarcaBus::create([
            'nombre' => 'Marcopolo',
            'tipo' => 'bus',
            'activo' => true,
        ]);
        
        ModeloBus::insert([
            ['marca_id' => $marcopolo->id, 'nombre' => 'Paradiso 1200', 'tipo' => 'bus', 'activo' => true, 'created_at' => now(), 'updated_at' => now()],
            ['marca_id' => $marcopolo->id, 'nombre' => 'Paradiso 1800', 'tipo' => 'bus', 'activo' => true, 'created_at' => now(), 'updated_at' => now()],
            ['marca_id' => $marcopolo->id, 'nombre' => 'Viaggio 1050', 'tipo' => 'bus', 'activo' => true, 'created_at' => now(), 'updated_at' => now()],
        ]);

        // ============================================
        // MARCAS Y MODELOS DE MOTORES
        // ============================================
        
        // Mercedes-Benz Motores
        $mercedesMotor = MarcaBus::create([
            'nombre' => 'Mercedes-Benz',
            'tipo' => 'motor',
            'activo' => true,
        ]);
        
        ModeloBus::insert([
            ['marca_id' => $mercedesMotor->id, 'nombre' => 'OM-457', 'tipo' => 'motor', 'activo' => true, 'created_at' => now(), 'updated_at' => now()],
            ['marca_id' => $mercedesMotor->id, 'nombre' => 'OM-906', 'tipo' => 'motor', 'activo' => true, 'created_at' => now(), 'updated_at' => now()],
            ['marca_id' => $mercedesMotor->id, 'nombre' => 'OM-924', 'tipo' => 'motor', 'activo' => true, 'created_at' => now(), 'updated_at' => now()],
        ]);
        
        // Cummins Motores
        $cummins = MarcaBus::create([
            'nombre' => 'Cummins',
            'tipo' => 'motor',
            'activo' => true,
        ]);
        
        ModeloBus::insert([
            ['marca_id' => $cummins->id, 'nombre' => 'ISB 6.7', 'tipo' => 'motor', 'activo' => true, 'created_at' => now(), 'updated_at' => now()],
            ['marca_id' => $cummins->id, 'nombre' => 'ISL', 'tipo' => 'motor', 'activo' => true, 'created_at' => now(), 'updated_at' => now()],
            ['marca_id' => $cummins->id, 'nombre' => 'ISX15', 'tipo' => 'motor', 'activo' => true, 'created_at' => now(), 'updated_at' => now()],
        ]);
        
        // Volvo Motores
        $volvoMotor = MarcaBus::create([
            'nombre' => 'Volvo',
            'tipo' => 'motor',
            'activo' => true,
        ]);
        
        ModeloBus::insert([
            ['marca_id' => $volvoMotor->id, 'nombre' => 'D11', 'tipo' => 'motor', 'activo' => true, 'created_at' => now(), 'updated_at' => now()],
            ['marca_id' => $volvoMotor->id, 'nombre' => 'D13', 'tipo' => 'motor', 'activo' => true, 'created_at' => now(), 'updated_at' => now()],
        ]);

        // ============================================
        // MARCAS Y MODELOS DE CHASIS
        // ============================================
        
        // Mercedes-Benz Chasis
        $mercedesChasis = MarcaBus::create([
            'nombre' => 'Mercedes-Benz',
            'tipo' => 'chasis',
            'activo' => true,
        ]);
        
        ModeloBus::insert([
            ['marca_id' => $mercedesChasis->id, 'nombre' => 'OF-1721', 'tipo' => 'chasis', 'activo' => true, 'created_at' => now(), 'updated_at' => now()],
            ['marca_id' => $mercedesChasis->id, 'nombre' => 'OF-1724', 'tipo' => 'chasis', 'activo' => true, 'created_at' => now(), 'updated_at' => now()],
            ['marca_id' => $mercedesChasis->id, 'nombre' => 'O-500', 'tipo' => 'chasis', 'activo' => true, 'created_at' => now(), 'updated_at' => now()],
        ]);
        
        // Volvo Chasis
        $volvoChasis = MarcaBus::create([
            'nombre' => 'Volvo',
            'tipo' => 'chasis',
            'activo' => true,
        ]);
        
        ModeloBus::insert([
            ['marca_id' => $volvoChasis->id, 'nombre' => 'B270F', 'tipo' => 'chasis', 'activo' => true, 'created_at' => now(), 'updated_at' => now()],
            ['marca_id' => $volvoChasis->id, 'nombre' => 'B340M', 'tipo' => 'chasis', 'activo' => true, 'created_at' => now(), 'updated_at' => now()],
        ]);
        
        // Scania Chasis
        $scaniaChasis = MarcaBus::create([
            'nombre' => 'Scania',
            'tipo' => 'chasis',
            'activo' => true,
        ]);
        
        ModeloBus::insert([
            ['marca_id' => $scaniaChasis->id, 'nombre' => 'K310', 'tipo' => 'chasis', 'activo' => true, 'created_at' => now(), 'updated_at' => now()],
            ['marca_id' => $scaniaChasis->id, 'nombre' => 'K380', 'tipo' => 'chasis', 'activo' => true, 'created_at' => now(), 'updated_at' => now()],
        ]);

        // ============================================
        // MARCAS Y MODELOS DE CARROCERÍAS
        // ============================================
        
        // Marcopolo Carrocerías
        $marcopoloCarr = MarcaBus::create([
            'nombre' => 'Marcopolo',
            'tipo' => 'carroceria',
            'activo' => true,
        ]);
        
        ModeloBus::insert([
            ['marca_id' => $marcopoloCarr->id, 'nombre' => 'Paradiso 1200', 'tipo' => 'carroceria', 'activo' => true, 'created_at' => now(), 'updated_at' => now()],
            ['marca_id' => $marcopoloCarr->id, 'nombre' => 'Paradiso 1800', 'tipo' => 'carroceria', 'activo' => true, 'created_at' => now(), 'updated_at' => now()],
            ['marca_id' => $marcopoloCarr->id, 'nombre' => 'Viaggio', 'tipo' => 'carroceria', 'activo' => true, 'created_at' => now(), 'updated_at' => now()],
            ['marca_id' => $marcopoloCarr->id, 'nombre' => 'Andare', 'tipo' => 'carroceria', 'activo' => true, 'created_at' => now(), 'updated_at' => now()],
        ]);
        
        // Caio Carrocerías
        $caio = MarcaBus::create([
            'nombre' => 'Caio',
            'tipo' => 'carroceria',
            'activo' => true,
        ]);
        
        ModeloBus::insert([
            ['marca_id' => $caio->id, 'nombre' => 'Apache Vip', 'tipo' => 'carroceria', 'activo' => true, 'created_at' => now(), 'updated_at' => now()],
            ['marca_id' => $caio->id, 'nombre' => 'Millennium', 'tipo' => 'carroceria', 'activo' => true, 'created_at' => now(), 'updated_at' => now()],
        ]);
        
        // Metalpar Carrocerías
        $metalpar = MarcaBus::create([
            'nombre' => 'Metalpar',
            'tipo' => 'carroceria',
            'activo' => true,
        ]);
        
        ModeloBus::insert([
            ['marca_id' => $metalpar->id, 'nombre' => 'Tronador', 'tipo' => 'carroceria', 'activo' => true, 'created_at' => now(), 'updated_at' => now()],
            ['marca_id' => $metalpar->id, 'nombre' => 'Pucará', 'tipo' => 'carroceria', 'activo' => true, 'created_at' => now(), 'updated_at' => now()],
        ]);
    }
}