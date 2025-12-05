<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Ruta;
use App\Models\RutaParada;
use App\Models\AsignacionTurno;
use App\Models\Conductor;
use App\Models\Bus;
use App\Models\Viaje;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class DatosCompletosSeeder extends Seeder
{
    // Precio combustible promedio (CLP/litro)
    const PRECIO_COMBUSTIBLE = 1100;
    
    public function run(): void
    {
        $this->command->info('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        $this->command->info('🚀 GENERANDO DATOS COMPLETOS PARA DEFENSA');
        $this->command->info('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        
        DB::beginTransaction();
        
        try {
            // PASO 1: Rutas
            $this->command->newLine();
            $this->command->info('📍 [1/4] Creando rutas con tarifas...');
            $rutas = $this->crearRutas();
            
            // PASO 2: Turnos
            $this->command->newLine();
            $this->command->info('📅 [2/4] Generando turnos (últimos 30 días)...');
            $turnos = $this->crearTurnos($rutas);
            
            // PASO 3: Viajes
            $this->command->newLine();
            $this->command->info('🚌 [3/4] Creando viajes con recaudación y combustible...');
            $estadisticas = $this->crearViajes($turnos);
            
            // PASO 4: Resumen
            $this->command->newLine();
            $this->mostrarResumen($rutas, $turnos, $estadisticas);
            
            DB::commit();
            
        } catch (\Exception $e) {
            DB::rollBack();
            $this->command->error('❌ Error: ' . $e->getMessage());
            $this->command->error($e->getTraceAsString());
        }
    }

    private function crearRutas()
    {
        $rutasData = [
            [
                'nombre' => 'Santiago - Valparaíso Express',
                'codigo' => 'R-VAL',
                'origen' => 'Terminal Santiago',
                'destino' => 'Terminal Valparaíso',
                'distancia' => 120,
                'tarifa_adulto' => 4500,
                'tarifa_estudiante' => 3200,
                'tarifa_tercera_edad' => 2500,
            ],
            [
                'nombre' => 'Santiago - Viña del Mar',
                'codigo' => 'R-VIN',
                'origen' => 'Terminal Santiago',
                'destino' => 'Terminal Viña del Mar',
                'distancia' => 130,
                'tarifa_adulto' => 4800,
                'tarifa_estudiante' => 3400,
                'tarifa_tercera_edad' => 2700,
            ],
            [
                'nombre' => 'Santiago - Rancagua',
                'codigo' => 'R-RAN',
                'origen' => 'Terminal Santiago',
                'destino' => 'Terminal Rancagua',
                'distancia' => 87,
                'tarifa_adulto' => 3500,
                'tarifa_estudiante' => 2500,
                'tarifa_tercera_edad' => 2000,
            ],
        ];

        $rutas = collect();
        
        foreach ($rutasData as $data) {
            $ruta = Ruta::create([
                'nombre_ruta' => $data['nombre'],
                'codigo_ruta' => $data['codigo'],
                'origen' => $data['origen'],
                'destino' => $data['destino'],
                'distancia_km' => $data['distancia'],
                'tiempo_estimado_minutos' => intval($data['distancia'] * 1.5), // ~1.5 min/km
                'estado' => 'activa',
                'tarifa_base_adulto' => $data['tarifa_adulto'],
                'tarifa_base_estudiante' => $data['tarifa_estudiante'],
                'tarifa_base_tercera_edad' => $data['tarifa_tercera_edad'],
            ]);

            // Crear paradas (origen y destino)
            RutaParada::create([
                'ruta_id' => $ruta->id,
                'orden' => 1,
                'ciudad' => $data['origen'],
                'es_origen' => true,
                'tarifa_adulto' => $data['tarifa_adulto'],
                'tarifa_estudiante' => $data['tarifa_estudiante'],
                'tarifa_tercera_edad' => $data['tarifa_tercera_edad'],
            ]);

            RutaParada::create([
                'ruta_id' => $ruta->id,
                'orden' => 2,
                'ciudad' => $data['destino'],
                'es_destino' => true,
                'tarifa_adulto' => $data['tarifa_adulto'],
                'tarifa_estudiante' => $data['tarifa_estudiante'],
                'tarifa_tercera_edad' => $data['tarifa_tercera_edad'],
            ]);

            $rutas->push($ruta);
            $this->command->info("   ✓ {$data['codigo']} - {$data['nombre']} (${data['tarifa_adulto']})");
        }

        return $rutas;
    }

    private function crearTurnos($rutas)
    {
        // Obtener conductores y buses disponibles
        $conductores = Conductor::whereHas('empleado', function($q) {
            $q->where('estado', 'activo');
        })->get();

        $buses = Bus::whereIn('estado', ['operativo', 'activo'])->get();

        if ($conductores->isEmpty()) {
            $this->command->warn('   ⚠️  No hay conductores activos. Saltando creación de turnos.');
            return collect();
        }

        if ($buses->isEmpty()) {
            $this->command->warn('   ⚠️  No hay buses operativos. Saltando creación de turnos.');
            return collect();
        }

        $turnos = collect();
        $turnosPorDia = 4; // 4 turnos diarios

        // Crear turnos para los últimos 30 días
        for ($i = 30; $i >= 0; $i--) {
            $fecha = now()->subDays($i)->format('Y-m-d');
            
            for ($j = 0; $j < $turnosPorDia; $j++) {
                $ruta = $rutas->random();
                $conductor = $conductores->random();
                $bus = $buses->random();
                
                $horaInicio = sprintf('%02d:00:00', 6 + ($j * 4)); // 6am, 10am, 2pm, 6pm
                $horaTermino = sprintf('%02d:00:00', 10 + ($j * 4));

                $turno = AsignacionTurno::create([
                    'bus_id' => $bus->id,
                    'ruta_id' => $ruta->id,
                    'fecha_turno' => $fecha,
                    'hora_inicio' => $horaInicio,
                    'hora_termino' => $horaTermino,
                    'tipo_turno' => ['mañana', 'tarde', 'noche'][rand(0, 2)],
                    'estado' => 'completado',
                ]);

                // Asignar conductor al turno (tabla pivot)
                DB::table('turno_conductores')->insert([
                    'asignacion_turno_id' => $turno->id,
                    'conductor_id' => $conductor->id,
                    'rol' => 'principal',
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);

                $turnos->push($turno);
            }
        }

        $this->command->info("   ✓ {$turnos->count()} turnos creados ({$turnosPorDia} turnos/día × 31 días)");
        return $turnos;
    }

    private function crearViajes($turnos)
    {
        if ($turnos->isEmpty()) {
            $this->command->warn('   ⚠️  No hay turnos. No se pueden crear viajes.');
            return [
                'total' => 0,
                'con_alerta' => 0,
                'ineficientes' => 0
            ];
        }

        $viajesCreados = 0;
        $viajesConAlerta = 0;
        $viajesIneficientes = 0;

        foreach ($turnos as $turno) {
            // Verificar que tenga ruta
            if (!$turno->ruta) continue;

            // 1-2 viajes por turno
            $cantidadViajes = rand(1, 2);

            for ($i = 0; $i < $cantidadViajes; $i++) {
                $fechaViaje = Carbon::parse($turno->fecha_turno)
                    ->setTimeFromTimeString($turno->hora_inicio)
                    ->addHours($i * 2);

                $fechaLlegada = $fechaViaje->copy()->addHours(rand(2, 4));

                // === RECAUDACIÓN ===
                $pasajeros = rand(20, 45);
                $tarifaBase = $turno->ruta->tarifa_base_adulto;
                $dineroEsperado = $pasajeros * $tarifaBase;
                
                $factorRecaudacion = $this->obtenerFactorRecaudacion();
                $dineroRecaudado = intval($dineroEsperado * $factorRecaudacion);
                
                $diferenciaPorcentaje = round((abs($dineroEsperado - $dineroRecaudado) / $dineroEsperado) * 100, 2);
                $requiereRevision = $diferenciaPorcentaje > 10;

                if ($requiereRevision) {
                    $viajesConAlerta++;
                }

                // === COMBUSTIBLE Y KILOMETRAJE ===
                $distanciaRuta = $turno->ruta->distancia_km;
                $kmRecorridos = intval($distanciaRuta * rand(95, 105) / 100); // ±5% variación
                
                // Consumo: buses eficientes 25-35 km/litro, ineficientes 15-20 km/litro
                $esIneficiente = rand(1, 100) <= 20; // 20% buses ineficientes
                $kmPorLitro = $esIneficiente ? rand(15, 20) : rand(25, 35);
                
                $combustibleLitros = round($kmRecorridos / $kmPorLitro, 2);
                $costoCombustible = intval($combustibleLitros * self::PRECIO_COMBUSTIBLE);
                $costoPorKm = intval($costoCombustible / $kmRecorridos);

                if ($esIneficiente) {
                    $viajesIneficientes++;
                }

                // Crear viaje
                Viaje::create([
                    'asignacion_turno_id' => $turno->id,
                    'codigo_viaje' => 'VJ-' . now()->format('Ymd') . '-' . str_pad($viajesCreados + 1, 4, '0', STR_PAD_LEFT),
                    'nombre_viaje' => $turno->ruta->nombre_ruta,
                    'ruta_id' => $turno->ruta_id,
                    'fecha_hora_salida' => $fechaViaje,
                    'fecha_hora_llegada' => $fechaLlegada,
                    'estado' => 'completado',
                    // Recaudación
                    'pasajeros' => $pasajeros,
                    'dinero_esperado' => $dineroEsperado,
                    'dinero_recaudado' => $dineroRecaudado,
                    'diferencia_porcentaje' => $diferenciaPorcentaje,
                    'requiere_revision' => $requiereRevision,
                    // Combustible
                    'combustible_litros' => $combustibleLitros,
                    'kilometros_recorridos' => $kmRecorridos,
                    'costo_combustible' => $costoCombustible,
                    'costo_por_km' => $costoPorKm,
                    // Observaciones
                    'observaciones' => $this->generarObservaciones($requiereRevision, $esIneficiente, $diferenciaPorcentaje, $costoPorKm),
                ]);

                $viajesCreados++;

                // Mostrar progreso cada 25 viajes
                if ($viajesCreados % 25 === 0) {
                    $this->command->info("   → Progreso: {$viajesCreados} viajes creados...");
                }
            }
        }

        return [
            'total' => $viajesCreados,
            'con_alerta' => $viajesConAlerta,
            'ineficientes' => $viajesIneficientes
        ];
    }

    private function obtenerFactorRecaudacion(): float
    {
        $rand = rand(1, 100);
        
        if ($rand <= 70) {
            // 70%: Recaudación perfecta
            return 1.0;
        } elseif ($rand <= 90) {
            // 20%: Pérdida leve (5-15%)
            return rand(85, 95) / 100;
        } else {
            // 10%: Pérdida grave (20-40%)
            return rand(60, 80) / 100;
        }
    }

    private function generarObservaciones($requiereRevision, $esIneficiente, $diferenciaPct, $costoPorKm): string
    {
        $obs = [];
        
        if ($requiereRevision) {
            $obs[] = "⚠️ ALERTA FINANCIERA: Diferencia de recaudación del {$diferenciaPct}%";
        }
        
        if ($esIneficiente) {
            $obs[] = "🔧 ALERTA OPERATIVA: Costo elevado ${$costoPorKm}/km - Revisar bus";
        }
        
        if (empty($obs)) {
            $obs[] = "✅ Viaje normal sin incidencias";
        }
        
        return implode('. ', $obs);
    }

    private function mostrarResumen($rutas, $turnos, $estadisticas)
    {
        $this->command->info('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        $this->command->info('✅ DATOS DE PRUEBA GENERADOS EXITOSAMENTE');
        $this->command->info('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        $this->command->newLine();
        
        $this->command->info("📊 RESUMEN:");
        $this->command->info("   • Rutas creadas: {$rutas->count()}");
        $this->command->info("   • Turnos programados: {$turnos->count()}");
        $this->command->info("   • Viajes completados: {$estadisticas['total']}");
        $this->command->newLine();
        
        $this->command->warn("🚨 ALERTAS GENERADAS:");
        $pctAlerta = $estadisticas['total'] > 0 ? round(($estadisticas['con_alerta'] / $estadisticas['total']) * 100) : 0;
        $this->command->warn("   • Viajes con diferencia >10%: {$estadisticas['con_alerta']} ({$pctAlerta}%)");
        
        $pctInef = $estadisticas['total'] > 0 ? round(($estadisticas['ineficientes'] / $estadisticas['total']) * 100) : 0;
        $this->command->warn("   • Buses ineficientes detectados: {$estadisticas['ineficientes']} ({$pctInef}%)");
        $this->command->newLine();
        
        $this->command->info("💡 SIGUIENTE PASO:");
        $this->command->info("   1. Prueba calcular una liquidación de conductor");
        $this->command->info("   2. Verifica que aparezcan bonos por productividad");
        $this->command->info("   3. Continúa con el Dashboard Gerencial (Día 3)");
        $this->command->newLine();
    }
}
