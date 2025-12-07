<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\Empleado;
use App\Models\Conductor;
use App\Models\Asistente;
use App\Models\Rol;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class PersonalConductorSeeder extends Seeder
{
    use WithoutModelEvents;

    private array $conductores = [
        // CONDUCTORES ORIGINALES
        ['nombre' => 'Carlos', 'apellido' => 'Sandoval', 'rut' => '15963526', 'dv' => '0', 'telefono' => '9 1111 1111', 'email' => 'carlos.sandoval@regionalsur.cl'],
        ['nombre' => 'Marcela', 'apellido' => 'Paredes', 'rut' => '9580346', 'dv' => '6', 'telefono' => '9 2222 2222', 'email' => 'marcela.paredes@regionalsur.cl'],
        ['nombre' => 'Jorge', 'apellido' => 'Riquelme', 'rut' => '2963799', 'dv' => '7', 'telefono' => '9 3333 3333', 'email' => 'jorge.riquelme@regionalsur.cl'],
        ['nombre' => 'Patricia', 'apellido' => 'Vega', 'rut' => '9667692', 'dv' => '1', 'telefono' => '9 4444 4444', 'email' => 'patricia.vega@regionalsur.cl'],
        ['nombre' => 'Felipe', 'apellido' => 'Navarrete', 'rut' => '15869017', 'dv' => '9', 'telefono' => '9 5555 5555', 'email' => 'felipe.navarrete@regionalsur.cl'],
        ['nombre' => 'Daniela', 'apellido' => 'Bravo', 'rut' => '15336785', 'dv' => 'K', 'telefono' => '9 6666 6666', 'email' => 'daniela.bravo@regionalsur.cl'],
        ['nombre' => 'Sergio', 'apellido' => 'Mora', 'rut' => '11245875', 'dv' => '1', 'telefono' => '9 7777 7777', 'email' => 'sergio.mora@regionalsur.cl'],
        ['nombre' => 'Paula', 'apellido' => 'León', 'rut' => '10561637', 'dv' => '6', 'telefono' => '9 8888 8888', 'email' => 'paula.leon@regionalsur.cl'],
        ['nombre' => 'Claudio', 'apellido' => 'Saavedra', 'rut' => '6055569', 'dv' => '9', 'telefono' => '9 9999 9999', 'email' => 'claudio.saavedra@regionalsur.cl'],
        ['nombre' => 'Andrea', 'apellido' => 'Torres', 'rut' => '13956253', 'dv' => '4', 'telefono' => '9 1010 1010', 'email' => 'andrea.torres@regionalsur.cl'],
        ['nombre' => 'Miguel', 'apellido' => 'Garrido', 'rut' => '9341956', 'dv' => '1', 'telefono' => '9 1112 1112', 'email' => 'miguel.garrido@regionalsur.cl'],
        ['nombre' => 'Carolina', 'apellido' => 'Muñoz', 'rut' => '14219918', 'dv' => '1', 'telefono' => '9 1212 1212', 'email' => 'carolina.munoz@regionalsur.cl'],
        
        // CONDUCTORES ADICIONALES (NUEVOS RUTS)
        ['nombre' => 'Roberto', 'apellido' => 'Cifuentes', 'rut' => '10022260', 'dv' => '4', 'telefono' => '9 1313 1313', 'email' => 'roberto.cifuentes@regionalsur.cl'],
        ['nombre' => 'Lorena', 'apellido' => 'Espinoza', 'rut' => '10041044', 'dv' => '3', 'telefono' => '9 1414 1414', 'email' => 'lorena.espinoza@regionalsur.cl'],
        ['nombre' => 'Eduardo', 'apellido' => 'Vargas', 'rut' => '17652744', 'dv' => '7', 'telefono' => '9 1515 1515', 'email' => 'eduardo.vargas@regionalsur.cl'],
        ['nombre' => 'Camila', 'apellido' => 'Rojas', 'rut' => '13276574', 'dv' => 'K', 'telefono' => '9 1616 1616', 'email' => 'camila.rojas@regionalsur.cl'],
        ['nombre' => 'Rodrigo', 'apellido' => 'Sepúlveda', 'rut' => '5901451', 'dv' => 'K', 'telefono' => '9 1717 1717', 'email' => 'rodrigo.sepulveda@regionalsur.cl'],
        ['nombre' => 'Francisca', 'apellido' => 'Henríquez', 'rut' => '13475266', 'dv' => '1', 'telefono' => '9 1818 1818', 'email' => 'francisca.henriquez@regionalsur.cl'],
        ['nombre' => 'Andrés', 'apellido' => 'Bustos', 'rut' => '16634642', 'dv' => '8', 'telefono' => '9 1919 1919', 'email' => 'andres.bustos@regionalsur.cl'],
        ['nombre' => 'Valentina', 'apellido' => 'Cortés', 'rut' => '14784502', 'dv' => '2', 'telefono' => '9 2020 2020', 'email' => 'valentina.cortes@regionalsur.cl'],
        ['nombre' => 'Luis', 'apellido' => 'Alarcón', 'rut' => '11018974', 'dv' => '5', 'telefono' => '9 2121 2121', 'email' => 'luis.alarcon@regionalsur.cl'],
        ['nombre' => 'Javiera', 'apellido' => 'Pinto', 'rut' => '14586538', 'dv' => '7', 'telefono' => '9 2222 2323', 'email' => 'javiera.pinto@regionalsur.cl'],
        ['nombre' => 'Gonzalo', 'apellido' => 'Reyes', 'rut' => '11410103', 'dv' => '6', 'telefono' => '9 2323 2323', 'email' => 'gonzalo.reyes@regionalsur.cl'],
        ['nombre' => 'Sofía', 'apellido' => 'Cáceres', 'rut' => '15748610', 'dv' => '1', 'telefono' => '9 2424 2424', 'email' => 'sofia.caceres@regionalsur.cl'],
        ['nombre' => 'Matías', 'apellido' => 'Fuentes', 'rut' => '16384115', 'dv' => '0', 'telefono' => '9 2525 2525', 'email' => 'matias.fuentes@regionalsur.cl'],
        ['nombre' => 'Isidora', 'apellido' => 'Contreras', 'rut' => '21117436', 'dv' => '6', 'telefono' => '9 2626 2626', 'email' => 'isidora.contreras@regionalsur.cl'],
        ['nombre' => 'Sebastián', 'apellido' => 'Valenzuela', 'rut' => '17581957', 'dv' => '6', 'telefono' => '9 2727 2727', 'email' => 'sebastian.valenzuela@regionalsur.cl'],
        ['nombre' => 'Fernanda', 'apellido' => 'Núñez', 'rut' => '10287366', 'dv' => '1', 'telefono' => '9 2828 2828', 'email' => 'fernanda.nunez@regionalsur.cl'],
        ['nombre' => 'Cristián', 'apellido' => 'Díaz', 'rut' => '7917199', 'dv' => '9', 'telefono' => '9 2929 2929', 'email' => 'cristian.diaz@regionalsur.cl'],
        ['nombre' => 'Antonia', 'apellido' => 'Salazar', 'rut' => '12205594', 'dv' => '9', 'telefono' => '9 3030 3030', 'email' => 'antonia.salazar@regionalsur.cl'],
        ['nombre' => 'Ignacio', 'apellido' => 'Medina', 'rut' => '15258337', 'dv' => '0', 'telefono' => '9 3131 3131', 'email' => 'ignacio.medina@regionalsur.cl'],
        ['nombre' => 'Catalina', 'apellido' => 'Guzmán', 'rut' => '12333749', 'dv' => '2', 'telefono' => '9 3232 3232', 'email' => 'catalina.guzman@regionalsur.cl'],
        ['nombre' => 'Nicolás', 'apellido' => 'Carrasco', 'rut' => '12205618', 'dv' => 'K', 'telefono' => '9 3333 3434', 'email' => 'nicolas.carrasco@regionalsur.cl'],
        ['nombre' => 'Josefa', 'apellido' => 'Ortiz', 'rut' => '13583516', 'dv' => '1', 'telefono' => '9 3434 3434', 'email' => 'josefa.ortiz@regionalsur.cl'],
        ['nombre' => 'Benjamín', 'apellido' => 'Villalobos', 'rut' => '20355204', 'dv' => '1', 'telefono' => '9 3535 3535', 'email' => 'benjamin.villalobos@regionalsur.cl'],
        ['nombre' => 'Martina', 'apellido' => 'Santander', 'rut' => '14080053', 'dv' => '8', 'telefono' => '9 3636 3636', 'email' => 'martina.santander@regionalsur.cl'],
        ['nombre' => 'Vicente', 'apellido' => 'Aravena', 'rut' => '16824245', 'dv' => 'K', 'telefono' => '9 3737 3737', 'email' => 'vicente.aravena@regionalsur.cl'],
    ];

    private array $asistentes = [
        ['nombre' => 'Rosa', 'apellido' => 'Pérez', 'rut' => '12456789', 'dv' => '3', 'telefono' => '9 4040 4040', 'email' => 'rosa.perez@regionalsur.cl'],
        ['nombre' => 'Pablo', 'apellido' => 'Silva', 'rut' => '13567890', 'dv' => '5', 'telefono' => '9 4141 4141', 'email' => 'pablo.silva@regionalsur.cl'],
        ['nombre' => 'Carmen', 'apellido' => 'Ramírez', 'rut' => '14678901', 'dv' => '7', 'telefono' => '9 4242 4242', 'email' => 'carmen.ramirez@regionalsur.cl'],
        ['nombre' => 'Javier', 'apellido' => 'Castro', 'rut' => '15789012', 'dv' => '9', 'telefono' => '9 4343 4343', 'email' => 'javier.castro@regionalsur.cl'],
        ['nombre' => 'Verónica', 'apellido' => 'Figueroa', 'rut' => '16890123', 'dv' => '1', 'telefono' => '9 4444 4545', 'email' => 'veronica.figueroa@regionalsur.cl'],
        ['nombre' => 'Ricardo', 'apellido' => 'Molina', 'rut' => '17901234', 'dv' => '3', 'telefono' => '9 4545 4545', 'email' => 'ricardo.molina@regionalsur.cl'],
        ['nombre' => 'Gloria', 'apellido' => 'Parra', 'rut' => '18012345', 'dv' => '5', 'telefono' => '9 4646 4646', 'email' => 'gloria.parra@regionalsur.cl'],
        ['nombre' => 'Héctor', 'apellido' => 'Navarro', 'rut' => '19123456', 'dv' => '7', 'telefono' => '9 4747 4747', 'email' => 'hector.navarro@regionalsur.cl'],
        ['nombre' => 'Isabel', 'apellido' => 'Campos', 'rut' => '20234567', 'dv' => '9', 'telefono' => '9 4848 4848', 'email' => 'isabel.campos@regionalsur.cl'],
        ['nombre' => 'Manuel', 'apellido' => 'Soto', 'rut' => '21345678', 'dv' => 'K', 'telefono' => '9 4949 4949', 'email' => 'manuel.soto@regionalsur.cl'],
    ];

    public function run(): void
    {
        $conductorRol = Rol::where('nombre', 'Conductor')->first();
        $asistenteRol = Rol::where('nombre', 'Asistente')->first();

        $this->command->info('👨‍✈️ Creando conductores...');
        foreach ($this->conductores as $index => $persona) {
            $user = User::firstOrCreate(
                ['email' => $persona['email']],
                [
                    'nombre' => $persona['nombre'],
                    'apellido' => $persona['apellido'],
                    'rut' => $persona['rut'],
                    'rut_verificador' => $persona['dv'],
                    'password' => Hash::make('123456'),
                    'rol_id' => $conductorRol?->id,
                    'estado' => 'activo',
                ]
            );

            $empleado = Empleado::firstOrCreate(
                ['user_id' => $user->id],
                [
                    'numero_empleado' => Empleado::generarNumeroEmpleado(),
                    'numero_funcional' => 'C-' . str_pad((string)($index + 1), 4, '0', STR_PAD_LEFT),
                    'fecha_contratacion' => now()->subMonths(rand(6, 48))->format('Y-m-d'),
                    'tipo_contrato' => 'indefinido',
                    'salario_base' => rand(850000, 1200000),
                    'afp_id' => rand(1, 7),
                    'tipo_fonasa' => ['A', 'B', 'C', 'D'][rand(0, 3)],
                    'isapre_id' => rand(1, 7),
                    'numero_seguro_cesantia' => 'SEC-' . str_pad((string)($index + 1), 5, '0', STR_PAD_LEFT),
                    'estado' => 'activo',
                    'ciudad' => ['Temuco', 'Valdivia', 'Osorno', 'Puerto Montt'][rand(0, 3)],
                    'direccion' => 'Calle ' . ($index + 1) . ', Base Regional Sur',
                    'telefono_personal' => $persona['telefono'],
                    'fecha_nacimiento' => now()->subYears(rand(28, 55))->startOfMonth()->format('Y-m-d'),
                    'genero' => in_array($persona['nombre'], ['Carlos', 'Jorge', 'Felipe', 'Sergio', 'Claudio', 'Miguel', 'Roberto', 'Eduardo', 'Rodrigo', 'Andrés', 'Luis', 'Gonzalo', 'Matías', 'Sebastián', 'Cristián', 'Ignacio', 'Nicolás', 'Benjamín', 'Vicente']) ? 'masculino' : 'femenino',
                    'contacto_emergencia_nombre' => 'Contacto de ' . $persona['nombre'],
                    'contacto_emergencia_telefono' => '9 ' . rand(5000, 9999) . ' ' . rand(5000, 9999),
                    'banco' => ['BancoEstado', 'Banco de Chile', 'Santander', 'BCI'][rand(0, 3)],
                    'tipo_cuenta' => ['vista', 'corriente'][rand(0, 1)],
                    'numero_cuenta' => '10' . str_pad((string)($index + 1), 8, '0', STR_PAD_LEFT),
                ]
            );

            Conductor::firstOrCreate(
                ['empleado_id' => $empleado->id],
                [
                    'numero_licencia' => 'LIC-' . str_pad((string)($empleado->id), 6, '0', STR_PAD_LEFT),
                    'clase_licencia' => 'A',
                    'fecha_vencimiento_licencia' => now()->addYears(rand(2, 5))->format('Y-m-d'),
                    'estado' => 'activo',
                    'anios_experiencia' => rand(3, 20),
                    'fecha_primera_licencia' => now()->subYears(rand(5, 22))->startOfYear()->format('Y-m-d'),
                    'estado_licencia' => 'vigente',
                    'observaciones_licencia' => null,
                    'cantidad_infracciones' => rand(0, 2),
                    'cantidad_accidentes' => rand(0, 1),
                    'historial_sanciones' => null,
                    'fecha_examen_ocupacional' => now()->subMonths(rand(1, 11))->format('Y-m-d'),
                    'apto_conducir' => true,
                    'certificado_rcp' => [true, false][rand(0, 1)],
                    'vencimiento_rcp' => now()->addYears(2)->format('Y-m-d'),
                    'certificado_defensa' => [true, false][rand(0, 1)],
                    'vencimiento_defensa' => now()->addYears(2)->format('Y-m-d'),
                ]
            );
        }
        $this->command->info("   ✅ " . count($this->conductores) . " conductores creados");

        $this->command->newLine();
        $this->command->info('👥 Creando asistentes...');
        foreach ($this->asistentes as $index => $persona) {
            $user = User::firstOrCreate(
                ['email' => $persona['email']],
                [
                    'nombre' => $persona['nombre'],
                    'apellido' => $persona['apellido'],
                    'rut' => $persona['rut'],
                    'rut_verificador' => $persona['dv'],
                    'password' => Hash::make('123456'),
                    'rol_id' => $asistenteRol?->id,
                    'estado' => 'activo',
                ]
            );

            $empleado = Empleado::firstOrCreate(
                ['user_id' => $user->id],
                [
                    'numero_empleado' => Empleado::generarNumeroEmpleado(),
                    'numero_funcional' => 'A-' . str_pad((string)($index + 1), 4, '0', STR_PAD_LEFT),
                    'fecha_contratacion' => now()->subMonths(rand(6, 36))->format('Y-m-d'),
                    'tipo_contrato' => 'indefinido',
                    'salario_base' => rand(650000, 850000),
                    'afp_id' => rand(1, 7),
                    'tipo_fonasa' => ['A', 'B', 'C', 'D'][rand(0, 3)],
                    'isapre_id' => rand(1, 7),
                    'numero_seguro_cesantia' => 'SEC-A-' . str_pad((string)($index + 1), 5, '0', STR_PAD_LEFT),
                    'estado' => 'activo',
                    'ciudad' => ['Temuco', 'Valdivia', 'Osorno', 'Puerto Montt'][rand(0, 3)],
                    'direccion' => 'Avenida ' . ($index + 1) . ', Base Regional Sur',
                    'telefono_personal' => $persona['telefono'],
                    'fecha_nacimiento' => now()->subYears(rand(22, 50))->startOfMonth()->format('Y-m-d'),
                    'genero' => in_array($persona['nombre'], ['Pablo', 'Javier', 'Ricardo', 'Héctor', 'Manuel']) ? 'masculino' : 'femenino',
                    'contacto_emergencia_nombre' => 'Contacto de ' . $persona['nombre'],
                    'contacto_emergencia_telefono' => '9 ' . rand(5000, 9999) . ' ' . rand(5000, 9999),
                    'banco' => ['BancoEstado', 'Banco de Chile', 'Santander', 'BCI'][rand(0, 3)],
                    'tipo_cuenta' => ['vista', 'corriente'][rand(0, 1)],
                    'numero_cuenta' => '20' . str_pad((string)($index + 1), 8, '0', STR_PAD_LEFT),
                ]
            );

            Asistente::firstOrCreate(
                ['empleado_id' => $empleado->id],
                [
                    'fecha_inicio' => $empleado->fecha_contratacion,
                    'estado' => 'activo',
                    'fecha_examen_ocupacional' => now()->subMonths(rand(1, 11))->format('Y-m-d'),
                ]
            );
        }
        $this->command->info("   ✅ " . count($this->asistentes) . " asistentes creados");
    }
}